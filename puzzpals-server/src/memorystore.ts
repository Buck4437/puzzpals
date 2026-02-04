import { fetchRoom } from "./db.js";
import { type Grid, deserialize } from "@puzzpals/puzzle-parser";

interface RoomEntry {
    token: string;
    puzzleData: Grid;
    isDirty?: boolean;
}

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
            }
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

export function getListOfRooms(): string[] {
    return Array.from(store.keys());
}

export function markAsDirty(room: RoomEntry) {
    room.isDirty = true;
}

export function markAsClean(room: RoomEntry) {
    room.isDirty = false;
}

export function isDirty(room: RoomEntry): boolean {
    return room.isDirty === true;
}
