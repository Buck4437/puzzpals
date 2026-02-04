#!/usr/bin/env node

import debug from "debug";
import { createServer } from "http";
import { Server } from "socket.io";

import app from "src/app.js";
import env from "src/config.js";
import { closeDb, initDb } from "src/db.js";
import { startAutosave, stopAutosave } from "src/memorystore.js";
import { init } from "src/socket.js";

const serverDebugger = debug("puzzpals-server:server");

// Get port from environment and store in Express
const port = normalizePort(env.PORT);
app.set("port", port);

// Initialize database and memory store
initDb();
startAutosave();

// Create HTTP server
const server = createServer(app);

// Create Socket.IO server
const io = new Server(server, {
  cors: {
    origin: [env.CLIENT_BASE_URL],
  },
});

app.set("io", io);
init(io);

// Listen on provided port, on all network interfaces
server.listen(port);
server.on("error", onError);
server.on("listening", onListening);

/**
 * Normalize a port into a number, string, or false.
 */

function normalizePort(val: string) {
  const port = parseInt(val, 10);

  if (isNaN(port)) {
    // named pipe
    return val;
  }

  if (port >= 0) {
    // port number
    return port;
  }

  return false;
}

/**
 * Event listener for HTTP server "error" event.
 */

function onError(error: NodeJS.ErrnoException) {
  if (error.syscall !== "listen") {
    throw error;
  }

  const bind = typeof port === "string" ? "Pipe " + port : "Port " + port;

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case "EACCES":
      throw new Error(`${bind} requires elevated privileges`);
    case "EADDRINUSE":
      throw new Error(`${bind} is already in use`);
    default:
      throw error;
  }
}

/**
 * Event listener for HTTP server "listening" event.
 */

function onListening() {
  const addr = server.address();
  if (addr === null) {
    throw new Error(
      "addr is null (Did you call onListening() at the right time?)",
    );
  }

  const bind = typeof addr === "string" ? "pipe " + addr : "port " + addr.port;
  serverDebugger("Listening on " + bind);
}

/**
 * Shut down the server gracefully
 */

function shutdown() {
  console.log("Shutting down...");
  server.close(() => {
    process.exit(0);
  });

  // stop io and save data to DB to prevent data loss
  io.close();
  stopAutosave();
  closeDb();
}

process.on("exit", () => shutdown());
process.on("SIGHUP", () => process.exit(128 + 1));
process.on("SIGINT", () => process.exit(128 + 2));
process.on("SIGTERM", () => process.exit(128 + 15));

console.log("Server loaded");
