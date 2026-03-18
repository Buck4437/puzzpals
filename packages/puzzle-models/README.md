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

An object containing `LineObject`s. The key of each `LineObject` must be in the format `"i,j|k,l"`, where $(i, j)$ and $(k, l)$ are the coordinates of the two endpoints.

### `SurfaceObjectDict`

An object containing `SurfaceObject`s. The key of each `SurfaceObject` must be in the format `"i,j"`, where $(i, j)$ is the center coordinate of the `SurfaceObject`.

### `SymbolObjectDict`

An object containing `SymbolObject`s. The key of each `SymbolObject` must be in the format `"i,j"`, where $(i, j)$ is the center coordinate of the `SymbolObject`.

### `LayerData`

A collection of lines, surfaces, and symbols that define a layer of a puzzle. An object with the following properties:

- `lineObjects`: `LineObjectDict`. Lines in the layer.
- `surfaceObjects`: `SurfaceObjectDict`. Surfaces in the layer.
- `symbolObjects`: `SymbolObjectDict`. Symbols in the layer.

### `SolutionData`

The correct solution of a puzzle. An object with the following properties:

- `lineObjects`: `LineObjectDict`. Lines in the solution.
- `surfaceObjects`: `SurfaceObjectDict`. Surfaces in the solution.
- `symbolObjects`: `SymbolObjectDict`. Symbols in the solution.
- `typeToCheck`: Which layer elements to check in the player's solution. An array that may include these values:
  - `"lineObjects"`: Check lines in the player's answer.
  - `"surfaceObjects"`: Check surfaces in the player's answer.
  - `"symbolObjects"`: Check symbols in the player's answer.

Examples:

- A Slitherlink puzzle is solved by drawing lines. You would set `typeToCheck = ["lineObjects"]` and specify the solution in `lineObjects`. You may assign an empty object to `surfaceObjects` and `symbolObjects`.
- A Nurikabe puzzle is solved by shading some cells black. You would set `typeToCheck = ["symbolObjects"]` and specify the solution in `symbolObjects`. You may assign an empty object to `lineObjects` and `surfaceObjects`.

### `Grid`

The grid of a puzzle. An object with the following properties:

- `size`: An array of two integers, specifying the number of rows and columns in this order.
- `problem`: `LayerData`. The clues: What the player initially sees on the grid.
- `solution`: `SolutionData`. Optional. The correct solution to the puzzle.
