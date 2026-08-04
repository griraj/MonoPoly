// Official Chance and Community Chest cards.
// type describes how gameLogic should resolve the card.

export const CHANCE_CARDS = [
  { text: 'Advance to GO (Collect $200)', type: 'advance_to', pos: 0 },
  { text: 'Advance to Illinois Avenue. If you pass GO, collect $200', type: 'advance_to', pos: 24 },
  { text: 'Advance to St. Charles Place. If you pass GO, collect $200', type: 'advance_to', pos: 11 },
  { text: 'Advance to the nearest Utility. If unowned, you may buy it. If owned, pay owner 10x dice roll', type: 'nearest_utility' },
  { text: 'Advance to the nearest Railroad. If unowned, you may buy it. If owned, pay owner twice the rent', type: 'nearest_railroad' },
  { text: 'Bank pays you dividend of $50', type: 'collect', amount: 50 },
  { text: 'Get Out of Jail Free', type: 'get_out_of_jail' },
  { text: 'Go Back 3 Spaces', type: 'move_relative', spaces: -3 },
  { text: 'Go to Jail. Go directly to Jail, do not pass GO, do not collect $200', type: 'go_to_jail' },
  { text: 'Make general repairs on all your property: $25 per house, $100 per hotel', type: 'repairs', house: 25, hotel: 100 },
  { text: 'Pay poor tax of $15', type: 'pay', amount: 15 },
  { text: 'Take a trip to Reading Railroad. If you pass GO, collect $200', type: 'advance_to', pos: 5 },
  { text: 'Advance to Boardwalk', type: 'advance_to', pos: 39 },
  { text: 'You have been elected Chairman of the Board. Pay each player $50', type: 'pay_each_player', amount: 50 },
  { text: 'Your building loan matures. Collect $150', type: 'collect', amount: 150 },
  { text: 'You have won a crossword competition. Collect $100', type: 'collect', amount: 100 },
];

export const COMMUNITY_CHEST_CARDS = [
  { text: 'Advance to GO (Collect $200)', type: 'advance_to', pos: 0 },
  { text: "Bank error in your favor. Collect $200", type: 'collect', amount: 200 },
  { text: "Doctor's fee. Pay $50", type: 'pay', amount: 50 },
  { text: 'From sale of stock you get $50', type: 'collect', amount: 50 },
  { text: 'Get Out of Jail Free', type: 'get_out_of_jail' },
  { text: 'Go to Jail. Go directly to Jail, do not pass GO, do not collect $200', type: 'go_to_jail' },
  { text: 'Holiday fund matures. Receive $100', type: 'collect', amount: 100 },
  { text: 'Income tax refund. Collect $20', type: 'collect', amount: 20 },
  { text: "It is your birthday. Collect $10 from every player", type: 'collect_from_each', amount: 10 },
  { text: 'Life insurance matures. Collect $100', type: 'collect', amount: 100 },
  { text: 'Pay hospital fees of $100', type: 'pay', amount: 100 },
  { text: 'Pay school fees of $150', type: 'pay', amount: 150 },
  { text: 'Receive $25 consultancy fee', type: 'collect', amount: 25 },
  { text: 'You are assessed for street repair: $40 per house, $115 per hotel', type: 'repairs', house: 40, hotel: 115 },
  { text: 'You have won second prize in a beauty contest. Collect $10', type: 'collect', amount: 10 },
  { text: 'You inherit $100', type: 'collect', amount: 100 },
];

export function shuffle(deck) {
  const arr = deck.map((c, i) => ({ ...c, id: i }));
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
