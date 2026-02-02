const NO_INPUT = 2;

type PuzzleType = "akari" | "kakuro" | "masyu";

type Clue = number | null;

type CellData = {
  isBlack: boolean;
  number: Clue;
  input: number;
}

type Grid = {
  rows: number;
  cols: number;
  cells: Cell[];
  type: PuzzleType;
}

class Cell {
  isBlack = false;
  number: number | null = null;
  input: number = NO_INPUT;

  setClue(number: Clue) {
    this.isBlack = true;
    this.number = number;
  }

  setData(data: CellData) {
    this.isBlack = data.isBlack;
    this.number = data.number;
    this.input = data.input;
  }
}

export { NO_INPUT, type Clue, type CellData, type Grid, Cell, type PuzzleType };