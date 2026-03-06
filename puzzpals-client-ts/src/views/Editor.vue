<template>
  <div>
    <button
      v-for="tool in tools"
      :key="tool"
      :class="{ active: currentTool === tool }"
      @click="currentTool = tool"
    >
      {{ tool }}
    </button>
  </div>
  <div>
    Current dimensions: Row: {{ rowCount }}, Col: {{ colCount }}

    <br />

    Set dimensions: Row:
    <input type="number" v-model.number="inputRowCount" min="1" max="100" />
    Col:
    <input type="number" v-model.number="inputColCount" min="1" max="100" />

    <button @click="setDimensions">Set</button>
  </div>
  Current tool: {{ currentTool }}
  <button @click="exportGrid" :disabled="!canExport">Export as akari</button>
  <GridSVG
    :size="480"
    :grid="grid"
    @center-cell-enter="onCenterEnter"
    @mouse-release="onMouseRelease"
  />
</template>

<script setup lang="ts">
import { computed, ref, type Ref } from "vue";

import GridSVG from "@/components/GridSVG.vue";
import {
  type Coordinate,
  type Grid,
  KeyToCoordinate,
  KeyToPairCoordinate,
  CoordinateToKey,
  PairCoordinateToKey,
  type CoordinateKey,
} from "@/models/Grid";

const rowCount = ref(6);
const colCount = ref(7);
const inputRowCount: Ref<Number> = ref(6);
const inputColCount: Ref<Number> = ref(7);

const tools = ["colors", "symbols"];
const currentTool = ref(tools[0]);

const grid = ref<Grid>({
  size: [rowCount.value, colCount.value],
  problem: {
    lineObjects: {},
    surfaceObjects: {},
    symbolObjects: {},
  },
});

const canExport = computed(() => {
  return true;
});

const setDimensions = () => {
  // Validate input
  const [x, y] = [inputRowCount.value, inputColCount.value];

  if (
    typeof x !== "number" ||
    typeof y !== "number" ||
    x <= 0 ||
    y <= 0 ||
    x > 100 ||
    y > 100
  ) {
    alert("Please enter valid positive integers for dimensions (1-100).");
    return;
  }

  const newRowCount = x;
  const newColCount = y;

  grid.value.size = [newRowCount, newColCount];

  // Remove objects that are out of bounds
  grid.value.problem.lineObjects = Object.fromEntries(
    Object.entries(grid.value.problem.lineObjects).filter(([key, line]) => {
      const pair = KeyToPairCoordinate(key);
      if (pair === null) {
        return false;
      }
      const [start, end] = pair;
      return (
        start[0] < newRowCount &&
        start[1] < newColCount &&
        end[0] < newRowCount &&
        end[1] < newColCount
      );
    }),
  );

  grid.value.problem.surfaceObjects = Object.fromEntries(
    Object.entries(grid.value.problem.surfaceObjects).filter(
      ([key, surface]) => {
        const coordinate = KeyToCoordinate(key);
        if (coordinate === null) {
          return false;
        }
        return coordinate[0] < newRowCount && coordinate[1] < newColCount;
      },
    ),
  );

  grid.value.problem.symbolObjects = Object.fromEntries(
    Object.entries(grid.value.problem.symbolObjects).filter(([key, symbol]) => {
      const coordinate = KeyToCoordinate(key);
      if (coordinate === null) {
        return false;
      }
      return coordinate[0] < newRowCount && coordinate[1] < newColCount;
    }),
  );

  rowCount.value = newRowCount;
  colCount.value = newColCount;
};

const downloadObjectAsJson = (exportObj: object, exportName: string) => {
  const dataStr =
    "data:text/json;charset=utf-8," +
    encodeURIComponent(JSON.stringify(exportObj));
  const downloadAnchorNode = document.createElement("a");
  downloadAnchorNode.setAttribute("href", dataStr);
  downloadAnchorNode.setAttribute("download", exportName + ".json");
  document.body.appendChild(downloadAnchorNode); // required for firefox
  downloadAnchorNode.click();
  downloadAnchorNode.remove();
};

const exportGrid = () => {
  const emptyMatrix = Array.from({ length: grid.value.size[0] }, () =>
    Array.from({ length: grid.value.size[1] }, () => "."),
  );

  const validSymbols = new Set(["0", "1", "2", "3", "4"]);

  for (const [key, surface] of Object.entries(
    grid.value.problem.surfaceObjects,
  )) {
    const coordinate = KeyToCoordinate(key);

    if (coordinate === null) {
      continue;
    }

    const [r, c] = coordinate;

    const row = emptyMatrix[r - 0.5];
    if (!row) {
      continue;
    }

    if (row[c - 0.5] === undefined) {
      continue;
    }

    if (surface.color === "white") {
      continue;
    }

    // check if it has numbers
    if (grid.value.problem.symbolObjects[key]) {
      const symbol = grid.value.problem.symbolObjects[key];
      if (validSymbols.has(symbol.content)) {
        row[c - 0.5] = symbol.content;
      }
      continue;
    } else {
      row[c - 0.5] = "#";
    }
  }

  const grid2 = emptyMatrix;
  const exportData = {
    type: "akari",
    grid: grid2,
  };
  downloadObjectAsJson(exportData, "akari-puzzle");
};

let firstClickColor: "black" | "white" | null = null;
let firstClickSymbol: string | null = null;
let visitedCells: Set<CoordinateKey> = new Set();

const onMouseRelease = () => {
  visitedCells = new Set(); // Clear visited cells on mouse release
  firstClickColor = null;
  firstClickSymbol = null;
};

const onCenterEnter = (coordinate: Coordinate) => {
  const key = CoordinateToKey(coordinate);

  if (visitedCells.has(key)) {
    return;
  }

  visitedCells.add(key);

  switch (currentTool.value) {
    case "symbols":
      {
        const prev = grid.value.problem.symbolObjects[key];

        let newSymbol =
          {
            "": "0",
            "0": "1",
            "1": "2",
            "2": "3",
            "3": "4",
            "4": "",
          }[prev?.content || ""] || "";

        if (firstClickSymbol === null) {
          firstClickSymbol = newSymbol;
        } else if (newSymbol !== firstClickSymbol) {
          // If it's not the same as the first click, use the first click's symbol instead
          newSymbol = firstClickSymbol;
        }

        if (prev) {
          if (newSymbol === "") {
            delete grid.value.problem.symbolObjects[key];
          } else {
            grid.value.problem.symbolObjects[key] = {
              ...prev,
              content: newSymbol,
            };
          }
        } else {
          if (newSymbol === "") {
            return;
          }
          const textColor =
            grid.value.problem.surfaceObjects[key]?.color === "black"
              ? "white"
              : "black";

          grid.value.problem.symbolObjects[key] = {
            location: coordinate,
            content: newSymbol,
            color: textColor,
          };
        }
      }
      break;
    case "colors":
      {
        const prev = grid.value.problem.surfaceObjects[key];
        let prevColor = prev?.color || "white";
        let currColor: "black" | "white" =
          prevColor === "white" ? "black" : "white";
        if (firstClickColor === null) {
          firstClickColor = currColor;
        } else if (currColor !== firstClickColor) {
          // If it's not the same as the first click, use the first click's color instead
          currColor = firstClickColor;
        }

        let textColor = currColor === "white" ? "black" : "white";

        grid.value.problem.surfaceObjects[key] = {
          location: coordinate,
          color: currColor,
        };

        // Change the text color
        const symbol = grid.value.problem.symbolObjects[key];
        if (symbol) {
          grid.value.problem.symbolObjects[key] = {
            ...symbol,
            color: textColor,
          };
        }
      }
      break;
  }
};
</script>

<style scoped>
.grid-wrapper {
  padding: 12px;
}

.grid-row {
  display: flex;
  flex-direction: row;
}

.cell {
  border: 1px solid #ccc;
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  user-select: none;
  -moz-user-select: none;
  cursor: pointer;
}

.cell-color-white {
  background-color: white;
}

.cell-color-black {
  background-color: black;
  color: white;
}

button.active {
  background-color: aqua;
  color: black;
}
</style>
