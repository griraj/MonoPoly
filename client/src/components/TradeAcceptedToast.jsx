import { useMemo } from 'react';
import { useStore } from '../lib/store.js';

export default function TradeAcceptedToast() {
  const { game } = useStore();
  const lastAccepted = useMemo(() => {
    if (!game || !game.log?.length) return null;
    const acceptedLine = [...game.log].reverse().find((entry) => entry.message?.includes('Trade between') && entry.message.includes('was accepted'));
    return acceptedLine?.message || null;
  }, [game]);

  if (!lastAccepted) return null;
  return (
    <div className="fixed top-5 right-5 z-50 rounded-3xl bg-emerald-900/95 border border-emerald-500/40 px-4 py-3 text-sm font-semibold text-emerald-100 shadow-lg">
      {lastAccepted}
    </div>
  );
}
