// Utility functions
function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

// Declarations for coordinates and keys
export type Coordinate = [number, number];

export function isCoordinate(value: unknown): value is Coordinate {
  return (
    Array.isArray(value) &&
    value.length === 2 &&
    value.every((entry) => typeof entry === "number" && Number.isFinite(entry))
  );
}

export type PairCoordinate = [Coordinate, Coordinate];
export type CoordinateKey = string;
export type PairCoordinateKey = string;

export function CoordinateToKey(coordinate: Coordinate): CoordinateKey {
  return `${coordinate[0]},${coordinate[1]}`;
}

export function PairCoordinateToKey(pair: PairCoordinate): PairCoordinateKey {
  const [coord1, coord2] = pair;
  const a = coord1;
  const b = coord2;
  if (a[0] < b[0] || (a[0] === b[0] && a[1] <= b[1])) {
    return `${CoordinateToKey(a)}|${CoordinateToKey(b)}`;
  }
  return `${CoordinateToKey(b)}|${CoordinateToKey(a)}`;
}

export function KeyToCoordinate(key: CoordinateKey): Coordinate | null {
  const [x, y] = key.split(",").map(Number);
  if (
    x === undefined ||
    y === undefined ||
    Number.isNaN(x) ||
    Number.isNaN(y)
  ) {
    return null;
  }
  return [x, y];
}

export function KeyToPairCoordinate(
  key: PairCoordinateKey,
): PairCoordinate | null {
  const [coord1Key, coord2Key] = key.split("|");
  if (coord1Key === undefined || coord2Key === undefined) {
    return null;
  }
  const coord1 = KeyToCoordinate(coord1Key);
  const coord2 = KeyToCoordinate(coord2Key);
  if (coord1 === null || coord2 === null) {
    return null;
  }
  return [coord1, coord2];
}

// Puzzle data structures
export type ObjectTypes = "lineObjects" | "surfaceObjects" | "symbolObjects";

export function isObjectType(value: unknown): value is ObjectTypes {
  return (
    value === "lineObjects" ||
    value === "surfaceObjects" ||
    value === "symbolObjects"
  );
}

export type TypeToCheck = "lineObjects" | "surfaceObjects" | "symbolObjects";

export interface LineObject {
  start: Coordinate;
  end: Coordinate;
  color: string;
}

export function isLineObject(value: unknown): value is LineObject {
  return (
    isPlainObject(value) &&
    isCoordinate(value.start) &&
    isCoordinate(value.end) &&
    typeof value.color === "string"
  );
}

export interface SurfaceObject {
  location: Coordinate;
  color: string;
}

export function isSurfaceObject(value: unknown): value is SurfaceObject {
  return (
    isPlainObject(value) &&
    isCoordinate(value.location) &&
    typeof value.color === "string"
  );
}

export interface SymbolObject {
  location: Coordinate;
  content: string;
  color: string;
}

export function isSymbolObject(value: unknown): value is SymbolObject {
  return (
    isPlainObject(value) &&
    isCoordinate(value.location) &&
    typeof value.content === "string" &&
    typeof value.color === "string"
  );
}

export type LineObjectDict = Record<PairCoordinateKey, LineObject>;
export type SurfaceObjectDict = Record<CoordinateKey, SurfaceObject>;
export type SymbolObjectDict = Record<CoordinateKey, SymbolObject>;

export interface LayerData {
  lineObjects: LineObjectDict;
  surfaceObjects: SurfaceObjectDict;
  symbolObjects: SymbolObjectDict;
}

export interface SolutionData {
  lineObjects: LineObjectDict;
  surfaceObjects: SurfaceObjectDict;
  symbolObjects: SymbolObjectDict;
  typeToCheck: TypeToCheck[];
}

export interface Grid {
  size: [number, number];
  problem: LayerData;
  solution?: SolutionData;
}

export interface GameState {
  grid: Grid;
  answer: LayerData;
}

export interface GameData {
  puzzle: Grid;
  playerSolution: LayerData;
}
