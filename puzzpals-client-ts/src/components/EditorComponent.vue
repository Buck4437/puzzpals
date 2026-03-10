<template>
  <div>
    <button
      v-for="(tool, i) in tools"
      :key="i"
      :class="{ active: currentTool.codename === tool.codename }"
      @click="currentToolId = i"
    >
      {{ tool.name }}
    </button>
  </div>
  <div>
    <div v-show="currentTool.codename === 'surface'">
      <div>
        Surface color:
        <select v-model="selectedSurfaceColor">
          <option v-for="color in colorTable" :key="color" :value="color">
            {{ color }}
          </option>
        </select>
      </div>
    </div>
    <div v-show="currentTool.codename === 'line'">
      <p>Line tool: connect cell centers</p>
      <div>
        Line color:
        <select v-model="selectedLineColor">
          <option v-for="color in colorTable" :key="color" :value="color">
            {{ color }}
          </option>
        </select>
      </div>
      <div>
        <button
          :class="{ active: currentSubtoolId === 0 }"
          @click="currentSubtoolId = 0"
        >
          Normal
        </button>
        <button
          :class="{ active: currentSubtoolId === 1 }"
          @click="currentSubtoolId = 1"
        >
          Diagonal
        </button>
      </div>
    </div>
    <div v-show="currentTool.codename === 'edge'">
      <p>Edge tool: connect cell corners</p>
      <div>
        Line color:
        <select v-model="selectedLineColor">
          <option v-for="color in colorTable" :key="color" :value="color">
            {{ color }}
          </option>
        </select>
      </div>
      <div>
        <button
          :class="{ active: currentSubtoolId === 0 }"
          @click="currentSubtoolId = 0"
        >
          Normal
        </button>
        <button
          :class="{ active: currentSubtoolId === 1 }"
          @click="currentSubtoolId = 1"
        >
          Diagonal
        </button>
      </div>
    </div>
    <div v-show="currentTool.codename === 'text'">
      <div>
        Text color:
        <select v-model="selectedTextColor">
          <option value="auto">Auto</option>
          <option v-for="color in colorTable" :key="color" :value="color">
            {{ color }}
          </option>
        </select>
      </div>
      <div>
        <button
          v-for="(tool, i) in subtools"
          :key="i"
          :class="{ active: currentSubtoolId === i }"
          @click="currentSubtoolId = i"
        >
          {{ tool }}
        </button>
      </div>
      <div v-show="currentSubtoolId === 0">
        <p>Simple mode: Type directly (max 2 characters)</p>
      </div>
      <div v-show="currentSubtoolId === 1">
        <label>Text: </label>
        <input
          ref="textInput"
          v-model="textInputValue"
          type="text"
          @input="updateSelectedCell"
          :disabled="!cursor"
        />
        <p v-if="cursor">Selected: [{{ cursor[0] }}, {{ cursor[1] }}]</p>
        <p v-else>Click a cell to select</p>
      </div>
    </div>
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
  <GridSVG
    :size="480"
    :grid="grid"
    :cursor="currentTool.codename === 'text' ? cursor : null"
    @center-cell-enter="onCenterEnter"
    @corner-cell-enter="onCornerEnter"
    @mouse-release="onMouseRelease"
  />
</template>

<script setup lang="ts">
import { computed, ref, type Ref, onMounted, onBeforeUnmount } from "vue";

import GridSVG from "@/components/GridSVG.vue";
import {
  type Coordinate,
  type Grid,
  KeyToCoordinate,
  KeyToPairCoordinate,
  CoordinateToKey,
  PairCoordinateToKey,
  type CoordinateKey,
} from "@puzzpals/puzzle-models";

const rowCount = ref(6);
const colCount = ref(7);
const inputRowCount: Ref<Number> = ref(6);
const inputColCount: Ref<Number> = ref(7);

interface Tool {
  name: string;
  codename: string;
  subtools: string[];
}

const colorTable = [
  "black",
  "white",
  "lightgray",
  "darkgray",
  "blue",
  "green",
  "red",
  "yellow",
  "purple",
];

const currentToolId = ref(0);
const currentSubtoolId = ref(0);
const selectedSurfaceColor = ref<string>(colorTable[0] ?? "black");
const selectedLineColor = ref<string>(colorTable[0] ?? "black");
const selectedTextColor = ref("auto");
const cursor = ref<Coordinate | null>(null);
const textInput = ref<HTMLInputElement | null>(null);
const textInputValue = ref("");

const tools: Tool[] = [
  {
    name: "Surface",
    codename: "surface",
    subtools: [],
  },
  {
    name: "Line",
    codename: "line",
    subtools: ["Normal", "Diagonal"],
  },
  {
    name: "Edge",
    codename: "edge",
    subtools: ["Normal", "Diagonal"],
  },
  {
    name: "Text",
    codename: "text",
    subtools: ["Simple", "Input box"],
  },
];

const currentTool = computed(() => {
  const curTool = tools[currentToolId.value];
  if (curTool === undefined) {
    return { name: "unknown", codename: "unknown", subtools: [] };
  }
  return curTool;
});

const subtools = computed(() => {
  return currentTool.value.subtools;
});

const grid = ref<Grid>({
  size: [rowCount.value, colCount.value],
  problem: {
    lineObjects: {},
    surfaceObjects: {},
    symbolObjects: {},
  },
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

  // Move cursor if out of bounds
  if (cursor.value) {
    const [r, c] = cursor.value;

    if (r > newRowCount || c > newColCount) {
      const rOffset = r - Math.floor(r);
      const cOffset = c - Math.floor(c);
      const newR = Math.min(r, newRowCount + rOffset - 1);
      const newC = Math.min(c, newColCount + cOffset - 1);
      cursor.value = [newR, newC];

      // Update selected cell if in text mode
      if (currentTool.value.codename === "text") {
        const key = CoordinateToKey(cursor.value);
        const existing = grid.value.problem.symbolObjects[key];
        textInputValue.value = existing?.content || "";
      }
    }
  }
};

let firstClickColor: string | null = null;
let visitedSurfaces: Set<CoordinateKey> = new Set();
let lastLineCenter: Coordinate | null = null;
let lastEdgeCorner: Coordinate | null = null;
let lineStrokeMode: "draw" | "erase" | null = null;
let edgeStrokeMode: "draw" | "erase" | null = null;

const canDrawSegment = (
  start: Coordinate,
  end: Coordinate,
  allowDiagonal: boolean,
) => {
  const absDr = Math.abs(end[0] - start[0]);
  const absDc = Math.abs(end[1] - start[1]);

  const isNormalAdjacent =
    (absDr === 1 && absDc === 0) || (absDr === 0 && absDc === 1);
  const isDiagonalAdjacent = absDr === 1 && absDc === 1;

  return allowDiagonal
    ? isDiagonalAdjacent || isNormalAdjacent
    : isNormalAdjacent;
};

const applyLineSegment = (
  start: Coordinate,
  end: Coordinate,
  strokeMode: "draw" | "erase" | null,
) => {
  const lineKey = PairCoordinateToKey([start, end]);
  let nextMode = strokeMode;
  if (strokeMode === null) {
    nextMode = grid.value.problem.lineObjects[lineKey] ? "erase" : "draw";
  }

  if (nextMode === "erase") {
    delete grid.value.problem.lineObjects[lineKey];
  } else {
    grid.value.problem.lineObjects[lineKey] = {
      start,
      end,
      color: selectedLineColor.value,
    };
  }

  return nextMode;
};

// Arrow-key cursor movement
const moveCursorBy = (dr: number, dc: number) => {
  const numRows = grid.value.size[0];
  const numCols = grid.value.size[1];

  // Start from current cursor or top-left cell
  let base: Coordinate = cursor.value ? cursor.value : [0.5, 0.5];

  const [r, c] = base;
  const [newR, newC] = [r + dr, c + dc];

  const minR = 0;
  const maxR = numRows;
  const minC = 0;
  const maxC = numCols;

  // Prevent movement if cursor goes out of bounds
  if (newR < minR || newR >= maxR || newC < minC || newC >= maxC) {
    return;
  }

  const newCoord: Coordinate = [newR, newC];
  cursor.value = newCoord;
};

const handleKeyboardInput = (event: KeyboardEvent) => {
  // Ignore key events when typing in form fields
  const target = event.target as HTMLElement | null;
  if (
    target &&
    (target.tagName === "INPUT" ||
      target.tagName === "TEXTAREA" ||
      target.tagName === "SELECT" ||
      target.isContentEditable)
  ) {
    return;
  }

  if (currentTool.value.codename !== "text") {
    return;
  }

  // Only active in text tool simple mode
  switch (event.key) {
    case "ArrowUp":
      event.preventDefault();
      moveCursorBy(-1, 0);
      return;
    case "ArrowDown":
      event.preventDefault();
      moveCursorBy(1, 0);
      return;
    case "ArrowLeft":
      event.preventDefault();
      moveCursorBy(0, -1);
      return;
    case "ArrowRight":
      event.preventDefault();
      moveCursorBy(0, 1);
      return;
  }

  if (currentSubtoolId.value !== 0) {
    return;
  }

  if (!cursor.value) {
    return;
  }

  const key = CoordinateToKey(cursor.value);
  const prev = grid.value.problem.symbolObjects[key];
  let currentText = prev?.content || "";
  const maxTextLength = 2;

  if (event.key === "Backspace") {
    event.preventDefault();
    if (prev) {
      // Delete all characters
      delete grid.value.problem.symbolObjects[key];
    }
  } else if (event.key.length === 1 && currentText.length < maxTextLength) {
    // Max 2 characters
    event.preventDefault();
    const newText = currentText + event.key;

    let textColor: string;
    if (selectedTextColor.value === "auto") {
      textColor =
        grid.value.problem.surfaceObjects[key]?.color === "black"
          ? "white"
          : "black";
    } else {
      textColor = selectedTextColor.value;
    }

    grid.value.problem.symbolObjects[key] = {
      location: cursor.value,
      content: newText,
      color: textColor,
    };
  }
};

onMounted(() => {
  window.addEventListener("keydown", handleKeyboardInput);
});

onBeforeUnmount(() => {
  window.removeEventListener("keydown", handleKeyboardInput);
});

defineExpose({
  grid,
});

const updateSelectedCell = () => {
  if (!cursor.value) {
    return;
  }

  const key = CoordinateToKey(cursor.value);
  const prev = grid.value.problem.symbolObjects[key];

  if (textInputValue.value === "") {
    // Delete the symbol if text is empty
    if (prev) {
      delete grid.value.problem.symbolObjects[key];
    }
  } else {
    // Calculate text color
    let textColor: string;
    if (selectedTextColor.value === "auto") {
      textColor =
        grid.value.problem.surfaceObjects[key]?.color === "black"
          ? "white"
          : "black";
    } else {
      textColor = selectedTextColor.value;
    }

    // Update or create the symbol
    grid.value.problem.symbolObjects[key] = {
      location: cursor.value,
      content: textInputValue.value,
      color: textColor,
    };
  }
};

const onMouseRelease = () => {
  visitedSurfaces = new Set();
  firstClickColor = null;
  lastLineCenter = null;
  lastEdgeCorner = null;
  lineStrokeMode = null;
  edgeStrokeMode = null;
};

const onCenterEnter = (coordinate: Coordinate) => {
  cursor.value = coordinate;

  const key = CoordinateToKey(coordinate);

  switch (currentTool.value.codename) {
    case "surface":
      {
        if (visitedSurfaces.has(key)) {
          return;
        }

        visitedSurfaces.add(key);

        const selectedColor = selectedSurfaceColor.value;
        if (typeof selectedColor !== "string") {
          return;
        }

        // If the clicked cell has the same color, set to white. Otherwise, set to that color
        let paintedColor: string;

        if (firstClickColor === null) {
          const prev = grid.value.problem.surfaceObjects[key];
          if (!prev || prev.color != selectedColor) {
            paintedColor = selectedColor;
          } else {
            paintedColor = "white";
          }
          firstClickColor = paintedColor;
        } else {
          paintedColor = firstClickColor;
        }

        grid.value.problem.surfaceObjects[key] = {
          location: coordinate,
          color: paintedColor,
        };
      }
      break;
    case "line":
      {
        if (lastLineCenter === null) {
          lastLineCenter = coordinate;
          break;
        }

        if (
          canDrawSegment(
            lastLineCenter,
            coordinate,
            currentSubtoolId.value === 1,
          )
        ) {
          lineStrokeMode = applyLineSegment(
            lastLineCenter,
            coordinate,
            lineStrokeMode,
          );
        }

        lastLineCenter = coordinate;
      }
      break;
    case "text":
      {
        const existing = grid.value.problem.symbolObjects[key];

        // In input box mode, set the input value and focus
        if (currentSubtoolId.value === 1) {
          textInputValue.value = existing?.content || "";
          setTimeout(() => {
            textInput.value?.focus();
          }, 0);
        }
      }
      break;
  }
};

const onCornerEnter = (coordinate: Coordinate) => {
  if (currentTool.value.codename !== "edge") {
    return;
  }

  if (lastEdgeCorner === null) {
    lastEdgeCorner = coordinate;
    return;
  }

  if (
    canDrawSegment(lastEdgeCorner, coordinate, currentSubtoolId.value === 1)
  ) {
    edgeStrokeMode = applyLineSegment(
      lastEdgeCorner,
      coordinate,
      edgeStrokeMode,
    );
  }

  lastEdgeCorner = coordinate;
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
