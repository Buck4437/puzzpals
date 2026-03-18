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
import { computed, ref, watch } from "vue";

import BaseEditorComponent from "./BaseEditorComponent.vue";
import type {
  RulesType,
  EditMessage,
  Grid,
  LayerData,
  SolutionData,
} from "@puzzpals/puzzle-models";
import {
  getEnabledCustomRulesLayers,
  getEnabledRulesList,
} from "@puzzpals/puzzle-models";

type SelectedLayer = "problem" | "solution";

const props = defineProps<{
  grid: Grid;
  showRulesLayer?: boolean;
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
  textObjects: {},
  shapeObjects: {},
  typeToCheck: [],
};

const grid = computed(() => props.grid);
const showRulesLayer = computed(() => props.showRulesLayer === true);
const solutionLayer = computed<SolutionData>(() => {
  return props.grid.solution ?? emptySolutionLayer;
});

const rulesLayers = computed(() => {
  return getEnabledCustomRulesLayers(props.grid, solutionLayer.value);
});

const enabledRules = computed<RulesType[]>(() => {
  return getEnabledRulesList(props.grid).map((rule) => rule.id);
});

const renderedLayerList = computed<LayerData[]>(() => {
  const renderedLayers: LayerData[] = [props.grid.problem];

  if (showRulesLayer.value && enabledRules.value.length > 0) {
    for (const rulesLayer of rulesLayers.value) {
      renderedLayers.push(rulesLayer);
    }
  }

  renderedLayers.push(solutionLayer.value);
  return renderedLayers;
});

const editableLayerIndex = computed(() => {
  return selectedLayer.value === "problem"
    ? 0
    : renderedLayerList.value.length - 1;
});

const rowCount = computed(() => grid.value.size[0]);
const colCount = computed(() => grid.value.size[1]);
const inputRowCount = ref(rowCount.value);
const inputColCount = ref(colCount.value);

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
