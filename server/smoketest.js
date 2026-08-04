import { io as ioc } from 'socket.io-client';

const URL = 'http://localhost:4000';

function connect() {
  return ioc(URL, { transports: ['polling', 'websocket'] });
}

function call(socket, event, payload) {
  return new Promise((resolve, reject) => {
    socket.emit(event, payload, (res) => {
      if (res && res.ok === false) reject(new Error(res.error));
      else resolve(res);
    });
  });
}

async function main() {
  const s1 = connect();
  const s2 = connect();
  await new Promise((r) => s1.on('connect', r));
  await new Promise((r) => s2.on('connect', r));

  let latestState = null;
  s1.on('game:state', (state) => { latestState = state; });
  s1.on('game:error', (e) => console.log('S1 ERROR:', e.message));
  s2.on('game:error', (e) => console.log('S2 ERROR:', e.message));

  const created = await call(s1, 'lobby:create', { name: 'Alice', settings: {} });
  console.log('Created lobby', created.code);
  const joined = await call(s2, 'lobby:join', { code: created.code, name: 'Bob' });
  console.log('Bob joined, players:', joined.state.players.map((p) => p.name));

  await call(s1, 'lobby:start', {});
  await new Promise((r) => setTimeout(r, 100));
  console.log('Game status:', latestState.status, 'turn:', latestState.players[latestState.turnIndex].name);

  for (let i = 0; i < 400 && latestState.status === 'playing'; i++) {
    const current = latestState.players[latestState.turnIndex];
    const sock = current.name === 'Alice' ? s1 : s2;
    if (latestState.turnPhase === 'roll') {
      await call(sock, 'game:rollDice', {});
    } else if (latestState.turnPhase === 'resolve') {
      // buy if affordable, else decline
      const space = latestState.board[latestState.pendingSpace];
      if (current.money >= space.price) {
        await call(sock, 'game:buyProperty', {});
      } else {
        await call(sock, 'game:declineProperty', {});
      }
    } else if (latestState.turnPhase === 'auction') {
      const auction = latestState.auction;
      const bidderId = auction.order[auction.turnPointer % auction.order.length];
      const bidderPlayer = latestState.players.find((p) => p.id === bidderId);
      const bidderSock = bidderPlayer.name === 'Alice' ? s1 : s2;
      await call(bidderSock, 'game:auctionPass', {});
    } else if (latestState.turnPhase === 'action') {
      await call(sock, 'game:endTurn', {});
    }
    await new Promise((r) => setTimeout(r, 20));
  }

  console.log('--- Final state after simulated turns ---');
  console.log('Status:', latestState.status);
  latestState.players.forEach((p) => {
    console.log(`${p.name}: $${p.money}, properties owned: ${p.properties.length}, position: ${p.position}, bankrupt: ${p.bankrupt}`);
  });
  console.log('Log tail:', latestState.log.slice(-5).map((l) => l.message));

  s1.close();
  s2.close();
  process.exit(0);
}

main().catch((e) => { console.error(e); process.exit(1); });
