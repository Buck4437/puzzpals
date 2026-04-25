import { fetchRoom, upsertRoom } from "./db.js";
import type { Room } from "./models/Room.js";

interface RoomEntry {
  room: Room;
  isDirty?: boolean;
}

let timeout: NodeJS.Timeout;
let stopAutosaveFlag = false;
const store = new Map<string, RoomEntry>();

export async function getRoomFromStore(token: string): Promise<Room | null> {
  const roomEntry = store.get(token);

  if (roomEntry !== null && roomEntry !== undefined) {
    return roomEntry.room;
  }

  // Fetch from db
  const dbEntry = await fetchRoom(token);
  if (dbEntry !== null) {
    const roomEntry = {
      room: dbEntry,
      isDirty: false,
    };
    store.set(token, roomEntry);
    return roomEntry.room;
  }
  return null;
}

export function createRoomInStore(room: Room) {
  store.set(room.token, {
    room: room,
    isDirty: true,
  });
}

export function markAsDirty(token: string) {
  const roomEntry = store.get(token);
  if (roomEntry !== undefined) {
    roomEntry.isDirty = true;
  }
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
  if (stopAutosaveFlag && !forced) return;

  // Copy all rooms to upsert
  const roomsToUpsert: Room[] = [];
  for (const roomEntry of store.values()) {
    if (roomEntry.isDirty === true) {
      roomEntry.isDirty = false;
      roomsToUpsert.push(structuredClone(roomEntry.room));
    }
  }

  // Upsert rooms
  for (const room of roomsToUpsert) {
    await upsertRoom(room);
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
