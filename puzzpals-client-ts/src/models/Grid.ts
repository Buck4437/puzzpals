export type Coordinate = [number, number];
export type LineThickness = "thin" | "thick";

export type TypeToCheck = "lineObjects" | "surfaceObjects" | "cellObjects";

export interface LineObject {
  start: Coordinate;
  end: Coordinate;
  color: string;
}

export interface SurfaceObject {
  location: Coordinate;
  color: string;
}

export interface CellObject {
  location: Coordinate;
  content: string;
  color: string;
}

export interface LayerData {
  lineObjects: LineObject[];
  surfaceObjects: SurfaceObject[];
  cellObjects: CellObject[];
}

export interface SolutionData {
  lineObjects: LineObject[];
  surfaceObjects: SurfaceObject[];
  cellObjects: CellObject[];
  typeToCheck: TypeToCheck;
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
