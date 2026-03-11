<template>
  <BaseEditorComponent
    :grid="grid"
    :rendered-layer-list="renderedLayerList"
    :editable-layer-index="1"
    :show-resize-controls="false"
    @edit-message="emit('edit-message', $event)"
  />
</template>

<script setup lang="ts">
import { computed } from "vue";

import BaseEditorComponent from "./BaseEditorComponent.vue";
import type { EditMessage, Grid, LayerData } from "@puzzpals/puzzle-models";

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
const renderedLayerList = computed(() => [
  props.grid.problem,
  playerSolution.value,
]);
</script>
