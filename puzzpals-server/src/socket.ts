import type { Server } from 'socket.io';
import { createEmptyGrid } from '@puzzpals/puzzle-parser';
import { markAsDirty, getRoomFromStore } from './memorystore.js';
import { processChatMessage } from './chat.js';
import { randomUserID } from './user.js';

function init(io: Server) {
  io.on('connection', socket => {
    socket.on('room:join', async data => {
      const token = data.token;
      const userID = randomUserID(token);
      console.log("joined", userID);
      socket.join(token);

      const room = getRoomFromStore(token);

      if (!room) {
        return;
      }

      socket.emit('user:id', userID);

      const grid = room.puzzleData || null;
      if (!grid) {
        socket.emit('grid:state', createEmptyGrid());
      } else {
        socket.emit('grid:state', grid);
      }
    });

    socket.on('grid:updateCell', data => {
      const { token, idx, value } = data;

      const room = getRoomFromStore(token);
      if (!room) {
        return;
      }

      const grid = room.puzzleData;

      if (!grid) {
        return;
      }

      // TODO: Data validation
      grid.cells[idx]?.setData(value);
      markAsDirty(room);

      // Emit the update to all clients in the room (including the sender)
      io.to(token).emit('grid:cellUpdated', { idx, value });
    });

    socket.on('chat:newMessage', data => {
      const { token, message } = data;
      const processed = processChatMessage(message);
      if (!processed) {
        console.log("Invalid chat message received:", message);
        return;
      }
      io.to(token).emit('chat:messageNew', processed);
    });

    const handleDisconnect = (data: any) => {
      const token = data.token;
      socket.leave(token);
    };

    socket.on('room:leave', data => handleDisconnect(data));
    socket.on('disconnect', data => handleDisconnect(data));
  });
}

export { init };
