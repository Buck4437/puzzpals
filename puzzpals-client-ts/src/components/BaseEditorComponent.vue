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
  <GridSVG
    :size="480"
    :grid-size="grid.size"
    :layers="layers"
    :cursor="currentTool.codename === 'text' ? cursor : null"
    @center-cell-enter="onCenterEnter"
    @corner-cell-enter="onCornerEnter"
    @mouse-release="onMouseRelease"
  />
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onBeforeUnmount, watch } from "vue";

import GridSVG from "@/components/editor/GridSVG.vue";
import {
  type Coordinate,
  type SurfaceObject,
  type LineObject,
  type SymbolObject,
  type EditMessage,
  type Grid,
  type LayerData,
  CoordinateToKey,
  PairCoordinateToKey,
  type CoordinateKey,
} from "@puzzpals/puzzle-models";

const props = defineProps<{
  grid: Grid;
  renderedLayerList: LayerData[];
  editableLayerIndex?: number;
}>();

const emit = defineEmits<{
  "edit-message": [message: EditMessage];
  "resize-grid": [size: [number, number]];
}>();

const grid = computed(() => props.grid);
const renderedLayerList = computed(() => props.renderedLayerList);
const editableLayerIndex = computed(() => props.editableLayerIndex ?? 0);

const emptyLayer: LayerData = {
  lineObjects: {},
  surfaceObjects: {},
  symbolObjects: {},
};

const layers = computed(() => {
  if (renderedLayerList.value.length === 0) {
    return [emptyLayer];
  }

  return renderedLayerList.value;
});

const editableLayer = computed<LayerData>(() => {
  return layers.value[editableLayerIndex.value] ?? emptyLayer;
});

const renderedLayer = computed<LayerData>(() => {
  return layers.value.reduce<LayerData>(
    (mergedLayer, layer) => ({
      lineObjects: {
        ...mergedLayer.lineObjects,
        ...layer.lineObjects,
      },
      surfaceObjects: {
        ...mergedLayer.surfaceObjects,
        ...layer.surfaceObjects,
      },
      symbolObjects: {
        ...mergedLayer.symbolObjects,
        ...layer.symbolObjects,
      },
    }),
    emptyLayer,
  );
});

interface Tool {
  name: string;
  codename: string;
  subtools: string[];
}

const colorTable = [
  "black",
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

watch(
  () => grid.value.size,
  ([rows, cols]) => {
    // Move cursor if out of bounds
    if (cursor.value) {
      const [r, c] = cursor.value;

      if (r > rows || c > cols) {
        const rOffset = r - Math.floor(r);
        const cOffset = c - Math.floor(c);
        const newR = Math.min(r, rows + rOffset - 1);
        const newC = Math.min(c, cols + cOffset - 1);
        cursor.value = [newR, newC];

        // Update selected cell if in text mode
        if (currentTool.value.codename === "text") {
          syncTextInputFromGrid();
        }
      }
    }
  },
  { immediate: true },
);

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

function emitRemoveMessage(type: EditMessage["type"], key: string) {
  emit("edit-message", {
    messageType: "remove",
    type,
    data: key,
  });
}

function emitLineUpdate(value: LineObject) {
  emit("edit-message", {
    messageType: "edit",
    type: "lineObjects",
    data: value,
  });
}

function emitSurfaceUpdate(value: SurfaceObject) {
  emit("edit-message", {
    messageType: "edit",
    type: "surfaceObjects",
    data: value,
  });
}

function emitSymbolUpdate(value: SymbolObject) {
  emit("edit-message", {
    messageType: "edit",
    type: "symbolObjects",
    data: value,
  });
}

function getTextColor(key: string): string {
  if (selectedTextColor.value !== "auto") {
    return selectedTextColor.value;
  }

  return renderedLayer.value.surfaceObjects[key]?.color === "black"
    ? "white"
    : "black";
}

function syncTextInputFromGrid() {
  if (cursor.value === null) {
    textInputValue.value = "";
    return;
  }

  const key = CoordinateToKey(cursor.value);
  textInputValue.value = editableLayer.value.symbolObjects[key]?.content ?? "";
}

let surfaceStrokeMode: "draw" | "erase" | null = null;
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
    nextMode = editableLayer.value.lineObjects[lineKey] ? "erase" : "draw";
  }

  if (nextMode === "erase") {
    emitRemoveMessage("lineObjects", lineKey);
  } else {
    emitLineUpdate({
      start,
      end,
      color: selectedLineColor.value,
    });
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

  cursor.value = [newR, newC];
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

  if (currentSubtoolId.value !== 0 || !cursor.value) {
    return;
  }

  const key = CoordinateToKey(cursor.value);
  const prev = editableLayer.value.symbolObjects[key];
  const currentText = prev?.content || "";
  const maxTextLength = 2;

  if (event.key === "Backspace") {
    event.preventDefault();
    if (prev) {
      emitRemoveMessage("symbolObjects", key);
    }
  } else if (event.key.length === 1 && currentText.length < maxTextLength) {
    event.preventDefault();
    emitSymbolUpdate({
      location: cursor.value,
      content: currentText + event.key,
      color: getTextColor(key),
    });
  }
};

onMounted(() => {
  window.addEventListener("keydown", handleKeyboardInput);
});

onBeforeUnmount(() => {
  window.removeEventListener("keydown", handleKeyboardInput);
});

const updateSelectedCell = () => {
  if (!cursor.value) {
    return;
  }

  const key = CoordinateToKey(cursor.value);
  const prev = editableLayer.value.symbolObjects[key];

  if (textInputValue.value === "") {
    // Delete the symbol if text is empty
    if (prev) {
      emitRemoveMessage("symbolObjects", key);
    }
  } else {
    emitSymbolUpdate({
      location: cursor.value,
      content: textInputValue.value,
      color: getTextColor(key),
    });
  }
};

const onMouseRelease = () => {
  visitedSurfaces = new Set();
  surfaceStrokeMode = null;
  lastLineCenter = null;
  lastEdgeCorner = null;
  lineStrokeMode = null;
  edgeStrokeMode = null;
};

const onCenterEnter = (coordinate: Coordinate) => {
  cursor.value = coordinate;

  const key = CoordinateToKey(coordinate);

  switch (currentTool.value.codename) {
    case "surface": {
      if (visitedSurfaces.has(key)) {
        return;
      }

      visitedSurfaces.add(key);

      const selectedColor = selectedSurfaceColor.value;
      if (surfaceStrokeMode === null) {
        const prev = editableLayer.value.surfaceObjects[key];
        surfaceStrokeMode = prev?.color === selectedColor ? "erase" : "draw";
      }

      if (surfaceStrokeMode === "erase") {
        emitRemoveMessage("surfaceObjects", key);
      } else {
        emitSurfaceUpdate({
          location: coordinate,
          color: selectedColor,
        });
      }
      break;
    }
    case "line": {
      if (lastLineCenter === null) {
        lastLineCenter = coordinate;
        break;
      }

      if (
        canDrawSegment(lastLineCenter, coordinate, currentSubtoolId.value === 1)
      ) {
        lineStrokeMode = applyLineSegment(
          lastLineCenter,
          coordinate,
          lineStrokeMode,
        );
      }

      lastLineCenter = coordinate;
      break;
    }
    case "text": {
      const existing = editableLayer.value.symbolObjects[key];

      // In input box mode, set the input value and focus
      if (currentSubtoolId.value === 1) {
        textInputValue.value = existing?.content || "";
        setTimeout(() => {
          textInput.value?.focus();
        }, 0);
      }
      break;
    }
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

watch(
  () => [grid.value.problem, renderedLayerList.value, editableLayerIndex.value],
  () => {
    syncTextInputFromGrid();
  },
  { deep: true },
);
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
