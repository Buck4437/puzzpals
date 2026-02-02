import { Cell, NO_INPUT, type Grid, type PuzzleType } from "../types/Akari.js";

const validChars = new Set(["0", "1", "2", "3", "4", ".", "#"]);

function parse(input: unknown): Grid {
    // input
    if (!(
        input !== null &&
        typeof input === "object" &&
        "type" in input &&
        "grid" in input
    )) {
        throw new Error("Invalid input");
    }

    // input.type
    if (input.type !== "akari") {
        throw new Error(`Invalid puzzle type: ${input.type}`);
    }

    // input.grid
    const gridData = input.grid;
    if (!(Array.isArray(gridData) && gridData.length > 0)) {
        throw new Error("Grid is not a non-empty array");
    }

    let expectedCols = -1;
    const cells: Cell[] = [];

    // input.grid[row]
    gridData.forEach(row => {
        if (expectedCols === -1) {
            // input.grid[0]
            if (!(Array.isArray(row) && row.length > 0)) {
                throw new Error("Rows are not non-empty arrays of the same length");
            }
            expectedCols = row.length;
        } else {
            // input.grid[1..n-1]
            if (!(Array.isArray(row) && row.length === expectedCols)) {
                throw new Error("Rows are not non-empty arrays of the same length");
            }
        }

        // input.grid[row][col]
        row.forEach(cell => {
            if (validChars.has(cell)) {
                // Finally valid
                const newCell: Cell = new Cell();
                const cellData = {
                    isBlack: cell !== ".",
                    number: (cell !== "#" && cell !== ".") ? parseInt(cell, 10) : null,
                    input: NO_INPUT
                };
                newCell.setData(cellData);
                cells.push(newCell);
            } else {
                throw new Error("Invalid cell symbol");
            }
        });
    });

    return {
        rows: gridData.length,
        cols: expectedCols,
        cells,
        type: "akari" as PuzzleType
    };
}

function serialize(input: Grid): string {
    const obj = {
        type: input.type,
        rows: input.rows,
        cols: input.cols,
        cells: input.cells
    }
    return JSON.stringify(obj);
}

function deserialize(input: string): Grid {
    const obj = JSON.parse(input);

    return {
        rows: obj.rows,
        cols: obj.cols,
        type: obj.type,
        cells: obj.cells.map((cellData: any) => {
            const cell = new Cell();
            cell.setData(cellData);
            return cell;
        })
    }
}

export { parse, serialize, deserialize };