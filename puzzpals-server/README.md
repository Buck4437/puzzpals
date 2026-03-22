# Server

## Types

### `Room`

A room. An object with the following properties:

- `token`: `string`. Room token, used to uniquely identify a room. Anyone who has the room token can join the room.
- `puzzle_data`: `string`, stringified [`GameData`](../packages/puzzle-models/README.md#gamedata). Optional. State of the grid in the room.

### `Puzzle`

A puzzle stored in the catalogue. An object with the following properties:

- `id`: `number`. Puzzle ID.
- `title`: `string`. Puzzle title.
- `author`: `string`. Name of the puzzle author.
- `description`: `string`. Puzzle description.
- `puzzle_json`: `Grid`. Puzzle data.
- `publish_date`: `string`. Publishing time in ISO 8601 format, YYYY-MM-DDTHH:mm:ss.sssZ.

## Socket.IO interface

### `room:join`

Join a client to a room. Arguments:

- `token`: `string`. The token of the room to join.

If successful, `room:initialize` is emitted to the client with the following arguments:

- `grid`: [`GameData`](../packages/puzzle-models/README.md#gamedata). The current state of the grid in the room.
- `userID`: `string`. Username assigned by the server to the user.

### `grid:edit`

Modify the player's solution in a room. Can only be called by a client in the room. Arguments:

- `message`: [`EditMessage`](../packages/puzzle-models/README.md#editmessage). The edit.

If successful, the server broadcasts `grid:edited` to all clients in the room with the following arguments:

- `message`: Same as above.

### `chat:newMessage`

Send a message to a room. Can only be called by a client in the room. Arguments:

- `message`: An object with the following property:
  - `msgtext`: `string`. Content of the message. Must be 1,000 characters or fewer.

If successful, the server broadcasts `chat:messageNew` to all clients in the room with the following argument:

- `message`: An object with the following properties:
  - `user`: `string`. Username of the message sender.
  - `timestamp`: `number`. Time when the server received the message.
  - `msgtext`: Same as above.

## API

### POST `/api/rooms/create`

Create a room by uploading a puzzle.

The body of the request should be a [`Grid`](../packages/puzzle-models/README.md#grid), the puzzle to use in the room.

If successful, the server responds with a `string`, token of the created room.

If the request body is invalid, the server responds with `400 Bad Request`.

### GET `/api/rooms/:token`

Fetch a room by its token. Parameters:

- `token`: The token of the room to fetch.

If successful, the server responds with [`GameData`](../packages/puzzle-models/README.md#gamedata) of the room.

If the room does not exist, the server responds with `404 Not Found`.

### GET `/api/puzzles/`

Fetch the most recent puzzles. Query parameters:

- `limit`: The maximum number of puzzles to fetch. Maximum 100. Default 5.

If successful, the server responds with an array of `Puzzle`s.

If `limit` is invalid, the server responds with `400 Bad Request`.

### POST `/api/puzzles/`

Add a puzzle to the catalogue. The request body should contain the following properties:

- `title`: `string`. Puzzle title.
- `author`: `string`. Name of the puzzle author.
- `description`: `string`. Puzzle description.
- `puzzle_json`: [`Grid`](../packages/puzzle-models/README.md#grid). Puzzle data.

If successful, the server responds with `201 Created` with the newly created `Puzzle`.

If the request body is invalid, the server responds with `400 Bad Request`.

### GET `/api/puzzles/:id`

Fetch a puzzle by its ID. Parameters:

- `id`: ID of the puzzle to fetch.

If successful, the server responds with the `Puzzle`.

- If `id` is invalid, the server responds with `400 Bad Request`.
- If the puzzle does not exist, the server responds with `404 Not Found`.

## Database interface

### `addPuzzle`

Add a puzzle to the `Puzzle` table. Arguments:

- `title`: `string`. Puzzle title.
- `author`: `string`. Name of the puzzle author.
- `description`: `string`. Puzzle description.
- `puzzleJson`: `Grid`. Puzzle data.
- `publishDate`: `Date`. Optional, defaults to the current time. Publishing time.

Returns the newly created `Puzzle`.

### `getPuzzles`

Fetch the most recent puzzles from the `Puzzle` table. Arguments:

- `limit`: `number`. Optional, defaults to 5. The maximum number of puzzles to fetch.

Returns an array of `Puzzle`s.

### `getPuzzleById`

Fetch a single puzzle by its numeric ID. Arguments:

- `id`: `number`. Puzzle ID.

Returns the `Puzzle` if found, otherwise `undefined`.

### `upsertRoom`

Save a room to the database. Arguments:

- `token`: `string`. Room token.
- `puzzleJson`: `string`, stringified [`GameData`](../packages/puzzle-models/README.md#gamedata). State of the grid in the room.

### `fetchRoom`

Load a room from the database. Arguments:

- `token`: `string`. Room token.

Returns the `Room` if found, `undefined` otherwise.
