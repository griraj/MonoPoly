import { useState } from 'react';
import { useStore } from '../lib/store.js';
import Board from './Board.jsx';
import DiceTray from './DiceTray.jsx';
import PlayerDock from './PlayerDock.jsx';
import ActionBar from './ActionBar.jsx';
import ChatPanel from './ChatPanel.jsx';
import PropertyModal from './PropertyModal.jsx';
import PlayerPropertiesModal from './PlayerPropertiesModal.jsx';
import AuctionPanel from './AuctionPanel.jsx';
import TradeModal from './TradeModal.jsx';
import TradePopup from './TradePopup.jsx';
import WinnerBanner from './WinnerBanner.jsx';

export default function GameScreen() {
  const { game, session, self, leaveSession } = useStore();
  const [selectedSpace, setSelectedSpace] = useState(null);
  const [selectedPlayerId, setSelectedPlayerId] = useState(null);
  const [tradeOpen, setTradeOpen] = useState(false);
  const [rollTrigger, setRollTrigger] = useState(0);

  const me = self();
  const selectedPlayer = game.players.find((p) => p.id === selectedPlayerId) || null;

  return (
    <div className="min-h-screen p-3 sm:p-5">
      <div className="max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-[260px_1fr_300px] gap-4">
        <div className="order-2 lg:order-1 space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs uppercase tracking-widest text-gold-400/80">
              Lobby {game.code}
            </span>
            <button onClick={leaveSession} className="text-xs text-parchment-300/40 hover:text-parchment-100">
              Leave
            </button>
          </div>
          <PlayerDock
            game={game}
            selfId={session.playerId}
            selectedPlayerId={selectedPlayerId}
            onSelectPlayer={setSelectedPlayerId}
          />
        </div>

        <div className="order-1 lg:order-2 flex flex-col gap-4">
          <Board
            game={game}
            onSelectSpace={setSelectedSpace}
            onSelectPlayer={setSelectedPlayerId}
            centerContent={
              <>
                <h1 className="font-display text-3xl sm:text-4xl font-bold text-gold-400/90 tracking-wide mb-4">
                  MONOPOLY
                </h1>
                <DiceTray dice={game.lastDice} rollTrigger={rollTrigger} />
                {game.freeParkingPot > 0 && (
                  <div className="mt-3 text-xs text-parchment-300/60">
                    Free Parking pot: <span className="text-gold-400 font-mono-num">${game.freeParkingPot}</span>
                  </div>
                )}
              </>
            }
          />
          <div className="bg-felt-800/50 border border-gold-600/20 rounded-xl py-3 px-4">
            <ActionBar
              game={game}
              self={me}
              onOpenTrade={() => setTradeOpen(true)}
              onRolled={() => setRollTrigger((t) => t + 1)}
            />
          </div>
        </div>

        <div className="order-3 h-[420px] lg:h-auto">
          <ChatPanel game={game} />
        </div>
      </div>

      {selectedSpace !== null && game.board[selectedSpace].price && (
        <PropertyModal game={game} spaceId={selectedSpace} onClose={() => setSelectedSpace(null)} />
      )}
      {selectedPlayer && (
        <PlayerPropertiesModal game={game} player={selectedPlayer} onClose={() => setSelectedPlayerId(null)} />
      )}
      <TradePopup />
      {game.turnPhase === 'auction' && <AuctionPanel game={game} self={me} />}
      {tradeOpen && me && <TradeModal game={game} self={me} onClose={() => setTradeOpen(false)} />}
      {game.status === 'ended' && <WinnerBanner game={game} />}
    </div>
  );
}
