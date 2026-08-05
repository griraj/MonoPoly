import { useMemo, useState } from 'react';
import { emitAck } from '../lib/socket.js';
import { useStore } from '../lib/store.js';

export default function TradeModal({ game, self, onClose }) {
  const { setError } = useStore();
  const others = game.players.filter((p) => p.id !== self.id && !p.bankrupt);
  const [targetId, setTargetId] = useState(others[0]?.id || '');
  const target = game.players.find((p) => p.id === targetId);

  const [fromMoney, setFromMoney] = useState(0);
  const [toMoney, setToMoney] = useState(0);
  const [fromProps, setFromProps] = useState([]);
  const [toProps, setToProps] = useState([]);
  const [fromJail, setFromJail] = useState(0);
  const [toJail, setToJail] = useState(0);

  const myProperties = self.properties.map((id) => game.board[id]);
  const theirProperties = (target?.properties || []).map((id) => game.board[id]);

  const pendingIncoming = useMemo(
    () => Object.values(game.trades).filter((t) => t.status === 'pending' && t.toId === self.id),
    [game.trades, self.id]
  );
  const pendingOutgoing = useMemo(
    () => Object.values(game.trades).filter((t) => t.status === 'pending' && t.fromId === self.id),
    [game.trades, self.id]
  );

  function toggle(list, setList, id) {
    setList(list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);
  }

  async function propose() {
    if (!targetId) return;
    try {
      await emitAck('trade:propose', {
        toId: targetId,
        fromMoney: Number(fromMoney) || 0,
        toMoney: Number(toMoney) || 0,
        fromProperties: fromProps,
        toProperties: toProps,
        fromJailCards: Number(fromJail) || 0,
        toJailCards: Number(toJail) || 0,
      });
      setFromMoney(0); setToMoney(0); setFromProps([]); setToProps([]); setFromJail(0); setToJail(0);
    } catch (e) {
      setError(e.message);
    }
  }

  async function respond(tradeId, accept) {
    try {
      await emitAck('trade:respond', { tradeId, accept });
    } catch (e) {
      setError(e.message);
    }
  }

  async function cancel(tradeId) {
    try {
      await emitAck('trade:cancel', { tradeId });
    } catch (e) {
      setError(e.message);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-40 flex items-center justify-center p-4" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl bg-felt-800 border border-gold-600/30 rounded-2xl shadow-2xl max-h-[85vh] overflow-y-auto scrollbar-thin"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-gold-600/20">
          <h2 className="font-display text-xl font-bold text-parchment-50">Trade</h2>
          <button onClick={onClose} className="text-parchment-200/85 hover:text-parchment-100 text-lg">✕</button>
        </div>

        <div className="p-5 space-y-5">
          {(pendingIncoming.length > 0 || pendingOutgoing.length > 0) && (
            <div className="space-y-2">
              {pendingIncoming.map((t) => (
                <div key={t.id} className="bg-felt-950/50 rounded-lg p-3 flex items-center justify-between">
                  <TradeSummary game={game} trade={t} />
                  <div className="flex gap-2 shrink-0 ml-3">
                    <button onClick={() => respond(t.id, true)} className="px-2.5 py-1 rounded bg-gold-500 text-ink-900 text-xs font-bold">Accept</button>
                    <button onClick={() => respond(t.id, false)} className="px-2.5 py-1 rounded bg-felt-700 text-parchment-100 text-xs font-bold">Reject</button>
                  </div>
                </div>
              ))}
              {pendingOutgoing.map((t) => (
                <div key={t.id} className="bg-felt-950/50 rounded-lg p-3 flex items-center justify-between">
                  <TradeSummary game={game} trade={t} />
                  <button onClick={() => cancel(t.id)} className="px-2.5 py-1 rounded bg-felt-700 text-parchment-100 text-xs font-bold shrink-0 ml-3">Cancel</button>
                </div>
              ))}
            </div>
          )}

          <div>
            <label className="block text-xs uppercase tracking-wider text-parchment-100/90 mb-1.5">
              Trade with
            </label>
            <select
              value={targetId}
              onChange={(e) => { setTargetId(e.target.value); setFromProps([]); setToProps([]); }}
              className="w-full bg-felt-950/60 border border-gold-600/25 rounded-lg px-3 py-2 text-parchment-100 outline-none"
            >
              {others.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          {target && (
            <div className="grid grid-cols-2 gap-4">
              <TradeSide
                title="You give"
                money={fromMoney}
                setMoney={setFromMoney}
                jail={fromJail}
                setJail={setFromJail}
                maxJail={self.getOutOfJailCards}
                properties={myProperties}
                selected={fromProps}
                onToggle={(id) => toggle(fromProps, setFromProps, id)}
                game={game}
              />
              <TradeSide
                title={`${target.name} gives`}
                money={toMoney}
                setMoney={setToMoney}
                jail={toJail}
                setJail={setToJail}
                maxJail={target.getOutOfJailCards}
                properties={theirProperties}
                selected={toProps}
                onToggle={(id) => toggle(toProps, setToProps, id)}
                game={game}
              />
            </div>
          )}

          {target && (
            <button
              onClick={propose}
              className="w-full py-2.5 rounded-lg bg-gold-500 hover:bg-gold-400 text-ink-900 font-bold transition"
            >
              Propose Trade
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function TradeSide({ title, money, setMoney, jail, setJail, maxJail, properties, selected, onToggle, game }) {
  return (
    <div className="bg-felt-950/40 rounded-lg p-3 space-y-2">
      <div className="text-xs uppercase tracking-wider text-parchment-100/90">{title}</div>
      <div>
        <label className="text-[11px] text-parchment-200/85">Cash</label>
        <input
          type="number"
          min={0}
          value={money}
          onChange={(e) => setMoney(e.target.value)}
          className="w-full bg-felt-800/70 border border-gold-600/20 rounded px-2 py-1 text-sm text-parchment-100 font-mono-num outline-none"
        />
      </div>
      {maxJail > 0 && (
        <div>
          <label className="text-[11px] text-parchment-200/85">Get Out of Jail cards (max {maxJail})</label>
          <input
            type="number"
            min={0}
            max={maxJail}
            value={jail}
            onChange={(e) => setJail(Math.min(maxJail, Number(e.target.value) || 0))}
            className="w-full bg-felt-800/70 border border-gold-600/20 rounded px-2 py-1 text-sm text-parchment-100 font-mono-num outline-none"
          />
        </div>
      )}
      <div className="max-h-40 overflow-y-auto scrollbar-thin space-y-1">
        {properties.length === 0 && <p className="text-[11px] text-parchment-200/75">No properties</p>}
        {properties.map((sp) => (
          <label key={sp.id} className="flex items-center gap-1.5 text-[11px] text-parchment-200">
            <input
              type="checkbox"
              checked={selected.includes(sp.id)}
              onChange={() => onToggle(sp.id)}
              className="accent-gold-500"
            />
            {sp.name}
            {game.properties[sp.id].houses > 0 && (
              <span className="text-amber-400/70">
                ({game.properties[sp.id].houses === 5 ? 'hotel' : `${game.properties[sp.id].houses}h`})
              </span>
            )}
          </label>
        ))}
      </div>
    </div>
  );
}

function TradeSummary({ game, trade }) {
  const from = game.players.find((p) => p.id === trade.fromId);
  const to = game.players.find((p) => p.id === trade.toId);
  const o = trade.offer;
  return (
    <div className="text-xs text-parchment-200 leading-relaxed">
      <span className="font-semibold text-gold-400">{from?.name}</span> offers{' '}
      {o.fromMoney > 0 && `$${o.fromMoney} `}
      {o.fromProperties?.length > 0 && `${o.fromProperties.length} propert${o.fromProperties.length === 1 ? 'y' : 'ies'} `}
      to <span className="font-semibold text-gold-400">{to?.name}</span> for{' '}
      {o.toMoney > 0 && `$${o.toMoney} `}
      {o.toProperties?.length > 0 && `${o.toProperties.length} propert${o.toProperties.length === 1 ? 'y' : 'ies'}`}
      {!o.fromMoney && !o.toMoney && !o.fromProperties?.length && !o.toProperties?.length && 'items'}
    </div>
  );
}
