import { useEffect, useState } from 'react';
import { useStore } from './lib/store.js';
import Home from './components/Home.jsx';
import LobbyRoom from './components/LobbyRoom.jsx';
import GameScreen from './components/GameScreen.jsx';
import Toast from './components/Toast.jsx';

export default function App() {
  const { session, game, connected, tryRejoin } = useStore();
  const [rejoinAttempted, setRejoinAttempted] = useState(false);

  useEffect(() => {
    if (!connected) return;
    if (session && !rejoinAttempted) {
      tryRejoin().finally(() => setRejoinAttempted(true));
    } else if (!session) {
      setRejoinAttempted(true);
    }
  }, [connected, session, rejoinAttempted, tryRejoin]);

  let screen;
  if (!connected || !rejoinAttempted) {
    screen = <ConnectingScreen />;
  } else if (!game) {
    screen = <Home />;
  } else if (game.status === 'lobby') {
    screen = <LobbyRoom />;
  } else {
    screen = <GameScreen />;
  }

  return (
    <div className="min-h-screen felt-texture bg-felt-950">
      {screen}
      <Toast />
    </div>
  );
}

function ConnectingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center text-parchment-200">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 rounded-full border-2 border-gold-500 border-t-transparent animate-spin" />
        <p className="font-display text-lg tracking-wide">Connecting to the table…</p>
      </div>
    </div>
  );
}
