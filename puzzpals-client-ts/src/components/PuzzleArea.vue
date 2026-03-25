<template>
  <div>
    <PlayerEditorComponent
      :grid="props.grid"
      :player-solution="props.playerSolution"
      @edit-message="emit('edit-message', $event)"
    />
  </div>
</template>
<script setup lang="ts">
import PlayerEditorComponent from "./PlayerEditorComponent.vue";
import {
  type EditMessage,
  type Grid,
  type LayerData,
} from "@puzzpals/puzzle-models";

const emit = defineEmits<{
  "edit-message": [message: EditMessage];
}>();

const props = defineProps<{
  grid: Grid;
  playerSolution: LayerData;
}>();
</script>
