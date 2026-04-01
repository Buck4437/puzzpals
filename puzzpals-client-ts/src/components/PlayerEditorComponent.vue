<template>
  <BaseEditorComponent
    :grid="grid"
    :rendered-layer-list="renderedLayerList"
    :editable-layer-index="renderedLayerList.length - 1"
    @edit-message="emit('edit-message', $event)"
  />
</template>

<script setup lang="ts">
import { computed } from "vue";

import BaseEditorComponent from "@/components/BaseEditorComponent.vue";
import type { EditMessage, Grid, LayerData } from "@puzzpals/puzzle-models";
import {
  getEnabledCustomRulesLayers,
  getEnabledRulesList,
} from "@puzzpals/puzzle-models";

const props = defineProps<{
  grid: Grid;
  playerSolution: LayerData;
}>();

const emit = defineEmits<{
  "edit-message": [message: EditMessage];
}>();

const emptyLayer: LayerData = {
  lineObjects: {},
  surfaceObjects: {},
  textObjects: {},
  shapeObjects: {},
};

const grid = computed(() => props.grid);
const playerSolution = computed(() => props.playerSolution ?? emptyLayer);

const enabledRulesInfo = computed(() => {
  return getEnabledRulesList(props.grid);
});

const rulesLayers = computed(() => {
  return getEnabledCustomRulesLayers(props.grid, playerSolution.value);
});

const renderedLayerList = computed(() => {
  const renderedLayers: LayerData[] = [props.grid.problem];

  if (enabledRulesInfo.value.length > 0) {
    for (const rulesLayer of rulesLayers.value) {
      renderedLayers.push(rulesLayer);
    }
  }

  renderedLayers.push(playerSolution.value);
  return renderedLayers;
});
</script>
