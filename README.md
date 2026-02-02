# puzzpals
A Japanese logic puzzle website where you can solve the same puzzle with others in real time.

## Install

1. Set up .env files in both client and server
2. Run `npm i` in the root directory
3. Run `npm run dev --workspace puzzpals-client-ts` to start the client
4. In another terminal, run `npm run dev --workspace puzzpals-server` to start the server. The packages are built automatically when the server is run, and automatically rebuilds whenever a change is detected


### About DB

This project uses sqlite to store puzzle data. It is automatically created at `puzzpals-data.db`. To reset the db simply delete the file.
- Install sqlite3 on linux
- You can install the plugin "SQLite Viewer" to view the database after installing sqlite3