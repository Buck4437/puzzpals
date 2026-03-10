<template>
  <div>
    <EditorComponent
      :grid="props.grid"
      :player-solution="props.playerSolution ?? null"
      @edit-message="onEditMessage"
      @resize-grid="emit('resize-grid', $event)"
    />
    <div class="undo-redo-button">
      <button
        @click="undo"
        :disabled="undoStack.length === 0"
        aria-label="Undo last edit"
      >
        Undo
      </button>
      <button
        @click="redo"
        :disabled="redoStack.length === 0"
        aria-label="Redo last undone edit"
      >
        Redo
      </button>
    </div>
  </div>
</template>
<script setup lang="ts">
import { computed, ref } from "vue";
import EditorComponent from "./EditorComponent.vue";
import {
  createInverseEditMessage,
  type EditMessage,
  type Grid,
  type LayerData,
} from "@puzzpals/puzzle-models";

const emit = defineEmits<{
  "edit-message": [message: EditMessage];
  "resize-grid": [size: [number, number]];
}>();

const props = defineProps<{
  grid: Grid;
  playerSolution?: LayerData | null;
}>();

const MAX_UNDO = 300;

type UndoRedoStackEntry = {
  undoMessage: EditMessage;
  redoMessage: EditMessage;
};

const editableLayer = computed(
  () => props.playerSolution ?? props.grid.problem,
);
const undoStack = ref<UndoRedoStackEntry[]>([]);
const redoStack = ref<UndoRedoStackEntry[]>([]);

function pushUndoEntry(entry: UndoRedoStackEntry) {
  undoStack.value.push(entry);
  if (undoStack.value.length > MAX_UNDO) {
    undoStack.value.shift();
  }
  redoStack.value = [];
}

function onEditMessage(message: EditMessage) {
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
</script>

<style scoped>
.undo-redo-button {
  display: flex;
  gap: 8px;
  margin-top: 12px;
}
</style>
