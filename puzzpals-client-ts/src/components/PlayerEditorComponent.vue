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

import BaseEditorComponent from "./BaseEditorComponent.vue";
import type { EditMessage, Grid, LayerData } from "@puzzpals/puzzle-models";
import { calculateAkariRulesLayer } from "@puzzpals/puzzle-models";

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
  symbolObjects: {},
};

const grid = computed(() => props.grid);
const playerSolution = computed(() => props.playerSolution ?? emptyLayer);

const akariLayer = computed(() => {
  return calculateAkariRulesLayer(props.grid, playerSolution.value);
});

const renderedLayerList = computed(() => [
  props.grid.problem,
  akariLayer.value,
  playerSolution.value,
]);
</script>
