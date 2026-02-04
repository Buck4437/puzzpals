import type CellState from "./CellState";

export const bulbText = "💡";
export const dotText = "·";

export const BULB = 0;
export const DOT = 1;
export const NO_INPUT = 2;

export default class Cell {
  readonly idx: number;

  private _isBlack = false;
  private _number: number | null = null;
  private _input = NO_INPUT;
  private _lightLevel = 0;
  private _adjacentCells = 0;

  constructor(idx: number) {
    this.idx = idx;
  }

  toggleLightBulb() {
    if (this._isBlack) {
      // Prevent modifying black cells
      return false;
    } else {
      // If the cell is marked with something else, this will clear it first
      this._input = this._input === NO_INPUT ? BULB : NO_INPUT;
      return true;
    }
  }

  toggleNote() {
    if (this._isBlack) {
      return false;
    } else {
      this._input = this._input === NO_INPUT ? DOT : NO_INPUT;
      return true;
    }
  }

  setState(data: CellState) {
    this._isBlack = data.isBlack;
    this._number = data.number;
    this._input = data.input;
  }

  changeLightLevel(increase: boolean) {
    this._lightLevel += increase ? 1 : -1;
  }

  changeAdjacentBulbCount(increase: boolean) {
    this._adjacentCells += increase ? 1 : -1;
  }

  get isBlack() {
    return this._isBlack;
  }

  get isLit() {
    return this._lightLevel > 0;
  }

  get hasBulb() {
    return this._input === BULB;
  }

  get hasBulbError() {
    return this._input === BULB && this._lightLevel > 1;
  }

  get hasNumberError() {
    return this._number !== null && this._adjacentCells > this._number;
  }

  get text() {
    if (this._isBlack) {
      if (this._number === null) {
        return "";
      } else {
        return this._number.toString();
      }
    } else {
      switch (this._input) {
        case BULB:
          return bulbText;
        case DOT:
          return dotText;
        case NO_INPUT:
          return "";
        default:
          throw new Error("Cell has invalid input");
      }
    }
  }

  get isRuleSatisfied() {
    if (this._isBlack) {
      return this._number === null || this._number === this._adjacentCells;
    } else {
      return this._lightLevel > 0 && !this.hasBulbError;
    }
  }

  get state() {
    return {
      isBlack: this._isBlack,
      number: this._number,
      input: this._input,
    };
  }
}
