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
export type ObjectTypes =
  | "lineObjects"
  | "surfaceObjects"
  | "textObjects"
  | "shapeObjects";

export function isObjectType(value: unknown): value is ObjectTypes {
  return (
    value === "lineObjects" ||
    value === "surfaceObjects" ||
    value === "textObjects" ||
    value === "shapeObjects"
  );
}

export type TypeToCheck =
  | "lineObjectsExact"
  | "lineObjectsGreenOnly"
  | "surfaceObjectsExact"
  | "surfaceObjectsDarkOnly"
  | "textObjectsExact"
  | "textObjectsContentOnly"
  | "shapeObjectsExcludeCrossMarks";

export interface LineObject {
  start: Coordinate;
  end: Coordinate;
  color: string;
  thickness?: number;
}

export function isLineObject(value: unknown): value is LineObject {
  return (
    isPlainObject(value) &&
    isCoordinate(value.start) &&
    isCoordinate(value.end) &&
    typeof value.color === "string" &&
    (value.thickness === undefined ||
      (typeof value.thickness === "number" &&
        Number.isFinite(value.thickness) &&
        value.thickness > 0))
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

export interface TextObject {
  location: Coordinate;
  content: string;
  color: string;
}

export function isTextObject(value: unknown): value is TextObject {
  return (
    isPlainObject(value) &&
    isCoordinate(value.location) &&
    typeof value.content === "string" &&
    typeof value.color === "string"
  );
}

export interface ShapeObject {
  location: Coordinate;
  content: string;
}

export function isShapeObject(value: unknown): value is ShapeObject {
  return (
    isPlainObject(value) &&
    isCoordinate(value.location) &&
    typeof value.content === "string"
  );
}

export type LineObjectDict = Record<PairCoordinateKey, LineObject>;
export type SurfaceObjectDict = Record<CoordinateKey, SurfaceObject>;
export type TextObjectDict = Record<CoordinateKey, TextObject>;
export type ShapeObjectDict = Record<CoordinateKey, ShapeObject>;

export interface LayerData {
  lineObjects: LineObjectDict;
  surfaceObjects: SurfaceObjectDict;
  textObjects: TextObjectDict;
  shapeObjects: ShapeObjectDict;
}

export interface SolutionData {
  lineObjects: LineObjectDict;
  surfaceObjects: SurfaceObjectDict;
  textObjects: TextObjectDict;
  shapeObjects: ShapeObjectDict;
  typeToCheck: TypeToCheck[];
}

export type RulesType = "akari";

export interface OptionsObject {
  rules: RulesType[];
}

export interface Grid {
  size: [number, number];
  problem: LayerData;
  solution?: SolutionData;
  options: OptionsObject;
}

export interface GameData {
  puzzle: Grid;
  playerSolution: LayerData;
}
