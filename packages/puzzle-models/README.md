# Puzzle models

This package defines objects that handle the business logic of Puzzpals.

## Coordinate system

In a grid with $r$ rows and $c$ columns:

- The top left corner is $(0, 0)$ and the bottom right corner is $(r, c)$.
- The top row is row $0$ and the bottom row is row $r - 1$.
- The leftmost column is column $0$ and the rightmost column is column $c - 1$.
- Coordinate $(i, j)$ is the top-left corner of the cell at row $i$, column $j$.
- Coordinate $(i + 0.5, j + 0.5)$ is the centre of the cell at row $i$, column $j$.

## Types

### `Coordinate`

A coordinate in the above [coordinate system](#coordinate-system). An array of two numbers.

### `LineObject`

A line segment. An object with the following properties:

- `start`: `Coordinate`. One end of the line segment.
- `end`: `Coordinate`. The other end of the line segment.
- `color`: `string`. Line color, in the same format as CSS.

Two common types of lines:

- If `start` and `end` coordinates are all integers, then `LineObject` represents a line connecting corners of cells.
- If `start` and `end` coordinates all have a fractional part of 0.5, then `LineObject` represents a line connecting centers of cells.

However, `LineObject` is not restricted to these two types of lines.

### `SurfaceObject`

Surfaces: The background of a cell. An object with the following properties:

- `location`: `Coordinate`. The center coordinate of the cell.
- `color`: `string`. Background color, in the same format as CSS.

### `SymbolObject`

Text in a cell. An object with the following properties:

- `location`: `Coordinate`. Where the text is centered.
- `content`: `string`. Text content.
- `color`: `string`. Text color, in the same format as CSS.

### `LineObjectDict`

An object containing `LineObject`s. The key of each `LineObject` must be in the format `"i,j|k,l"`, where $(i, j)$ and $(k, l)$ are the coordinates of the two endpoints. Keys use a canonical ordering of endpoints: the endpoint with the lexicographically smaller coordinate pair $(i, j)$ (compare $i$ first, then $j$) must appear first in the key. All additions, lookups, and removals must use this canonical key form.

### `SurfaceObjectDict`

An object containing `SurfaceObject`s. The key of each `SurfaceObject` must be in the format `"i,j"`, where $(i, j)$ is the center coordinate of the `SurfaceObject`.

### `SymbolObjectDict`

An object containing `SymbolObject`s. The key of each `SymbolObject` must be in the format `"i,j"`, where $(i, j)$ is the center coordinate of the `SymbolObject`.

### `LayerData`

A collection of lines, surfaces, and symbols that define a layer of a puzzle. An object with the following properties:

- `lineObjects`: `LineObjectDict`. Lines in the layer.
- `surfaceObjects`: `SurfaceObjectDict`. Surfaces in the layer.
- `symbolObjects`: `SymbolObjectDict`. Symbols in the layer.

### `ObjectTypes`

A type of objects on a grid. A string with one of the following values:

- "lineObjects": Lines.
- "surfaceObjects": Surfaces.
- "symbolObjects": Symbols.

### `SolutionData`

The correct solution of a puzzle. An object with the following properties:

- `lineObjects`: `LineObjectDict`. Lines in the solution.
- `surfaceObjects`: `SurfaceObjectDict`. Surfaces in the solution.
- `symbolObjects`: `SymbolObjectDict`. Symbols in the solution.
- `typeToCheck`: An array of `ObjectTypes`. Types of objects to check in the player's solution. Must have at least 1 element.

Examples:

- A Slitherlink puzzle is solved by drawing lines. You would set `typeToCheck = ["lineObjects"]` and specify the solution in `lineObjects`. You may assign an empty object to `surfaceObjects` and `symbolObjects`.
- A Nurikabe puzzle is solved by shading some cells black. You would set `typeToCheck = ["surfaceObjects"]` and specify the solution in `surfaceObjects`. You may assign an empty object to `lineObjects` and `symbolObjects`.

### `Grid`

The grid of a puzzle. An object with the following properties:

- `size`: An array of two integers, specifying the number of rows and columns in this order.
- `problem`: `LayerData`. The clues: What the player initially sees on the grid.
- `solution`: `SolutionData`. Optional. The correct solution to the puzzle.

### `GameData`

The state of the grid in a room. An object with the following properties:

- `puzzle`: `Grid`. The puzzle used in this game.
- `playerSolution`: `LayerData`. The player's current solution.

### `EditMessage`

An edit to the player's solution. An object with the following properties:

- `messageType`: Either `"remove"` or `"edit"`.
- `type`: `ObjectTypes`. The type of objects to modify.
- `data`: Data needed to specify the edit.

Specifically, there are two types of edits:

- When `messageType = "remove"`, the edit removes an object.
  - `data` is a `string` that specifies the key of the object to delete.
  - The key is specified in `LineObjectDict`, `SurfaceObjectDict`, or `SymbolObjectDict`.
- When `messageType = "edit"`, the edit adds or modifies an object.
  - `data` is a `LineObject`, `SurfaceObject`, or `SymbolObject`.
  - If `data` has the same location and type as an existing object, it will be overridden by `data`. Otherwise, `data` will be added.
