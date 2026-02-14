import type { Server } from "socket.io";
import { markAsDirty, getRoomFromStore } from "./memorystore.js";
import { isMessageValid, processChatMessage } from "./chat.js";
import { randomUserID } from "./user.js";

function init(io: Server) {
  io.on("connection", (socket) => {
    socket.on("room:join", (token: unknown) => {
      // Validate
      if (typeof token !== "string") return;

      // Verify that the room exists
      const room = getRoomFromStore(token);
      if (!room) return;

      const userID = randomUserID(token);
      console.log("joined", userID);
      socket.join(token);

      const grid = room.puzzleData;
      socket.emit("room:initialize", grid, userID);
    });

    socket.on(
      "grid:updateCell",
      (token: unknown, idx: unknown, value: unknown) => {
        // Validate
        if (
          typeof token !== "string" ||
          typeof idx !== "number" ||
          typeof value !== "number"
        )
          return;

        const room = getRoomFromStore(token);
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
        io.to(token).emit("grid:cellUpdated", idx, value);
      },
    );

    socket.on("chat:newMessage", (token: unknown, message: unknown) => {
      // Validate
      if (typeof token !== "string" || !isMessageValid(message)) return;

      const processed = processChatMessage(message);
      io.to(token).emit("chat:messageNew", processed);
    });

    // https://github.com/minghinshi/puzzpals/issues/39
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleDisconnect = (data: any) => {
      const token = data.token;
      socket.leave(token);
    };

    socket.on("room:leave", (data) => handleDisconnect(data));
    socket.on("disconnect", (data) => handleDisconnect(data));
  });
}

export { init };
