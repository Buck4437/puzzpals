import debug from "debug";
import { createServer } from "http";
import { Server } from "socket.io";

import app from "../app.js";
import env from "../config.js";
import { closeDb, initDb } from "../db.js";
import { startAutosave, stopAutosave } from "../memorystore.js";
import { init } from "../socket.js";

const serverDebugger = debug("puzzpals-server:server");

// Get port from environment and store in Express
const port = normalizePort(env.PORT);
app.set("port", port);

// Initialize database and memory store
await initDb();
startAutosave();

// Create HTTP server
const server = createServer(app);

// Create Socket.IO server
const io = new Server(server, {
  cors: {
    origin: [env.CLIENT_ORIGIN],
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

let shuttingDown = false;
async function shutDown(eventName: string, exitCode: number) {
  if (!shuttingDown) {
    shuttingDown = true;
    console.log(`Received ${eventName}, shutting down...`);
    process.exitCode = exitCode;

    await io.close();
    await stopAutosave();
    await closeDb();
  }
}

process.on("SIGHUP", () => void shutDown("SIGHUP", 128 + 1));
process.on("SIGINT", () => void shutDown("SIGINT", 128 + 2));
process.on("SIGTERM", () => void shutDown("SIGTERM", 128 + 15));

console.log("Server loaded");
