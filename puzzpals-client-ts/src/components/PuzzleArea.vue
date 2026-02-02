<template>
    <AkariGrid 
        :initial-grid-state="initialGridState" 
        @update-cell="(idx, val) => emit('updateCell', idx, val)" 
        ref="gridComponent" 
    />
    <button @click="undo" aria-label="Undo last move">Undo</button>
    <button @click="redo" aria-label="Redo last move">Redo</button>
</template>
<script setup lang="ts">
import { useTemplateRef } from 'vue';
import AkariGrid from './AkariGrid.vue';
import type GridState from '@/models/GridState';
import type CellState from '@/models/CellState';

const emit = defineEmits(['updateCell']);

const props = defineProps<{
  initialGridState: GridState;
}>();

const gridComponent = useTemplateRef("gridComponent");

function undo() {
  gridComponent.value?.undo();
}

function redo() {
  gridComponent.value?.redo();
}

function onCellUpdated(idx: number, newState: CellState) {
  if (gridComponent.value === null) {
    throw new Error("Grid is missing");
  };
  gridComponent.value.onCellUpdated(idx, newState);
}

defineExpose({ onCellUpdated });

</script>