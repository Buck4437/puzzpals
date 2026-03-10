import { fetchRoom, upsertRoom } from "./db.js";
import { type Grid } from "@puzzpals/puzzle-models";
import {
  type AkariGrid,
  deserialize,
  serialize,
} from "@puzzpals/puzzle-parser";

interface RoomEntry {
  token: string;
  puzzleData: Grid | AkariGrid;
  isDirty?: boolean;
}

function isAkariGrid(grid: Grid | AkariGrid): grid is AkariGrid {
  return "cells" in grid;
}

let timeout: NodeJS.Timeout;
let stopAutosaveFlag = false;
const store = new Map<string, RoomEntry>();

export async function getRoomFromStore(
  token: string,
): Promise<RoomEntry | null> {
  const roomEntry = store.get(token);

  if (roomEntry !== null && roomEntry !== undefined) {
    return roomEntry;
  }
  // Fetch from db
  const dbEntry = await fetchRoom(token);
  if (dbEntry && typeof dbEntry.puzzle_data === "string") {
    try {
      let parsedData: Grid | AkariGrid;
      try {
        parsedData = deserialize(dbEntry.puzzle_data);
      } catch {
        parsedData = JSON.parse(dbEntry.puzzle_data) as Grid;
      }
      const roomEntry = {
        token: dbEntry.token,
        puzzleData: parsedData,
        isDirty: false,
      };
      store.set(token, roomEntry);
      return roomEntry;
    } catch (e) {
      console.error("Failed to parse puzzle data from DB for token:", token, e);
    }
  }
  return null;
}

export function createRoomInStore(token: string, puzzleData: Grid | AkariGrid) {
  store.set(token, {
    token,
    puzzleData,
    isDirty: true,
  });
}

function getListOfRooms(): string[] {
  return Array.from(store.keys());
}

export function markAsDirty(room: RoomEntry) {
  room.isDirty = true;
}

function markAsClean(room: RoomEntry) {
  room.isDirty = false;
}

function isDirty(room: RoomEntry): boolean {
  return room.isDirty === true;
}

function setAutosaveTimeout(delay: number) {
  timeout = setTimeout(() => {
    if (!stopAutosaveFlag) {
      autosave().catch((e) => {
        console.error("Autosave failed:", e);
      });
    }
  }, delay);
}

export function startAutosave() {
  setAutosaveTimeout(10 * 1000);
}

export async function stopAutosave() {
  stopAutosaveFlag = true;
  clearTimeout(timeout);

  // Save to the database one last time
  await autosave(true);
}

async function autosave(forced = false) {
  for (const token of getListOfRooms()) {
    if (stopAutosaveFlag && !forced) {
      break;
    }
    const room = await getRoomFromStore(token);
    if (room && isDirty(room)) {
      console.log("Autosaving room:", token);
      // If we put mark as clean after saving, then there's a chance that
      // new changes could be made before we mark as clean, which causes data loss.
      markAsClean(room);
      const serializedData = isAkariGrid(room.puzzleData)
        ? serialize(room.puzzleData)
        : JSON.stringify(room.puzzleData);
      await upsertRoom(token, serializedData);
    }
  }

  // Don't schedule another autosave if it's been stopped
  if (!stopAutosaveFlag) {
    setAutosaveTimeout(60 * 1000);
  }
}

// For tests only!
export function __clearStoreForTests() {
  store.clear();
}
