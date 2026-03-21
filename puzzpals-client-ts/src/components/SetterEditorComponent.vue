<template>
  <div>
    Current dimensions: Row: {{ rowCount }}, Col: {{ colCount }}

    <br />

    Set dimensions: Row:
    <input type="number" v-model.number="inputRowCount" min="1" max="100" />
    Col:
    <input type="number" v-model.number="inputColCount" min="1" max="100" />

    <button @click="setDimensions">Set</button>
  </div>
  <div class="layer-selector">
    <button
      :class="{ active: selectedLayer === 'problem' }"
      @click="selectedLayer = 'problem'"
    >
      Problem
    </button>
    <button
      :class="{ active: selectedLayer === 'solution' }"
      @click="selectedLayer = 'solution'"
    >
      Solution
    </button>
  </div>
  <BaseEditorComponent
    :grid="grid"
    :rendered-layer-list="renderedLayerList"
    :editable-layer-index="editableLayerIndex"
    @edit-message="onEditMessage"
  />
</template>

<script setup lang="ts">
import { computed, ref, watch, type Ref } from "vue";

import BaseEditorComponent from "./BaseEditorComponent.vue";
import type {
  EditMessage,
  Grid,
  LayerData,
  SolutionData,
} from "@puzzpals/puzzle-models";

type SelectedLayer = "problem" | "solution";

const props = defineProps<{
  grid: Grid;
}>();

const emit = defineEmits<{
  "edit-problem-message": [message: EditMessage];
  "edit-solution-message": [message: EditMessage];
  "resize-grid": [size: [number, number]];
}>();

const selectedLayer = ref<SelectedLayer>("problem");

const emptySolutionLayer: SolutionData = {
  lineObjects: {},
  surfaceObjects: {},
  symbolObjects: {},
  typeToCheck: [],
};

const grid = computed(() => props.grid);
const solutionLayer = computed<SolutionData>(() => {
  return props.grid.solution ?? emptySolutionLayer;
});

const renderedLayerList = computed<LayerData[]>(() => {
  return [props.grid.problem, solutionLayer.value];
});

const editableLayerIndex = computed(() => {
  return selectedLayer.value === "problem" ? 0 : 1;
});

const rowCount = computed(() => grid.value.size[0]);
const colCount = computed(() => grid.value.size[1]);
const inputRowCount: Ref<string | number> = ref(rowCount.value);
const inputColCount: Ref<string | number> = ref(colCount.value);

const setDimensions = () => {
  // Validate input
  const x = Number(inputRowCount.value);
  const y = Number(inputColCount.value);

  if (
    !Number.isFinite(x) ||
    !Number.isFinite(y) ||
    !Number.isInteger(x) ||
    !Number.isInteger(y) ||
    x < 1 ||
    y < 1 ||
    x > 100 ||
    y > 100
  ) {
    alert("Please enter valid positive integers for dimensions (1-100).");
    return;
  }

  const newRowCount = x;
  const newColCount = y;
  emit("resize-grid", [newRowCount, newColCount]);
};

watch(
  () => grid.value.size,
  ([rows, cols]: [number, number]) => {
    inputRowCount.value = rows;
    inputColCount.value = cols;
  },
  { immediate: true },
);

function onEditMessage(message: EditMessage) {
  if (selectedLayer.value === "problem") {
    emit("edit-problem-message", message);
    return;
  }

  emit("edit-solution-message", message);
}
</script>

<style scoped>
.layer-selector {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

button.active {
  background-color: aqua;
  color: black;
}
</style>
