<template>
  <div class="grid-wrapper">
    <div 
      class="grid" 
      :style="{
        gridTemplateColumns: `repeat(${initialGridState.cols}, 1fr)`,
        gridTemplateRows: `repeat(${initialGridState.rows}, 1fr)`
      }"
    >
      <AkariCell 
        v-for="(cell, idx) in cells" 
        :key="idx" 
        :idx="idx" 
        :cell="cell" 
        @left-click="onCellClicked"
        @right-click="onCellRightClicked" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { nextTick, onBeforeMount, onBeforeUnmount, ref, watch, type Ref } from "vue";

import AkariCell from "@/components/AkariCell.vue";
import Cell from "@/models/Cell";
import type CellState from "@/models/CellState";
import type GridState from "@/models/GridState";

const props = defineProps<{
  initialGridState: GridState;
}>();

const emit = defineEmits(['updateCell']);

const cells: Ref<Cell[]> = ref([]);

const rows = props.initialGridState.rows;
const cols = props.initialGridState.cols;
const hasWon = ref(false);

// Undo / Redo functionality
const MAX_UNDO = 300;

type UndoRedoStackEntry = {
  idx: number;
  prevState: CellState;
};

const undoRedoStack = {
  undo: [] as UndoRedoStackEntry[],
  redo: [] as UndoRedoStackEntry[]
}

function updateUndoRedoStack(idx: number, prevState: CellState) {
  undoRedoStack.undo.push({ idx, prevState });
  undoRedoStack.redo = [];

  if (undoRedoStack.undo.length > MAX_UNDO) {
    undoRedoStack.undo.shift();
  }
}

function undo() {
  const entry = undoRedoStack.undo.pop();
  if (entry) {
    const cell = getCell(entry.idx);
    const currentState = cell.state;
    onCellUpdated(entry.idx, entry.prevState);
    emit('updateCell', entry.idx, entry.prevState);
    undoRedoStack.redo.push({ idx: entry.idx, prevState: currentState });
  }
}

function redo() {
  const entry = undoRedoStack.redo.pop();
  if (entry) {
    const cell = getCell(entry.idx);
    const currentState = cell.state;
    onCellUpdated(entry.idx, entry.prevState);
    emit('updateCell', entry.idx, entry.prevState);
    undoRedoStack.undo.push({ idx: entry.idx, prevState: currentState });
  }
}

function onCellClicked(cell: Cell) {
  const prevState = cell.state;
  if (cell.toggleLightBulb()) {
    updateUndoRedoStack(cell.idx, prevState);
    emit('updateCell', cell.idx, cell.state);
  }
}

function onCellRightClicked(cell: Cell) {
  const prevState = cell.state;
  if (cell.toggleNote()) {
    updateUndoRedoStack(cell.idx, prevState);
    emit('updateCell', cell.idx, cell.state);
  }
}

function onCellUpdated(idx: number, cellState: CellState) {
  const cell = getCell(idx);
  cell.setState(cellState);
}

function getRowCol(idx: number): [number, number] {
  const row = Math.floor(idx / cols);
  const col = idx % cols;
  return [row, col];
}

function getIdx(row: number, col: number) {
  return row * cols + col;
}

function getCell(idx: number) {
  const cell = cells.value[idx];
  if (typeof cell === "undefined") {
    throw new Error(`Cell is undefined (idx = ${idx})`);
  }
  return cell;
}

function onBulbChanged(modifiedCell: Cell) {
  // Light itself up
  modifiedCell.changeLightLevel(modifiedCell.hasBulb);

  const [startRow, startCol] = getRowCol(modifiedCell.idx);
  const steps: [number, number][] = [
    [0, 1],
    [0, -1],
    [1, 0],
    [-1, 0]
  ];

  for (const [dr, dc] of steps) {
    let row = startRow + dr;
    let col = startCol + dc;

    // Update number of adjacent bulbs
    if (row >= 0 && row < rows && col >= 0 && col < cols) {
      const idx = getIdx(row, col);
      const cell = getCell(idx);
      cell.changeAdjacentBulbCount(modifiedCell.hasBulb);
    }

    // Update light levels
    while (row >= 0 && row < rows && col >= 0 && col < cols) {
      const idx = getIdx(row, col);
      const cell = getCell(idx);
      if (cell.isBlack) {
        break;
      }
      cell.changeLightLevel(modifiedCell.hasBulb);
      row += dr;
      col += dc;
    }
  }

  // Check victory
  if (!hasWon.value && cells.value.every(cell => cell.isRuleSatisfied)) {
    hasWon.value = true;
  }
}

defineExpose({ onCellUpdated, undo, redo });

const keyboardListener = (e: KeyboardEvent) => {
  // Mac convention: Cmd+Z / Shift+Cmd+Z
  const isUndo = (e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey;
  const isRedo = (e.ctrlKey && e.key === 'y') || (e.metaKey && e.key === 'z' && e.shiftKey);

  if (isUndo) {
    undo();
    e.preventDefault();
  } else if (isRedo) {
    redo();
    e.preventDefault();
  }
};

onBeforeMount(() => {
  // Convert CellStates to Cell objects
  props.initialGridState.cells.forEach((cellState, idx) => {
    const cell = new Cell(idx);
    cell.setState(cellState);
    cells.value.push(cell);
  });

  // Calculate light levels
  cells.value.forEach(cell => {
    // Initialise light levels
    if (cell.hasBulb) {
      onBulbChanged(cell);
    }
    // Watch light bulbs get added/removed from Cells, and update light levels
    watch(() => cell.hasBulb, () => onBulbChanged(cell));
  });

  window.addEventListener('keydown', keyboardListener);
});

watch(hasWon, async (won) => {
  // I have seriously no idea why setTimeout is necessary
  if (won) {
    await nextTick();
    setTimeout(() => alert("Win"), 0);
  }
});

onBeforeUnmount(() => {
  window.removeEventListener('keydown', keyboardListener);
});
</script>

<style scoped>
.grid-wrapper {
  width: 100%;
  max-width: 480px;
  margin: 0 auto;
  padding: 12px;
}

.grid {
  display: grid;
}
</style>
