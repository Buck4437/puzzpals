<template>
  <PlayerEditorComponent
    :grid="props.grid"
    :player-solution="props.playerSolution"
    @edit-message="emit('edit-message', $event)"
  />
</template>
<script setup lang="ts">
import PlayerEditorComponent from "@/components/PlayerEditorComponent.vue";
import {
  type EditMessage,
  type PuzzleData,
  type LayerData,
} from "@puzzpals/puzzle-models";

const emit = defineEmits<{
  "edit-message": [message: EditMessage];
}>();

const props = defineProps<{
  grid: PuzzleData;
  playerSolution: LayerData;
}>();
</script>
