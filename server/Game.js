import { BOARD, COLOR_GROUPS, RAILROAD_RENTS, PLAYER_COLORS, JAIL_POSITION, GO_TO_JAIL_POSITION, GO_SALARY } from './board.js';
import { CHANCE_CARDS, COMMUNITY_CHEST_CARDS, shuffle } from './cards.js';

const STARTING_MONEY = 1500;
const MAX_HOUSES_PER_PROPERTY = 4; // then hotel

function ownsFullColorGroup(game, playerId, color) {
  const groupIds = COLOR_GROUPS[color] || [];
  return groupIds.length > 0 && groupIds.every((id) => game.properties[id].owner === playerId);
}

export class Game {
  constructor(code, hostId, hostName, settings = {}) {
    this.code = code;
    this.hostId = hostId;
    this.status = 'lobby'; // lobby | playing | ended
    this.players = [];
    this.turnIndex = 0;
    this.properties = {};
    BOARD.forEach((s) => {
      if (s.type === 'property' || s.type === 'railroad' || s.type === 'utility') {
        this.properties[s.id] = { owner: null, houses: 0, mortgaged: false };
      }
    });
    this.chanceDeck = shuffle(CHANCE_CARDS);
    this.chanceIndex = 0;
    this.communityDeck = shuffle(COMMUNITY_CHEST_CARDS);
    this.communityIndex = 0;
    this.lastDice = [1, 1];
    this.doublesStreak = 0;
    this.turnPhase = 'roll'; // roll | resolve | action | auction
    this.pendingSpace = null; // space id awaiting buy/decline decision
    this.auction = null;
    this.trades = {};
    this.log = [];
    this.freeParkingPot = 0;
    this.settings = {
      freeParkingBonus: !!settings.freeParkingBonus,
      startingMoney: settings.startingMoney || STARTING_MONEY,
    };
    this.winner = null;
    this.addPlayer(hostId, hostName);
  }

  pushLog(message) {
    this.log.push({ message, ts: Date.now() });
    if (this.log.length > 200) this.log.shift();
  }

  addPlayer(id, name) {
    if (this.players.find((p) => p.id === id)) return;
    if (this.players.length >= 6) throw new Error('Lobby is full');
    const usedColors = this.players.map((p) => p.color);
    const color = PLAYER_COLORS.find((c) => !usedColors.includes(c));
    this.players.push({
      id,
      name,
      color,
      money: this.settings.startingMoney,
      position: 0,
      properties: [],
      inJail: false,
      jailTurns: 0,
      getOutOfJailCards: 0,
      bankrupt: false,
      connected: true,
      ready: false,
    });
    this.pushLog(`${name} joined the game.`);
  }

  removePlayer(id) {
    const p = this.players.find((pl) => pl.id === id);
    if (!p) return;
    if (this.status === 'lobby') {
      this.players = this.players.filter((pl) => pl.id !== id);
      if (this.hostId === id && this.players.length > 0) this.hostId = this.players[0].id;
    } else {
      p.connected = false;
      this.pushLog(`${p.name} disconnected.`);
    }
  }

  reconnectPlayer(id) {
    const p = this.players.find((pl) => pl.id === id);
    if (p) {
      p.connected = true;
      this.pushLog(`${p.name} reconnected.`);
    }
  }

  getPlayer(id) {
    return this.players.find((p) => p.id === id);
  }

  currentPlayer() {
    return this.players[this.turnIndex];
  }

  activePlayers() {
    return this.players.filter((p) => !p.bankrupt);
  }

  startGame() {
    if (this.players.length < 3) throw new Error('Need at least 3 players to start');
    this.status = 'playing';
    this.turnIndex = 0;
    this.pushLog('The game has started. ' + this.currentPlayer().name + ' goes first.');
  }

  assertTurn(playerId) {
    if (this.status !== 'playing') throw new Error('Game is not in progress');
    if (this.currentPlayer().id !== playerId) throw new Error("It is not your turn");
  }

  // ---------- Dice / Movement ----------

  rollDice(playerId) {
    this.assertTurn(playerId);
    if (this.turnPhase !== 'roll') throw new Error('You cannot roll right now');
    const player = this.currentPlayer();
    const d1 = 1 + Math.floor(Math.random() * 6);
    const d2 = 1 + Math.floor(Math.random() * 6);
    this.lastDice = [d1, d2];
    const isDouble = d1 === d2;

    if (player.inJail) {
      if (isDouble) {
        player.inJail = false;
        player.jailTurns = 0;
        this.pushLog(`${player.name} rolled doubles and got out of jail.`);
        this.movePlayer(player, d1 + d2);
      } else {
        player.jailTurns += 1;
        if (player.jailTurns >= 3) {
          player.inJail = false;
          player.jailTurns = 0;
          player.money -= 50;
          this.pushLog(`${player.name} failed to roll doubles 3 times, paid $50 and left jail.`);
          this.movePlayer(player, d1 + d2);
        } else {
          this.pushLog(`${player.name} rolled ${d1}+${d2} and stayed in jail.`);
          this.turnPhase = 'action';
          return { dice: this.lastDice, stayedInJail: true };
        }
      }
      return { dice: this.lastDice };
    }

    if (isDouble) {
      this.doublesStreak += 1;
      if (this.doublesStreak === 3) {
        this.pushLog(`${player.name} rolled doubles 3 times in a row and was sent to Jail!`);
        this.sendToJail(player);
        this.turnPhase = 'action';
        this.doublesStreak = 0;
        return { dice: this.lastDice, sentToJail: true };
      }
    } else {
      this.doublesStreak = 0;
    }

    this.movePlayer(player, d1 + d2);
    return { dice: this.lastDice, isDouble };
  }

  movePlayer(player, spaces) {
    const prev = player.position;
    let next = (prev + spaces) % 40;
    if (next < 0) next += 40;
    if (next < prev && spaces > 0) {
      player.money += GO_SALARY;
      this.pushLog(`${player.name} passed GO and collected $200.`);
    }
    player.position = next;
    this.resolveSpace(player);
  }

  sendToJail(player) {
    player.position = JAIL_POSITION;
    player.inJail = true;
    player.jailTurns = 0;
  }

  resolveSpace(player) {
    const space = BOARD[player.position];
    this.pushLog(`${player.name} landed on ${space.name}.`);

    switch (space.type) {
      case 'go':
        this.turnPhase = 'action';
        break;
      case 'property':
      case 'railroad':
      case 'utility': {
        const propState = this.properties[space.id];
        if (!propState.owner) {
          this.pendingSpace = space.id;
          this.turnPhase = 'resolve'; // waiting for buy/decline
        } else if (propState.owner !== player.id && !propState.mortgaged) {
          this.payRent(player, space);
          this.turnPhase = 'action';
        } else {
          this.turnPhase = 'action';
        }
        break;
      }
      case 'tax':
        player.money -= space.amount;
        this.freeParkingPot += space.amount;
        this.pushLog(`${player.name} paid $${space.amount} in tax.`);
        this.turnPhase = 'action';
        this.checkBankruptcy(player, null);
        break;
      case 'chance':
        this.drawCard(player, 'chance');
        break;
      case 'community_chest':
        this.drawCard(player, 'community');
        break;
      case 'go_to_jail':
        this.sendToJail(player);
        this.pushLog(`${player.name} was sent to Jail.`);
        this.turnPhase = 'action';
        break;
      case 'free_parking':
        if (this.settings.freeParkingBonus && this.freeParkingPot > 0) {
          player.money += this.freeParkingPot;
          this.pushLog(`${player.name} collected $${this.freeParkingPot} from Free Parking!`);
          this.freeParkingPot = 0;
        }
        this.turnPhase = 'action';
        break;
      case 'jail':
      default:
        this.turnPhase = 'action';
        break;
    }
  }

  drawCard(player, deckName) {
    let card;
    if (deckName === 'chance') {
      if (this.chanceIndex >= this.chanceDeck.length) {
        this.chanceDeck = shuffle(CHANCE_CARDS);
        this.chanceIndex = 0;
      }
      card = this.chanceDeck[this.chanceIndex++];
    } else {
      if (this.communityIndex >= this.communityDeck.length) {
        this.communityDeck = shuffle(COMMUNITY_CHEST_CARDS);
        this.communityIndex = 0;
      }
      card = this.communityDeck[this.communityIndex++];
    }
    this.pushLog(`${player.name} drew: ${card.text}`);
    this.lastCard = { deck: deckName, text: card.text };
    this.applyCard(player, card);
  }

  applyCard(player, card) {
    switch (card.type) {
      case 'advance_to':
        this.movePlayer(player, (card.pos - player.position + 40) % 40);
        return; // movePlayer already sets phase via resolveSpace
      case 'move_relative': {
        let target = player.position + card.spaces;
        if (target < 0) target += 40;
        this.movePlayer(player, card.spaces < 0 ? card.spaces + 40 : card.spaces);
        return;
      }
      case 'collect':
        player.money += card.amount;
        break;
      case 'pay':
        player.money -= card.amount;
        this.checkBankruptcy(player, null);
        break;
      case 'collect_from_each':
        this.players.forEach((p) => {
          if (p.id !== player.id && !p.bankrupt) {
            p.money -= card.amount;
            player.money += card.amount;
          }
        });
        break;
      case 'pay_each_player':
        this.players.forEach((p) => {
          if (p.id !== player.id && !p.bankrupt) {
            p.money -= card.amount;
            player.money += card.amount;
          }
        });
        break;
      case 'get_out_of_jail':
        player.getOutOfJailCards += 1;
        break;
      case 'go_to_jail':
        this.sendToJail(player);
        break;
      case 'repairs': {
        let total = 0;
        player.properties.forEach((id) => {
          const ps = this.properties[id];
          if (ps.houses === 5) total += card.hotel;
          else total += ps.houses * card.house;
        });
        player.money -= total;
        this.checkBankruptcy(player, null);
        break;
      }
      case 'nearest_railroad': {
        const railroads = BOARD.filter((s) => s.type === 'railroad').map((s) => s.id);
        const next = railroads.find((id) => id > player.position) ?? railroads[0];
        this.movePlayer(player, (next - player.position + 40) % 40);
        const propState = this.properties[next];
        if (propState.owner && propState.owner !== player.id) {
          const count = this.players.find((p) => p.id === propState.owner).properties.filter((id) => BOARD[id].type === 'railroad').length;
          const rent = RAILROAD_RENTS[Math.min(count - 1, 3)] * 2;
          player.money -= rent;
          this.players.find((p) => p.id === propState.owner).money += rent;
          this.pushLog(`${player.name} paid $${rent} rent (double railroad rent from Chance).`);
          this.checkBankruptcy(player, propState.owner);
        }
        return;
      }
      case 'nearest_utility': {
        const utils = BOARD.filter((s) => s.type === 'utility').map((s) => s.id);
        const next = utils.find((id) => id > player.position) ?? utils[0];
        this.movePlayer(player, (next - player.position + 40) % 40);
        const propState = this.properties[next];
        if (propState.owner && propState.owner !== player.id) {
          const roll = this.lastDice[0] + this.lastDice[1];
          const rent = roll * 10;
          player.money -= rent;
          this.players.find((p) => p.id === propState.owner).money += rent;
          this.pushLog(`${player.name} paid $${rent} rent (10x dice roll from Chance).`);
          this.checkBankruptcy(player, propState.owner);
        }
        return;
      }
      default:
        break;
    }
    this.turnPhase = 'action';
  }

  payRent(player, space) {
    const propState = this.properties[space.id];
    const owner = this.players.find((p) => p.id === propState.owner);
    if (!owner || owner.bankrupt) return;
    let rent = 0;
    if (space.type === 'property') {
      rent = space.rent[propState.houses];
      if (propState.houses === 0 && ownsFullColorGroup(this, owner.id, space.color)) {
        rent *= 2;
      }
    } else if (space.type === 'railroad') {
      const count = owner.properties.filter((id) => BOARD[id].type === 'railroad').length;
      rent = RAILROAD_RENTS[Math.min(count - 1, 3)];
    } else if (space.type === 'utility') {
      const count = owner.properties.filter((id) => BOARD[id].type === 'utility').length;
      const roll = this.lastDice[0] + this.lastDice[1];
      rent = roll * (count >= 2 ? 10 : 4);
    }
    player.money -= rent;
    owner.money += rent;
    this.pushLog(`${player.name} paid $${rent} rent to ${owner.name}.`);
    this.checkBankruptcy(player, owner.id);
  }

  // ---------- Buying / Auction ----------

  buyProperty(playerId) {
    this.assertTurn(playerId);
    if (this.turnPhase !== 'resolve' || this.pendingSpace === null) throw new Error('No property to buy right now');
    const player = this.currentPlayer();
    const space = BOARD[this.pendingSpace];
    if (player.money < space.price) throw new Error('Not enough money');
    const propState = this.properties[space.id];
    propState.owner = player.id;
    player.properties.push(space.id);
    player.money -= space.price;
    this.pushLog(`${player.name} bought ${space.name} for $${space.price}.`);
    this.pendingSpace = null;
    this.turnPhase = 'action';
  }

  declineProperty(playerId) {
    this.assertTurn(playerId);
    if (this.turnPhase !== 'resolve' || this.pendingSpace === null) throw new Error('No property to decline right now');
    const space = BOARD[this.pendingSpace];
    this.pushLog(`${this.currentPlayer().name} declined to buy ${space.name}. Auction starting.`);
    const order = this.activePlayers().map((p) => p.id);
    this.auction = {
      spaceId: space.id,
      currentBid: 0,
      currentBidder: null,
      order,
      turnPointer: 0,
      passed: new Set(),
    };
    this.pendingSpace = null;
    this.turnPhase = 'auction';
  }

  auctionBid(playerId, amount) {
    if (this.turnPhase !== 'auction' || !this.auction) throw new Error('No auction in progress');
    const auction = this.auction;
    if (auction.passed.has(playerId)) throw new Error('You already passed on this auction');
    const bidderId = auction.order[auction.turnPointer % auction.order.length];
    if (bidderId !== playerId) throw new Error('Not your turn to bid');
    const player = this.getPlayer(playerId);
    if (amount <= auction.currentBid) throw new Error('Bid must be higher than current bid');
    if (amount > player.money) throw new Error('Not enough money');
    auction.currentBid = amount;
    auction.currentBidder = playerId;
    this.pushLog(`${player.name} bid $${amount} in the auction.`);
    this.advanceAuction();
  }

  auctionPass(playerId) {
    if (this.turnPhase !== 'auction' || !this.auction) throw new Error('No auction in progress');
    const auction = this.auction;
    const bidderId = auction.order[auction.turnPointer % auction.order.length];
    if (bidderId !== playerId) throw new Error('Not your turn to bid');
    auction.passed.add(playerId);
    this.pushLog(`${this.getPlayer(playerId).name} passed on the auction.`);
    this.advanceAuction();
  }

  advanceAuction() {
    const auction = this.auction;
    const remaining = auction.order.filter((id) => !auction.passed.has(id));
    if (remaining.length === 0) {
      // nobody bid at all
      this.pushLog('No one bid. Property remains unowned.');
      this.endAuction();
      return;
    }
    if (remaining.length === 1 && auction.currentBidder) {
      this.finishAuction(auction.currentBidder, auction.currentBid);
      return;
    }
    if (remaining.length === 1 && !auction.currentBidder) {
      this.pushLog('No one bid. Property remains unowned.');
      this.endAuction();
      return;
    }
    // move pointer to next non-passed player
    let next = (auction.turnPointer + 1) % auction.order.length;
    while (auction.passed.has(auction.order[next])) {
      next = (next + 1) % auction.order.length;
    }
    auction.turnPointer = next;
  }

  finishAuction(winnerId, amount) {
    const auction = this.auction;
    const winner = this.getPlayer(winnerId);
    const space = BOARD[auction.spaceId];
    winner.money -= amount;
    winner.properties.push(space.id);
    this.properties[space.id].owner = winnerId;
    this.pushLog(`${winner.name} won the auction for ${space.name} at $${amount}.`);
    this.endAuction();
  }

  endAuction() {
    this.auction = null;
    this.turnPhase = 'action';
  }

  // ---------- Building ----------

  buildHouse(playerId, spaceId) {
    this.assertTurn(playerId);
    const player = this.currentPlayer();
    const space = BOARD[spaceId];
    if (!space || space.type !== 'property') throw new Error('Invalid property');
    const propState = this.properties[spaceId];
    if (propState.owner !== playerId) throw new Error('You do not own this property');
    if (propState.mortgaged) throw new Error('Cannot build on a mortgaged property');
    if (!ownsFullColorGroup(this, playerId, space.color)) throw new Error('You must own the full color group');
    if (propState.houses >= 5) throw new Error('This property already has a hotel');

    // even building rule: cannot build more than 1 house ahead of the least-built property in the group
    const groupIds = COLOR_GROUPS[space.color];
    const minHouses = Math.min(...groupIds.map((id) => this.properties[id].houses));
    if (propState.houses > minHouses) throw new Error('You must build evenly across the color group');

    const cost = space.houseCost;
    if (player.money < cost) throw new Error('Not enough money');

    if (propState.houses === 4) {
      player.money -= cost;
      propState.houses = 5; // hotel
      this.pushLog(`${player.name} built a hotel on ${space.name}.`);
    } else {
      player.money -= cost;
      propState.houses += 1;
      this.pushLog(`${player.name} built a house on ${space.name}.`);
    }
  }

  sellHouse(playerId, spaceId) {
    const player = this.getPlayer(playerId);
    const space = BOARD[spaceId];
    if (!space || space.type !== 'property') throw new Error('Invalid property');
    const propState = this.properties[spaceId];
    if (propState.owner !== playerId) throw new Error('You do not own this property');
    if (propState.houses <= 0) throw new Error('No houses to sell');

    const groupIds = COLOR_GROUPS[space.color];
    const maxHouses = Math.max(...groupIds.map((id) => this.properties[id].houses));
    if (propState.houses < maxHouses) throw new Error('You must sell evenly across the color group');

    const refund = Math.floor(space.houseCost / 2);
    player.money += refund;
    propState.houses -= 1;
    this.pushLog(`${player.name} sold a house on ${space.name} for $${refund}.`);
  }

  mortgageProperty(playerId, spaceId) {
    const player = this.getPlayer(playerId);
    const space = BOARD[spaceId];
    const propState = this.properties[spaceId];
    if (propState.owner !== playerId) throw new Error('You do not own this property');
    if (propState.houses > 0) throw new Error('Sell houses before mortgaging');
    if (propState.mortgaged) throw new Error('Already mortgaged');
    propState.mortgaged = true;
    player.money += space.mortgage;
    this.pushLog(`${player.name} mortgaged ${space.name} for $${space.mortgage}.`);
  }

  unmortgageProperty(playerId, spaceId) {
    const player = this.getPlayer(playerId);
    const space = BOARD[spaceId];
    const propState = this.properties[spaceId];
    if (propState.owner !== playerId) throw new Error('You do not own this property');
    if (!propState.mortgaged) throw new Error('Not mortgaged');
    const cost = Math.ceil(space.mortgage * 1.1);
    if (player.money < cost) throw new Error('Not enough money');
    player.money -= cost;
    propState.mortgaged = false;
    this.pushLog(`${player.name} unmortgaged ${space.name} for $${cost}.`);
  }

  // ---------- Jail ----------

  payJailFine(playerId) {
    this.assertTurn(playerId);
    const player = this.currentPlayer();
    if (!player.inJail) throw new Error('You are not in jail');
    if (player.money < 50) throw new Error('Not enough money');
    player.money -= 50;
    player.inJail = false;
    player.jailTurns = 0;
    this.pushLog(`${player.name} paid $50 to get out of jail.`);
  }

  useJailCard(playerId) {
    this.assertTurn(playerId);
    const player = this.currentPlayer();
    if (!player.inJail) throw new Error('You are not in jail');
    if (player.getOutOfJailCards <= 0) throw new Error('You have no Get Out of Jail Free cards');
    player.getOutOfJailCards -= 1;
    player.inJail = false;
    player.jailTurns = 0;
    this.pushLog(`${player.name} used a Get Out of Jail Free card.`);
  }

  // ---------- Turn management ----------

  endTurn(playerId) {
    this.assertTurn(playerId);
    if (this.turnPhase === 'resolve') throw new Error('Resolve the current space first');
    if (this.turnPhase === 'auction') throw new Error('Finish the auction first');
    const player = this.currentPlayer();
    const wasDouble = this.lastDice[0] === this.lastDice[1] && !player.inJail && this.doublesStreak > 0;
    this.pushLog(`${player.name} ended their turn.`);
    if (!wasDouble) {
      this.advanceTurnIndex();
    }
    this.turnPhase = 'roll';
    this.pendingSpace = null;
  }

  advanceTurnIndex() {
    const n = this.players.length;
    let next = (this.turnIndex + 1) % n;
    let loops = 0;
    while (this.players[next].bankrupt && loops < n) {
      next = (next + 1) % n;
      loops += 1;
    }
    this.turnIndex = next;
  }

  checkBankruptcy(player, creditorId) {
    if (player.money >= 0) return;
    const netWorth = this.netWorth(player, false);
    if (netWorth < 0) {
      // truly bankrupt - cannot be saved even by liquidating
      this.declareBankrupt(player, creditorId);
    }
    // if netWorth >= 0, player still owes money but could liquidate (client should prompt mortgaging/selling)
    // For MVP we auto-liquidate: mortgage/sell everything automatically if negative cash but positive net worth.
    if (player.money < 0 && netWorth >= 0) {
      this.autoLiquidate(player);
      if (player.money < 0) this.declareBankrupt(player, creditorId);
    }
  }

  autoLiquidate(player) {
    for (const id of [...player.properties]) {
      if (player.money >= 0) break;
      const ps = this.properties[id];
      const space = BOARD[id];
      while (ps.houses > 0 && player.money < 0) {
        this.sellHouse(player.id, id);
      }
      if (!ps.mortgaged && player.money < 0) {
        this.mortgageProperty(player.id, id);
      }
    }
  }

  netWorth(player, includeMortgageValue = true) {
    let worth = player.money;
    player.properties.forEach((id) => {
      const space = BOARD[id];
      const ps = this.properties[id];
      if (!ps.mortgaged) worth += includeMortgageValue ? space.mortgage : space.price;
      if (space.houseCost) worth += ps.houses * Math.floor(space.houseCost / 2);
    });
    return worth;
  }

  declareBankrupt(player, creditorId) {
    if (player.bankrupt) return;
    player.bankrupt = true;
    this.pushLog(`${player.name} went bankrupt!`);
    if (creditorId) {
      const creditor = this.getPlayer(creditorId);
      player.properties.forEach((id) => {
        const ps = this.properties[id];
        ps.owner = creditorId;
        ps.houses = 0; // houses returned to bank on transfer via bankruptcy for simplicity
        creditor.properties.push(id);
      });
      creditor.money += Math.max(0, player.money);
    } else {
      // owed to the bank: properties become unowned again
      player.properties.forEach((id) => {
        const ps = this.properties[id];
        ps.owner = null;
        ps.houses = 0;
        ps.mortgaged = false;
      });
    }
    player.properties = [];
    player.money = 0;

    const remaining = this.activePlayers();
    if (remaining.length === 1) {
      this.status = 'ended';
      this.winner = remaining[0].id;
      this.pushLog(`${remaining[0].name} wins the game!`);
    } else if (this.currentPlayer().id === player.id) {
      this.advanceTurnIndex();
      this.turnPhase = 'roll';
    }
  }

  // ---------- Trading ----------

  proposeTrade(fromId, toId, offer) {
    // offer: { fromMoney, toMoney, fromProperties: [], toProperties: [], fromJailCards, toJailCards }
    const id = `${fromId}-${toId}-${Date.now()}`;
    this.trades[id] = {
      id,
      fromId,
      toId,
      offer,
      status: 'pending',
      createdAt: Date.now(),
    };
    this.pushLog(`${this.getPlayer(fromId).name} proposed a trade to ${this.getPlayer(toId).name}.`);
    return id;
  }

  respondTrade(tradeId, playerId, accept) {
    const trade = this.trades[tradeId];
    if (!trade || trade.status !== 'pending') throw new Error('Trade not found');
    if (trade.toId !== playerId) throw new Error('This trade is not for you');
    if (!accept) {
      trade.status = 'rejected';
      this.pushLog(`${this.getPlayer(playerId).name} rejected the trade.`);
      return { accepted: false, message: `${this.getPlayer(playerId).name} rejected the trade.` };
    }
    const from = this.getPlayer(trade.fromId);
    const to = this.getPlayer(trade.toId);
    const { offer } = trade;

    if (from.money < (offer.fromMoney || 0)) throw new Error(`${from.name} does not have enough money`);
    if (to.money < (offer.toMoney || 0)) throw new Error(`${to.name} does not have enough money`);

    from.money -= offer.fromMoney || 0;
    to.money += offer.fromMoney || 0;
    to.money -= offer.toMoney || 0;
    from.money += offer.toMoney || 0;

    (offer.fromProperties || []).forEach((pid) => {
      this.properties[pid].owner = to.id;
      from.properties = from.properties.filter((x) => x !== pid);
      to.properties.push(pid);
    });
    (offer.toProperties || []).forEach((pid) => {
      this.properties[pid].owner = from.id;
      to.properties = to.properties.filter((x) => x !== pid);
      from.properties.push(pid);
    });

    from.getOutOfJailCards -= offer.fromJailCards || 0;
    to.getOutOfJailCards += offer.fromJailCards || 0;
    to.getOutOfJailCards -= offer.toJailCards || 0;
    from.getOutOfJailCards += offer.toJailCards || 0;

    trade.status = 'accepted';
    const message = `Trade between ${from.name} and ${to.name} was accepted.`;
    this.pushLog(message);
    return { accepted: true, message };
  }

  cancelTrade(tradeId, playerId) {
    const trade = this.trades[tradeId];
    if (!trade || trade.status !== 'pending') throw new Error('Trade not found');
    if (trade.fromId !== playerId) throw new Error('Only the proposer can cancel');
    trade.status = 'cancelled';
  }

  // ---------- Serialization ----------

  toJSON() {
    return {
      code: this.code,
      hostId: this.hostId,
      status: this.status,
      players: this.players,
      turnIndex: this.turnIndex,
      properties: this.properties,
      lastDice: this.lastDice,
      doublesStreak: this.doublesStreak,
      turnPhase: this.turnPhase,
      pendingSpace: this.pendingSpace,
      auction: this.auction ? { ...this.auction, passed: Array.from(this.auction.passed) } : null,
      trades: this.trades,
      log: this.log.slice(-50),
      freeParkingPot: this.freeParkingPot,
      settings: this.settings,
      winner: this.winner,
      lastCard: this.lastCard || null,
      board: BOARD,
    };
  }
}
