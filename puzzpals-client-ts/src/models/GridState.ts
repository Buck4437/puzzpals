import type CellState from "./CellState";

export default interface GridState {
  rows: number;
  cols: number;
  cells: CellState[];
}
