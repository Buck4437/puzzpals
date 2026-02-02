import { fetchRoom, upsertRoom } from "./db.js";
import { type Grid, deserialize, serialize } from "@puzzpals/puzzle-parser";

type RoomEntry = {
    token: string;
    puzzleData: Grid;
    isDirty?: boolean;
};

let interval: NodeJS.Timeout | null = null;
const store = new Map<string, RoomEntry>();

export function getRoomFromStore(token: string): RoomEntry | null {
    const roomEntry = store.get(token);

    if (roomEntry !== null && roomEntry !== undefined) {
        return roomEntry;
    }
    // Fetch from db
    const dbEntry = fetchRoom(token);
    if (dbEntry && typeof dbEntry.puzzle_data === 'string') {
        try {
            const parsedData = deserialize(dbEntry.puzzle_data);
            const roomEntry = {
                token: dbEntry.token,
                puzzleData: parsedData as Grid,
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

export function createRoomInStore(token: string, puzzleData: Grid) {
    store.set(token, {
        token,
        puzzleData,
        isDirty: true
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

export function startAutosave() {
    // Autosave every 60 seconds
    interval = setInterval(autosave, 60 * 1000);
}

export function stopAutosave() {
    if (interval) {
        clearInterval(interval);
        interval = null;
    }

    // Save to the database one last time
    autosave();
}

function autosave() {
    for (const token of getListOfRooms()) {
        const room = getRoomFromStore(token);
        if (room && isDirty(room)) {
            console.log("Autosaving room:", token);
            // If we put mark as clean after saving, then there's a chance that
            // new changes could be made before we mark as clean, which causes data loss.
            markAsClean(room);
            const serializedData = serialize(room.puzzleData);
            upsertRoom(token, serializedData);
        }
    }
}

// For tests only!
export function __clearForTests() {
    store.clear();
}
