import { join } from 'path';
import Database from 'better-sqlite3';
import type { Room } from './models/Room.js';

export type DB = InstanceType<typeof Database>;

let db: DB | null = null;

function initDb(dbPath?: string) {
    const file = dbPath ?? join(process.cwd(), 'puzzpals-data.db');
    
    db = new Database(file);
    console.log('sqlite initialized at', file);
    
    createTable();
}

function createTable() {
    if (!db) { 
        console.error('Failed to create tables: database is not initialized. Call initDb() before using the database.');
        throw new Error('Cannot create tables: database is not initialized.');
    }

    const sql = `CREATE TABLE IF NOT EXISTS Room (
        token TEXT PRIMARY KEY UNIQUE,
        puzzle_data TEXT
    )`
    db.prepare(sql).run();
}

function upsertRoom(token: string, puzzleJson: string) {
    const sql = `INSERT OR REPLACE INTO Room (token, puzzle_data) VALUES (?, ?)`
    db?.prepare(sql).run(token, puzzleJson);
}

function fetchRoom(token: string) {
    const sql = "SELECT * FROM Room WHERE token = ?";
    const row = db?.prepare(sql).get(token) as Room | undefined;

    if (!row) {
        return null;
    }

    return row;
}

function closeDb() {
    if (db) {
        db.close();
        db = null;
    }
}

export { initDb, upsertRoom, fetchRoom, closeDb };
