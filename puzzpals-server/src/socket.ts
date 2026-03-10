import { Socket, type Server } from "socket.io";
import { markAsDirty, getRoomFromStore } from "./memorystore.js";
import { isMessageValid, processChatMessage } from "./chat.js";
import { randomUserID } from "./user.js";
import { applyEditMessage, toEditMessage } from "@puzzpals/puzzle-models";

interface User {
  roomToken: string;
  name: string;
}

const socketUserMap = new Map<Socket, User>();

export function init(io: Server) {
  io.on("connection", (socket) => {
    socket.on("room:join", async (token: unknown) => {
      // Validate payload
      if (typeof token !== "string" || token.length !== 10) return;

      // Verify that the room exists
      const room = await getRoomFromStore(token);
      if (!room) return;

      const userID = randomUserID(token);
      console.log("joined", userID);

      // Map socket to user
      socketUserMap.set(socket, { roomToken: token, name: userID });

      socket.join(token);

      const game = room.gameData;
      socket.emit("room:initialize", game, userID);
    });

    socket.on("grid:edit", async (message: unknown) => {
      // Check socket has joined a room
      const user = socketUserMap.get(socket);
      if (user === undefined) return;

      // Validate payload
      if (
        typeof message !== "object" ||
        message === null ||
        !("messageType" in message) ||
        !("type" in message) ||
        !("data" in message)
      ) {
        return;
      }

      const editMessage = toEditMessage(
        message.messageType,
        message.type,
        message.data,
      );

      // Validate editMessage
      if (editMessage === null) {
        return;
      }

      const room = await getRoomFromStore(user.roomToken);
      if (!room) {
        return;
      }

      room.gameData = {
        ...room.gameData,
        playerSolution: applyEditMessage(
          room.gameData.playerSolution,
          editMessage,
        ),
      };

      markAsDirty(room);

      // Emit the update to all clients in the room (including the sender)
      io.to(user.roomToken).emit("grid:edit", editMessage);
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
