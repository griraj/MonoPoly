import { useStore } from '../lib/store.js';

export default function Toast() {
  const { error, toast } = useStore();
  if (!error && !toast) return null;
  const isError = !!error;
  return (
    <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50">
      <div
        className={`px-4 py-2.5 rounded-lg shadow-xl border text-sm font-medium ${
          isError
            ? 'bg-red-950/95 border-red-500/50 text-red-100'
            : 'bg-felt-800/95 border-gold-500/40 text-parchment-100'
        }`}
      >
        {error || toast}
      </div>
    </div>
  );
}
