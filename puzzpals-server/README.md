# Server

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
