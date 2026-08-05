import { useState } from 'react';
import { emitAck } from '../lib/socket.js';
import { useStore } from '../lib/store.js';

export default function ActionBar({ game, self, onOpenTrade, onRolled }) {
  const { setError } = useStore();
  const [busy, setBusy] = useState(false);
  const myTurn = game.status === 'playing' && game.players[game.turnIndex]?.id === self?.id;

  async function act(event, payload) {
    setBusy(true);
    try {
      await emitAck(event, payload);
      if (event === 'game:rollDice') onRolled?.();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  if (!self || self.bankrupt) {
    return (
      <div className="text-center text-parchment-300/50 text-sm py-3">
        {self?.bankrupt ? 'You are out of the game — spectating.' : ''}
      </div>
    );
  }

  if (!myTurn) {
    const current = game.players[game.turnIndex];
    return (
      <div className="text-center text-parchment-300/60 text-sm py-3">
        Waiting on <span className="text-gold-400 font-semibold">{current?.name}</span>…
      </div>
    );
  }

  const space = game.pendingSpace !== null ? game.board[game.pendingSpace] : null;

  return (
    <div className="flex flex-wrap items-center gap-2 justify-center">
      {game.turnPhase === 'roll' && self.inJail && (
        <>
          <ActionButton onClick={() => act('game:payJailFine')} disabled={busy || self.money < 50}>
            Pay Rs 50 to leave Jail
          </ActionButton>
          {self.getOutOfJailCards > 0 && (
            <ActionButton onClick={() => act('game:useJailCard')} disabled={busy}>
              Use Get Out of Jail Free
            </ActionButton>
          )}
          <ActionButton primary onClick={() => act('game:rollDice')} disabled={busy}>
            Roll for doubles
          </ActionButton>
        </>
      )}

      {game.turnPhase === 'roll' && !self.inJail && (
        <ActionButton primary onClick={() => act('game:rollDice')} disabled={busy}>
          🎲 Roll Dice
        </ActionButton>
      )}

      {game.turnPhase === 'resolve' && space && (
        <>
          <span className="text-sm text-parchment-200 mr-1">
            Buy <b>{space.name}</b> for <span className="text-gold-400 font-mono-num">Rs {space.price}</span>?
          </span>
          <ActionButton
            primary
            onClick={() => act('game:buyProperty')}
            disabled={busy || self.money < space.price}
          >
            Buy
          </ActionButton>
          <ActionButton onClick={() => act('game:declineProperty')} disabled={busy}>
            Decline (Auction)
          </ActionButton>
        </>
      )}

      {game.turnPhase === 'action' && (
        <>
          <ActionButton onClick={onOpenTrade} disabled={busy}>
            Trade
          </ActionButton>
          <ActionButton primary onClick={() => act('game:endTurn')} disabled={busy}>
            End Turn
          </ActionButton>
        </>
      )}
    </div>
  );
}

function ActionButton({ children, primary, ...props }) {
  return (
    <button
      {...props}
      className={`px-4 py-2 rounded-lg text-sm font-bold transition disabled:opacity-40 disabled:cursor-not-allowed ${
        primary
          ? 'bg-gold-500 hover:bg-gold-400 text-ink-900'
          : 'bg-felt-800 hover:bg-felt-700 border border-gold-600/30 text-parchment-100'
      }`}
    >
      {children}
    </button>
  );
}
