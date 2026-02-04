const {
  createEmptyGrid,
} = require("../packages/puzzle-parser/dist/cjs/index.cjs");

// roomId => grid
const grids = new Map();

module.exports = { grids, createEmptyGrid };
