const NO_INPUT = 2;

export default class Cell {
  isBlack = false;
  number: number | null = null;
  input = NO_INPUT;

  setBlack() {
    this.isBlack = true;
  }

  setClue(number: number) {
    this.isBlack = true;
    this.number = number;
  }

  setData(data: { input: number }) {
    this.input = data.input;
  }
}
