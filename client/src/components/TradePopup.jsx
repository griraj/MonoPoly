import { useMemo } from 'react';
import { emitAck } from '../lib/socket.js';
import { useStore } from '../lib/store.js';

export default function TradePopup() {
  const { game, session, setError } = useStore();
  const incoming = useMemo(() => {
    if (!game || !session) return [];
    return Object.values(game.trades || {}).filter(
      (trade) => trade.status === 'pending' && trade.toId === session.playerId
    );
  }, [game, session]);

  if (!incoming.length) return null;

  const trade = incoming[0];
  const fromPlayer = game.players.find((p) => p.id === trade.fromId);

  async function respond(accept) {
    try {
      await emitAck('trade:respond', { tradeId: trade.id, accept });
    } catch (e) {
      setError(e.message);
    }
  }

  return (
    <div className="fixed bottom-5 right-5 z-50 w-[320px] rounded-3xl border border-gold-500/30 bg-felt-950/95 shadow-2xl backdrop-blur-md text-parchment-100">
      <div className="px-4 py-3">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gold-500 text-ink-950 font-bold">⇄</div>
          <div className="flex-1">
            <div className="text-sm font-semibold">Trade request</div>
            <div className="text-xs text-parchment-300 mt-1">
              {fromPlayer?.name || 'A player'} wants to trade with you.
            </div>
            <div className="mt-3 text-[11px] text-parchment-200 space-y-1">
              {trade.offer.fromMoney > 0 && (
                <div>They offer ${trade.offer.fromMoney}</div>
              )}
              {trade.offer.toMoney > 0 && <div>They request ${trade.offer.toMoney}</div>}
              {(trade.offer.fromProperties || []).length > 0 && (
                <div>{trade.offer.fromProperties.length} property(ies) offered</div>
              )}
              {(trade.offer.toProperties || []).length > 0 && (
                <div>{trade.offer.toProperties.length} property(ies) requested</div>
              )}
            </div>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 px-4 pb-4">
        <button
          onClick={() => respond(false)}
          className="rounded-xl border border-parchment-200/15 bg-felt-900/90 py-2 text-sm text-parchment-100 hover:bg-felt-800 transition"
        >
          Decline
        </button>
        <button
          onClick={() => respond(true)}
          className="rounded-xl bg-gold-500 py-2 text-sm font-semibold text-ink-950 hover:bg-gold-400 transition"
        >
          Accept
        </button>
      </div>
    </div>
  );
}
