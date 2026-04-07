<template>
  <div class="editor-con">
    <div>
      <div class="tool-bar">
        <button
          v-for="(tool, i) in tools"
          :key="i"
          class="tool-button"
          :class="{ active: currentTool.codename === tool.codename }"
          @click="currentToolId = i"
        >
          {{ tool.name }}
        </button>
      </div>

      <div class="tool-panel">
        <div class="subtool-row" :class="{ hidden: subtools.length <= 0 }">
          Subtool:
          <button
            v-for="(tool, i) in subtools"
            :key="i"
            class="subtool-button"
            :class="{ active: currentSubtoolId === i }"
            @click="currentSubtoolId = i"
          >
            {{ tool }}
          </button>
        </div>
        <div v-show="currentTool.codename === 'surface'" class="tool-group">
          <div class="tool-options-con">
            <label>
              Surface color:
              <select v-model="selectedSurfaceColor">
                <option
                  v-for="color in surfaceColorTable"
                  :key="color.value"
                  :value="color.value"
                >
                  {{ color.name }}
                </option>
              </select>
            </label>
          </div>
        </div>
        <div v-show="currentTool.codename === 'line'" class="tool-group">
          <label>
            Color:
            <select v-model="selectedLineColor">
              <option
                v-for="color in lineColorTable"
                :key="color.value"
                :value="color.value"
              >
                {{ color.name }}
              </option>
            </select>
          </label>
          <label>
            Thickness:
            <select v-model="selectedLineThickness">
              <option
                v-for="thickness in lineThicknessOptions"
                :key="thickness.name"
                :value="thickness.value"
              >
                {{ thickness.name }}
              </option>
            </select>
          </label>
        </div>
        <div v-show="currentTool.codename === 'edge'" class="tool-group">
          <label>
            Color:
            <select v-model="selectedLineColor">
              <option
                v-for="color in lineColorTable"
                :key="color.value"
                :value="color.value"
              >
                {{ color.name }}
              </option>
            </select>
          </label>
          <label>
            Thickness:
            <select v-model="selectedLineThickness">
              <option
                v-for="thickness in lineThicknessOptions"
                :key="thickness.name"
                :value="thickness.value"
              >
                {{ thickness.name }}
              </option>
            </select>
          </label>
        </div>
        <div v-show="currentTool.codename === 'text'" class="tool-group">
          <label>
            Color:
            <select v-model="selectedTextColor">
              <option value="auto">Auto</option>
              <option
                v-for="color in textColorTable"
                :key="color.value"
                :value="color.value"
              >
                {{ color.name }}
              </option>
            </select>
          </label>
          <div v-show="currentSubtoolId === 1">
            <input
              ref="textInput"
              v-model="textInputValue"
              type="text"
              @input="updateSelectedCell"
              :disabled="!cursor"
            />
          </div>
        </div>
        <div v-show="currentTool.codename === 'shapes'" class="tool-group">
          <label>
            Shape
            <select v-model="selectedShapeId">
              <option v-for="shape in shapes" :key="shape.id" :value="shape.id">
                {{ shape.label }}
              </option>
            </select>
          </label>
        </div>
      </div>
    </div>

    <div class="canvas-toolbar">
      <div class="canvas-zoom-controls" aria-label="Canvas zoom controls">
        <!-- <button type="button" class="zoom-button" @click="zoomOut">-</button> -->
        <label for="canvas-zoom-input">Zoom</label>
        <input
          id="canvas-zoom-input"
          class="zoom-input"
          type="number"
          v-model.number="zoomPercentInput"
          :min="MIN_CANVAS_ZOOM_PERCENT"
          :max="MAX_CANVAS_ZOOM_PERCENT"
          :step="5"
          @change="applyZoomPercentInput"
          @blur="applyZoomPercentInput"
          @keydown.enter.prevent="applyZoomPercentInput"
        />
        <span class="zoom-unit">%</span>
        <!-- <button type="button" class="zoom-button" @click="zoomIn">+</button> -->
        <button type="button" class="zoom-button" @click="resetZoom">
          Reset
        </button>
      </div>

      <div class="canvas-toolbar-2">
        <div class="layer-toggle-con">
          <label>
            <input
              type="checkbox"
              v-model="showProblem"
              :disabled="problemLayerIndex < 0"
            />
            Show problem layer
          </label>
          <label>
            <input
              type="checkbox"
              v-model="showSolution"
              :disabled="solutionLayerIndex < 0"
            />
            Show solution layer
          </label>
        </div>

        <div class="undo-redo-button">
          <span class="location-status" aria-live="polite">
            Hover: {{ formatCellStatus(hoverCell) }}
          </span>
          <button
            class="tool-button"
            @click="undo"
            :disabled="undoStack.length === 0"
            aria-label="Undo last edit"
          >
            Undo
          </button>
          <button
            class="tool-button"
            @click="redo"
            :disabled="redoStack.length === 0"
            aria-label="Redo last undone edit"
          >
            Redo
          </button>
        </div>
      </div>
    </div>

    <div class="svg-only-viewport">
      <div class="svg-only-zoom" :style="svgZoomStyle">
        <GridSVG
          class="grid-canvas"
          :size="gridSizePx"
          :grid-size="grid.size"
          :layers="layers"
          :cursor="currentTool.codename === 'text' ? cursor : null"
          @center-cell-enter="onCenterEnter"
          @center-cell-hover="onCenterHover"
          @corner-cell-enter="onCornerEnter"
          @mouse-release="onMouseRelease"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onBeforeUnmount, watch } from "vue";
import { NormalizePairCoordinates } from "@puzzpals/puzzle-models";

import GridSVG from "@/components/editor/GridSVG.vue";
import {
  createInverseEditMessage,
  type Coordinate,
  type ShapeObject,
  type SurfaceObject,
  type LineObject,
  type TextObject,
  type EditMessage,
  type PuzzleData,
  type LayerData,
  CoordinateToKey,
  PairCoordinateToKey,
  type CoordinateKey,
  SPECIAL_CHARACTERS_LIST,
} from "@puzzpals/puzzle-models";

const props = defineProps<{
  grid: PuzzleData;
  renderedLayerList: LayerData[];
  editableLayerIndex?: number;
  problemLayerIndex?: number;
  solutionLayerIndex?: number;
}>();

const emit = defineEmits<{
  "edit-message": [message: EditMessage];
  "resize-grid": [size: [number, number]];
}>();

const grid = computed(() => props.grid);
const renderedLayerList = computed(() => props.renderedLayerList);
const editableLayerIndex = computed(() => props.editableLayerIndex ?? 0);
const MIN_CANVAS_ZOOM = 0.1;
const MAX_CANVAS_ZOOM = 3.0;
const CANVAS_ZOOM_STEP = 0.1;
const MIN_CANVAS_ZOOM_PERCENT = Math.round(MIN_CANVAS_ZOOM * 100);
const MAX_CANVAS_ZOOM_PERCENT = Math.round(MAX_CANVAS_ZOOM * 100);
const canvasZoom = ref(1);
const zoomPercentInput = ref(100);
const hoverCell = ref<Coordinate | null>(null);

function formatCellStatus(coordinate: Coordinate | null): string {
  if (coordinate === null) {
    return "none";
  }

  return `R${Math.floor(coordinate[0]) + 1}, C${Math.floor(coordinate[1]) + 1}`;
}

function clampZoomPercent(value: number): number {
  return Math.max(
    MIN_CANVAS_ZOOM_PERCENT,
    Math.min(MAX_CANVAS_ZOOM_PERCENT, Math.round(value)),
  );
}

function setZoomPercent(value: number) {
  const clampedPercent = clampZoomPercent(value);
  zoomPercentInput.value = clampedPercent;
  canvasZoom.value = Number((clampedPercent / 100).toFixed(2));
}

function zoomIn() {
  setZoomPercent((canvasZoom.value + CANVAS_ZOOM_STEP) * 100);
}

function zoomOut() {
  setZoomPercent((canvasZoom.value - CANVAS_ZOOM_STEP) * 100);
}

function resetZoom() {
  setZoomPercent(100);
}

function applyZoomPercentInput() {
  const parsedValue = Number(zoomPercentInput.value);
  if (!Number.isFinite(parsedValue)) {
    zoomPercentInput.value = Math.round(canvasZoom.value * 100);
    return;
  }

  setZoomPercent(parsedValue);
}

const svgZoomStyle = computed(() => {
  return {
    transform: `scale(${canvasZoom.value})`,
  };
});

const MAX_UNDO = 300;

type UndoRedoStackEntry = {
  undoMessage: EditMessage;
  redoMessage: EditMessage;
};

const emptyLayer: LayerData = {
  lineObjects: {},
  surfaceObjects: {},
  textObjects: {},
  shapeObjects: {},
};

const problemLayerIndex = computed(() => {
  const index = props.problemLayerIndex ?? 0;
  return index >= 0 && index < renderedLayerList.value.length ? index : -1;
});

const solutionLayerIndex = computed(() => {
  const defaultIndex = renderedLayerList.value.length - 1;
  const index = props.solutionLayerIndex ?? defaultIndex;
  return index >= 0 && index < renderedLayerList.value.length ? index : -1;
});

function isLayerVisible(index: number): boolean {
  if (index < 0 || index >= renderedLayerList.value.length) {
    return false;
  }

  if (index === problemLayerIndex.value && !showProblem.value) {
    return false;
  }

  if (index === solutionLayerIndex.value && !showSolution.value) {
    return false;
  }

  return true;
}

const layers = computed(() => {
  if (renderedLayerList.value.length === 0) {
    return [emptyLayer];
  }

  const result: LayerData[] = [];
  for (let i = 0; i < renderedLayerList.value.length; i += 1) {
    const layer = renderedLayerList.value[i];
    if (layer && isLayerVisible(i)) {
      result.push(layer);
    }
  }

  return result.length ? result : [emptyLayer];
});

const BASE_GRID_SIZE_PX = 480;
const BASE_GRID_DIMENSION = 10;

const gridSizePx = computed(() => {
  const [rows, cols] = grid.value.size;
  const maxDimension = Math.max(rows, cols, 1);

  if (maxDimension <= BASE_GRID_DIMENSION) {
    return BASE_GRID_SIZE_PX;
  }

  const pixelsPerCell = BASE_GRID_SIZE_PX / BASE_GRID_DIMENSION;
  return Math.round(maxDimension * pixelsPerCell);
});

const editableLayer = computed<LayerData>(() => {
  return renderedLayerList.value[editableLayerIndex.value] ?? emptyLayer;
});

const canEditSelectedLayer = computed(() => {
  if (
    editableLayerIndex.value < 0 ||
    editableLayerIndex.value >= renderedLayerList.value.length
  ) {
    return false;
  }

  return isLayerVisible(editableLayerIndex.value);
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
      textObjects: {
        ...mergedLayer.textObjects,
        ...layer.textObjects,
      },
      shapeObjects: {
        ...mergedLayer.shapeObjects,
        ...layer.shapeObjects,
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

const surfaceColorTable = [
  { name: "Black", value: "black" },
  { name: "Light Gray", value: "lightgray" },
  { name: "Dark Gray", value: "darkgray" },
  { name: "Blue", value: "blue" },
  { name: "Green", value: "green" },
  { name: "Red", value: "red" },
  { name: "Yellow", value: "yellow" },
  { name: "Orange", value: "orange" },
  { name: "Purple", value: "purple" },
];

const lineColorTable = [
  { name: "Green", value: "green" },
  { name: "Black", value: "black" },
  { name: "Blue", value: "blue" },
  { name: "Red", value: "red" },
  { name: "Yellow", value: "yellow" },
  { name: "Orange", value: "orange" },
  { name: "Purple", value: "purple" },
];

const textColorTable = [
  { name: "Green", value: "green" },
  { name: "Blue", value: "blue" },
  { name: "Black", value: "black" },
  { name: "White", value: "white" },
  { name: "Red", value: "red" },
  { name: "Yellow", value: "yellow" },
  { name: "Orange", value: "orange" },
  { name: "Purple", value: "purple" },
];

const lineThicknessOptions = [
  {
    name: "Default",
    value: 3,
  },
  {
    name: "Thick",
    value: 5,
  },
  {
    name: "Thin",
    value: 1,
  },
];

const currentToolId = ref(0);
const currentSubtoolId = ref(0);
const selectedSurfaceColor = ref<string>(
  surfaceColorTable[0]?.value ?? "black",
);
const selectedLineColor = ref<string>(lineColorTable[0]?.value ?? "black");
const selectedLineThickness = ref<number>(
  (lineThicknessOptions[0] ?? { value: 3 }).value,
);
const selectedTextColor = ref("auto");
const selectedShapeId = ref<string>(SPECIAL_CHARACTERS_LIST[0]?.id ?? "");
const cursor = ref<Coordinate | null>(null);
const textInput = ref<HTMLInputElement | null>(null);
const textInputValue = ref("");
const undoStack = ref<UndoRedoStackEntry[]>([]);
const redoStack = ref<UndoRedoStackEntry[]>([]);

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
  {
    name: "Shapes",
    codename: "shapes",
    subtools: [],
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

const shapes = computed(() => {
  return SPECIAL_CHARACTERS_LIST;
});

const showProblem = ref(true);
const showSolution = ref(true);

function emitRemoveMessage(type: EditMessage["type"], key: string) {
  emitEditMessage({
    messageType: "remove",
    type,
    data: key,
  });
}

function emitLineUpdate(value: LineObject) {
  emitEditMessage({
    messageType: "edit",
    type: "lineObjects",
    data: value,
  });
}

function emitSurfaceUpdate(value: SurfaceObject) {
  emitEditMessage({
    messageType: "edit",
    type: "surfaceObjects",
    data: value,
  });
}

function emitTextUpdate(value: TextObject) {
  emitEditMessage({
    messageType: "edit",
    type: "textObjects",
    data: value,
  });
}

function emitShapeUpdate(value: ShapeObject) {
  emitEditMessage({
    messageType: "edit",
    type: "shapeObjects",
    data: value,
  });
}

function pushUndoEntry(entry: UndoRedoStackEntry) {
  undoStack.value.push(entry);
  if (undoStack.value.length > MAX_UNDO) {
    undoStack.value.shift();
  }
  redoStack.value = [];
}

function emitEditMessage(message: EditMessage) {
  if (!canEditSelectedLayer.value) {
    return;
  }

  const inverseMessage = createInverseEditMessage(editableLayer.value, message);
  if (inverseMessage === null) {
    return;
  }

  pushUndoEntry({
    undoMessage: inverseMessage,
    redoMessage: message,
  });
  emit("edit-message", message);
}

function undo() {
  const entry = undoStack.value.pop();
  if (entry === undefined) {
    return;
  }

  redoStack.value.push(entry);
  emit("edit-message", entry.undoMessage);
}

function redo() {
  const entry = redoStack.value.pop();
  if (entry === undefined) {
    return;
  }

  undoStack.value.push(entry);
  emit("edit-message", entry.redoMessage);
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
  textInputValue.value = editableLayer.value.textObjects[key]?.content ?? "";
}

let cellStrokeMode: "draw" | "erase" | null = null;
let visitedCells: Set<CoordinateKey> = new Set();
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
    nextMode =
      editableLayer.value.lineObjects[lineKey] &&
      editableLayer.value.lineObjects[lineKey].color ===
        selectedLineColor.value &&
      editableLayer.value.lineObjects[lineKey].thickness ===
        selectedLineThickness.value
        ? "erase"
        : "draw";
  }

  if (nextMode === "erase") {
    emitRemoveMessage("lineObjects", lineKey);
  } else {
    emitLineUpdate({
      endpoints: NormalizePairCoordinates([start, end]),
      color: selectedLineColor.value,
      thickness: selectedLineThickness.value,
    });
  }

  return nextMode;
};

const applyEdgeSegment = (
  start: Coordinate,
  end: Coordinate,
  edgeStrokeMode: "draw" | "erase" | null,
) => {
  const lineKey = PairCoordinateToKey([start, end]);
  let nextMode = edgeStrokeMode;
  if (edgeStrokeMode === null) {
    nextMode =
      editableLayer.value.lineObjects[lineKey] &&
      editableLayer.value.lineObjects[lineKey].color ===
        selectedLineColor.value &&
      editableLayer.value.lineObjects[lineKey].thickness ===
        selectedLineThickness.value
        ? "erase"
        : "draw";
  }

  if (nextMode === "erase") {
    emitRemoveMessage("lineObjects", lineKey);
  } else {
    emitLineUpdate({
      endpoints: NormalizePairCoordinates([start, end]),
      color: selectedLineColor.value,
      thickness: selectedLineThickness.value,
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
  // Mac convention: Cmd+Z / Shift+Cmd+Z
  const isUndo =
    (event.ctrlKey || event.metaKey) && event.key === "z" && !event.shiftKey;
  const isRedo =
    (event.ctrlKey && event.key === "y") ||
    (event.metaKey && event.key === "z" && event.shiftKey);

  if (isUndo) {
    undo();
    event.preventDefault();
    return;
  }

  if (isRedo) {
    redo();
    event.preventDefault();
    return;
  }

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
  const prev = editableLayer.value.textObjects[key];
  const currentText = prev?.content || "";
  const maxTextLength = 2;

  if (event.key === "Backspace") {
    event.preventDefault();
    if (prev) {
      emitRemoveMessage("textObjects", key);
    }
  } else if (event.key.length === 1 && currentText.length < maxTextLength) {
    event.preventDefault();
    emitTextUpdate({
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
  const prev = editableLayer.value.textObjects[key];

  if (textInputValue.value === "") {
    // Delete the text if text is empty
    if (prev) {
      emitRemoveMessage("textObjects", key);
    }
  } else {
    emitTextUpdate({
      location: cursor.value,
      content: textInputValue.value,
      color: getTextColor(key),
    });
  }
};

const onMouseRelease = () => {
  visitedCells = new Set();
  cellStrokeMode = null;
  lastLineCenter = null;
  lastEdgeCorner = null;
  lineStrokeMode = null;
  edgeStrokeMode = null;
};

const onCenterHover = (coordinate: Coordinate | null) => {
  hoverCell.value = coordinate;
};

const onCenterEnter = (coordinate: Coordinate) => {
  cursor.value = coordinate;

  const key = CoordinateToKey(coordinate);

  switch (currentTool.value.codename) {
    case "surface": {
      if (visitedCells.has(key)) {
        return;
      }

      visitedCells.add(key);

      const selectedColor = selectedSurfaceColor.value;
      if (cellStrokeMode === null) {
        const prev = editableLayer.value.surfaceObjects[key];
        cellStrokeMode = prev?.color === selectedColor ? "erase" : "draw";
      }

      if (cellStrokeMode === "erase") {
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
      if (currentSubtoolId.value === 1) {
        // In input box mode, set the input value and focus
        const existing = editableLayer.value.textObjects[key];

        textInputValue.value = existing?.content || "";
        setTimeout(() => {
          textInput.value?.focus();
        }, 0);
      }
      break;
    }
    case "shapes": {
      if (visitedCells.has(key)) {
        return;
      }

      visitedCells.add(key);

      const shapeId = selectedShapeId.value;
      if (shapeId === "") {
        return;
      }

      const prev = editableLayer.value.shapeObjects[key];

      if (cellStrokeMode === null) {
        cellStrokeMode = prev?.content === shapeId ? "erase" : "draw";
      }

      if (cellStrokeMode === "erase") {
        if (prev?.content === shapeId) {
          emitRemoveMessage("shapeObjects", key);
        }
      } else {
        emitShapeUpdate({
          location: coordinate,
          content: shapeId,
        });
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

  const allowDiagonal = currentSubtoolId.value === 1;
  if (canDrawSegment(lastEdgeCorner, coordinate, allowDiagonal)) {
    edgeStrokeMode = applyEdgeSegment(
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

watch(canvasZoom, (value) => {
  zoomPercentInput.value = Math.round(value * 100);
});
</script>

<style scoped>
.editor-con {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 8px;
  width: 100%;
  min-height: 0;
  --color-tool-active: #e9e9e9;
  --border-color-tool-active: #3747ef;
}

.tool-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}

.tool-panel {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.canvas-zoom-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

.canvas-toolbar {
  display: flex;
  flex-direction: column;
  gap: 12px;
  flex-wrap: wrap;
}

.canvas-toolbar-2 {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.layer-toggle-con {
  display: flex;
  gap: 8px;
  align-items: center;
}

.layer-toggle-con label {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.9rem;
}

.zoom-button {
  border: 1px solid #d5daef;
  background: #f2f5ff;
  border-radius: 8px;
  padding: 6px 10px;
  cursor: pointer;
}

.zoom-value {
  min-width: 56px;
  text-align: center;
  font-weight: 600;
}

.zoom-input {
  width: 84px;
  text-align: center;
}

.zoom-unit {
  font-weight: 600;
}

.subtool-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  height: 45px;
}

.subtool-row.hidden {
  visibility: hidden;
}

.tool-group {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  gap: 8px;
}

.tool-options-con {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 12px;
}

.location-status {
  display: flex;
  font-size: 0.92rem;
  color: #4d5468;
  margin-right: 8px;
  min-width: 130px;
}
.undo-redo-button {
  display: flex;
  align-items: center;
  gap: 4px;
}

.tool-button,
.subtool-button {
  border-radius: 4px;
  padding: 5px 6px;
  cursor: pointer;
}

.tool-button.active,
.subtool-button.active {
  border-color: var(--border-color-tool-active);
  background: var(--border-color-tool-active);
  color: var(--color-tool-active);
}

.grid-canvas {
  border: 1px solid var(--border-color);
  border-radius: 10px;
  padding: 6px;
  display: block;
  flex: 0 0 auto;
}

.svg-only-viewport {
  flex: 1 1 auto;
  min-height: 0;
  width: 100%;
  max-width: 100%;
  overflow: auto;
}

.svg-only-zoom {
  width: max-content;
  transform-origin: top left;
}

.undo-redo-button {
  display: flex;
  align-items: center;
  gap: 8px;
  justify-content: flex-end;
}

select,
input[type="text"] {
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 6px 8px;
  font: inherit;
}
</style>
