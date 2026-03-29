<template>
  <div class="setter-editor-scroll">
    <div class="setter-editor-content">
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
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";

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

function onEditMessage(message: EditMessage) {
  if (selectedLayer.value === "problem") {
    emit("edit-problem-message", message);
    return;
  }

  emit("edit-solution-message", message);
}
</script>

<style scoped>
.setter-editor-scroll {
  width: 100%;
  max-width: 100%;
  max-height: 100%;
  overflow: auto;
}

.setter-editor-content {
  min-width: 100%;
  width: max-content;
}

.layer-selector {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
  align-items: center;
  justify-content: flex-start;

  --background-color-layer-active: rgb(11, 207, 207);
  --color-layer-active: rgb(65, 65, 65);
}

button.active {
  background-color: var(--background-color-layer-active);
  border-color: var(--background-color-layer-active);
  color: var(--color-layer-active);
}
</style>
