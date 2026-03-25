import { fetchRoom, upsertRoom } from "./db.js";
import { type GameData } from "@puzzpals/puzzle-models";

interface RoomEntry {
  token: string;
  gameData: GameData;
  isDirty?: boolean;
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
  if (dbEntry !== null) {
    try {
      const roomEntry = {
        token: dbEntry.token,
        gameData: dbEntry.puzzle_data,
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

export function createRoomInStore(token: string, gameData: GameData) {
  store.set(token, {
    token,
    gameData,
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
      await upsertRoom(token, room.gameData);
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
