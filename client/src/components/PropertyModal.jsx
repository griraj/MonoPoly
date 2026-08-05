import { emitAck } from '../lib/socket.js';
import { useStore } from '../lib/store.js';
import { COLOR_HEX, PLAYER_COLOR_HEX } from '../lib/boardLayout.js';

const RENT_LABELS = ['Base rent', '1 house', '2 houses', '3 houses', '4 houses', 'Hotel'];

export default function PropertyModal({ game, spaceId, onClose }) {
  const { setError, session } = useStore();
  const space = game.board[spaceId];
  const propState = game.properties[spaceId];
  const owner = propState?.owner ? game.players.find((p) => p.id === propState.owner) : null;
  const isMine = owner?.id === session?.playerId;
  const myTurn = game.players[game.turnIndex]?.id === session?.playerId;
  const canManage = isMine && game.status === 'playing';

  async function run(event, payload) {
    try {
      await emitAck(event, { spaceId, ...payload });
    } catch (e) {
      setError(e.message);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-40 flex items-center justify-center p-4" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm bg-parchment-50 rounded-2xl overflow-hidden shadow-2xl text-ink-900"
      >
        {space.type === 'property' && <div className="h-8" style={{ background: COLOR_HEX[space.color] }} />}
        <div className="p-5">
          <div className="flex items-start justify-between mb-1">
            <h2 className="font-display text-xl font-bold">{space.name}</h2>
            <button onClick={onClose} className="text-ink-900/40 hover:text-ink-900 text-lg leading-none">
              ✕
            </button>
          </div>

          {owner && (
            <div className="flex items-center gap-1.5 mb-3 text-sm">
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: PLAYER_COLOR_HEX[owner.color] }} />
              <span className="text-ink-700">Owned by {owner.name}</span>
              {propState.mortgaged && <span className="text-red-600 font-semibold ml-1">(Mortgaged)</span>}
            </div>
          )}
          {!owner && space.price && <p className="text-sm text-ink-700 mb-3">Unowned</p>}

          {space.type === 'property' && (
            <table className="w-full text-sm mb-4">
              <tbody>
                {space.rent.map((r, i) => (
                  <tr
                    key={i}
                    className={`border-b border-ink-900/10 last:border-0 ${
                      propState.houses === i ? 'font-bold text-ink-900' : 'text-ink-700'
                    }`}
                  >
                    <td className="py-1">{RENT_LABELS[i]}</td>
                    <td className="py-1 text-right font-mono-num">Rs {r}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          <div className="flex flex-wrap gap-2 text-xs text-ink-700 mb-4">
            {space.price && <Info label="Price" value={`Rs ${space.price}`} />}
            {space.houseCost && <Info label="House cost" value={`Rs ${space.houseCost}`} />}
            {space.mortgage && <Info label="Mortgage value" value={`Rs ${space.mortgage}`} />}
          </div>

          {canManage && myTurn && (
            <div className="flex flex-wrap gap-2 pt-3 border-t border-ink-900/10">
              {space.type === 'property' && !propState.mortgaged && (
                <>
                  <SmallBtn onClick={() => run('game:buildHouse')}>
                    {propState.houses === 4 ? 'Build Hotel' : 'Build House'}
                  </SmallBtn>
                  {propState.houses > 0 && (
                    <SmallBtn onClick={() => run('game:sellHouse')}>Sell House</SmallBtn>
                  )}
                </>
              )}
              {!propState.mortgaged && propState.houses === 0 && (
                <SmallBtn onClick={() => run('game:mortgage')}>Mortgage</SmallBtn>
              )}
              {propState.mortgaged && <SmallBtn onClick={() => run('game:unmortgage')}>Unmortgage</SmallBtn>}
            </div>
          )}
          {canManage && !myTurn && (
            <p className="text-xs text-ink-700/60 pt-3 border-t border-ink-900/10">
              You can manage this property on your turn.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div className="bg-ink-900/5 rounded px-2 py-1">
      <span className="text-ink-900/50">{label}: </span>
      <span className="font-mono-num font-semibold">{value}</span>
    </div>
  );
}

function SmallBtn({ children, ...props }) {
  return (
    <button
      {...props}
      className="px-3 py-1.5 rounded-md bg-ink-900 text-parchment-50 text-xs font-semibold hover:bg-ink-700 transition"
    >
      {children}
    </button>
  );
}
