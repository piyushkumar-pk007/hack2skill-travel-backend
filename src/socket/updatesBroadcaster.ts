import type { Server as SocketServer } from 'socket.io';
import { fetchLiveTravelUpdates } from '../services/claudeService.js';

export function initializeSocket(io: SocketServer) {
  io.on('connection', (socket) => {
    socket.on('subscribe:updates', async ({ destination, dates }: { destination: string; dates: string }) => {
      socket.join(`updates:${destination}`);

      try {
        const feed = await fetchLiveTravelUpdates(destination, dates);
        socket.emit('updates:feed', feed);
      } catch {
        socket.emit('updates:error', { message: 'Could not fetch updates' });
      }
    });
  });

  setInterval(async () => {
    const rooms = [...io.sockets.adapter.rooms.keys()].filter((room) => room.startsWith('updates:'));

    for (const room of rooms) {
      const destination = room.replace('updates:', '');

      try {
        const feed = await fetchLiveTravelUpdates(destination, 'upcoming');
        io.to(room).emit('updates:feed', feed);
      } catch {
        continue;
      }
    }
  }, 30 * 60 * 1000);
}
