<template>
  <div class="puzzle-grid">
    <PuzzleCard
      v-for="puzzle in puzzles"
      :key="puzzle.id"
      :puzzle="puzzle"
      :clickable="true"
      class="puzzle-card"
      @click="emit('puzzleClick', puzzle.id)"
    />
  </div>
</template>

<script setup lang="ts">
import PuzzleCard from "@/components/PuzzleCard.vue";
import { type Puzzle } from "@/services/PuzzleSearchService";

const emit = defineEmits<{
  puzzleClick: [puzzleId: number];
}>();

defineProps<{
  puzzles: Puzzle[];
}>();
</script>

<style>
.puzzle-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
  margin-bottom: 1em;
  width: 100%;
}

.puzzle-grid .puzzle-card {
  width: 100%;
  min-width: 0;
  box-sizing: border-box;
}

@media (min-width: 1000px) {
  .puzzle-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (min-width: 1500px) {
  .puzzle-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}
</style>
