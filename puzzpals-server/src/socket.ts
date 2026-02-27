import { Socket, type Server } from "socket.io";
import { markAsDirty, getRoomFromStore } from "./memorystore.js";
import { isMessageValid, processChatMessage } from "./chat.js";
import { randomUserID } from "./user.js";

interface User {
  roomToken: string;
  name: string;
}

const socketUserMap = new Map<Socket, User>();

export function init(io: Server) {
  io.on("connection", (socket) => {
    socket.on("room:join", (token: unknown) => {
      // Validate payload
      if (typeof token !== "string") return;

      // Verify that the room exists
      const room = getRoomFromStore(token);
      if (!room) return;

      const userID = randomUserID(token);
      console.log("joined", userID);

      // Map socket to user
      socketUserMap.set(socket, { roomToken: token, name: userID });

      socket.join(token);

      const grid = room.puzzleData;
      socket.emit("room:initialize", grid, userID);
    });

    socket.on("grid:updateCell", (idx: unknown, value: unknown) => {
      // Check socket has joined a room
      const user = socketUserMap.get(socket);
      if (user === undefined) return;

      // Validate payload
      if (typeof idx !== "number" || typeof value !== "number") return;

      const room = getRoomFromStore(user.roomToken);
      if (!room) {
        return;
      }

      const grid = room.puzzleData;

      if (!grid) {
        return;
      }

      // Ensure idx is not out of bounds
      const cell = grid.cells[idx];
      if (cell === undefined) return;

      cell.setInput(value);
      markAsDirty(room);

      // Emit the update to all clients in the room (including the sender)
      io.to(user.roomToken).emit("grid:cellUpdated", idx, value);
    });

    socket.on("chat:newMessage", (message: unknown) => {
      // Check socket has joined a room
      const user = socketUserMap.get(socket);
      if (user === undefined) return;

      // Validate payload
      if (!isMessageValid(message)) return;

      const processed = processChatMessage(message, user.name);
      io.to(user.roomToken).emit("chat:messageNew", processed);
    });

    socket.on("disconnect", () => {
      socketUserMap.delete(socket);
    });
  });
}

export function __clearSocketsForTests() {
  socketUserMap.clear();
}
