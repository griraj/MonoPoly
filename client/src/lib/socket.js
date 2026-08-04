import { io } from 'socket.io-client';

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:4000';

export const socket = io(SERVER_URL, {
  transports: ['polling', 'websocket'],
  autoConnect: true,
});

export function emitAck(event, payload) {
  return new Promise((resolve, reject) => {
    socket.emit(event, payload, (res) => {
      if (res && res.ok === false) reject(new Error(res.error || 'Unknown error'));
      else resolve(res);
    });
  });
}
