import { useState } from 'react';
import { emitAck } from '../lib/socket.js';
import { useStore } from '../lib/store.js';
import { PLAYER_COLOR_HEX } from '../lib/boardLayout.js';

export default function AuctionPanel({ game, self }) {
  const { setError } = useStore();
  const auction = game.auction;
  const [bidAmount, setBidAmount] = useState(0);
  if (!auction) return null;

  const space = game.board[auction.spaceId];
  const bidderId = auction.order[auction.turnPointer % auction.order.length];
  const bidder = game.players.find((p) => p.id === bidderId);
  const myTurnToBid = self && self.id === bidderId && !auction.passed.includes(self.id);
  const minBid = auction.currentBid + 1;

  async function bid() {
    try {
      await emitAck('game:auctionBid', { amount: Number(bidAmount) || minBid });
    } catch (e) {
      setError(e.message);
    }
  }
  async function pass() {
    try {
      await emitAck('game:auctionPass', {});
    } catch (e) {
      setError(e.message);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-40 flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-felt-800 border border-gold-500/40 rounded-2xl p-6 shadow-2xl text-center">
        <div className="text-xs uppercase tracking-widest text-gold-400 mb-1">Auction</div>
        <h2 className="font-display text-2xl font-bold text-parchment-50 mb-3">{space.name}</h2>

        <div className="text-parchment-200 mb-1">
          Current bid: <span className="font-mono-num text-gold-400 font-bold text-xl">${auction.currentBid}</span>
        </div>
        {auction.currentBidder && (
          <div className="text-sm text-parchment-300/70 mb-4">
            by {game.players.find((p) => p.id === auction.currentBidder)?.name}
          </div>
        )}

        <div className="flex items-center justify-center gap-2 mb-4">
          <span
            className="w-2.5 h-2.5 rounded-full"
            style={{ background: PLAYER_COLOR_HEX[bidder?.color] }}
          />
          <span className="text-sm text-parchment-200">
            {myTurnToBid ? "It's your turn to bid" : `Waiting on ${bidder?.name}…`}
          </span>
        </div>

        {myTurnToBid && (
          <div className="flex gap-2">
            <input
              type="number"
              min={minBid}
              value={bidAmount || minBid}
              onChange={(e) => setBidAmount(e.target.value)}
              className="flex-1 bg-felt-950/60 border border-gold-600/25 rounded-lg px-3 py-2 text-parchment-50 outline-none focus:border-gold-500 font-mono-num text-center"
            />
            <button
              onClick={bid}
              className="px-4 py-2 rounded-lg bg-gold-500 hover:bg-gold-400 text-ink-900 font-bold text-sm"
            >
              Bid
            </button>
            <button
              onClick={pass}
              className="px-4 py-2 rounded-lg bg-felt-700 hover:bg-felt-700/70 text-parchment-100 font-bold text-sm"
            >
              Pass
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
