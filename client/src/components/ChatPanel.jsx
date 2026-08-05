import { useEffect, useRef, useState } from 'react';
import { useStore } from '../lib/store.js';
import { socket } from '../lib/socket.js';
import { PLAYER_COLOR_HEX } from '../lib/boardLayout.js';

export default function ChatPanel({ game }) {
  const { chat } = useStore();
  const [text, setText] = useState('');
  const [tab, setTab] = useState('chat'); // chat | log
  const scrollRef = useRef(null);

  const items = tab === 'chat' ? chat : game.log;

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [items.length, tab]);

  function send(e) {
    e.preventDefault();
    if (!text.trim()) return;
    socket.emit('chat:send', { text: text.trim() });
    setText('');
  }

  return (
    <div className="flex flex-col h-full bg-felt-800/60 border border-gold-600/20 rounded-xl overflow-hidden">
      <div className="flex border-b border-gold-600/20">
        {['chat', 'log'].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2 text-xs uppercase tracking-wider font-semibold transition ${
              tab === t ? 'bg-felt-700 text-gold-400' : 'text-parchment-200/85 hover:text-parchment-200'
            }`}
          >
            {t === 'chat' ? 'Chat' : 'Game Log'}
          </button>
        ))}
      </div>
      <div ref={scrollRef} className="flex-1 overflow-y-auto scrollbar-thin px-3 py-2 space-y-1.5 min-h-0">
        {items.length === 0 && (
          <p className="text-xs text-parchment-200/75 text-center mt-4">
            {tab === 'chat' ? 'No messages yet.' : 'Game events will appear here.'}
          </p>
        )}
        {tab === 'chat'
          ? items.map((m) => (
              <div key={m.id} className="text-xs leading-relaxed">
                <span className="font-semibold" style={{ color: PLAYER_COLOR_HEX[m.color] || '#e2bf5e' }}>
                  {m.name}:
                </span>{' '}
                <span className="text-parchment-200">{m.text}</span>
              </div>
            ))
          : items.map((l, i) => (
              <div key={i} className="text-[11px] text-parchment-100/95 leading-relaxed">
                {l.message}
              </div>
            ))}
      </div>
      {tab === 'chat' && (
        <form onSubmit={send} className="flex border-t border-gold-600/20">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Say something…"
            maxLength={500}
            className="flex-1 bg-transparent px-3 py-2 text-sm text-parchment-100 outline-none placeholder-parchment-300/30"
          />
          <button type="submit" className="px-3 text-gold-400 hover:text-gold-300 text-sm font-semibold">
            Send
          </button>
        </form>
      )}
    </div>
  );
}
