<template>
  <div class="catalogue">
    <h1>Puzzle Catalogue</h1>
    <div v-if="loading">Loading puzzles...</div>
    <div v-else>
      <PuzzleCard
        v-for="puzzle in puzzles"
        :key="puzzle.id"
        :puzzle="puzzle"
        :clickable="true"
        @click="goToDetail"
      />
      <div v-if="puzzles.length === 0">No puzzles found.</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import PuzzleCard from "@/components/PuzzleCard.vue";
import api from "@/services/api";
import type { Grid } from "@puzzpals/puzzle-models";

interface Puzzle {
  id: number;
  title: string;
  author: string;
  description: string;
  puzzle_json: Grid;
  publish_date: Date;
}

const puzzles = ref<Puzzle[]>([]);
const loading = ref(true);

async function fetchPuzzles() {
  loading.value = true;
  try {
    const { data } = await api.get("/puzzles", { params: { limit: 5 } });
    puzzles.value = data;
  } catch (e) {
    puzzles.value = [];
  } finally {
    loading.value = false;
  }
}

onMounted(fetchPuzzles);

import { useRouter } from "vue-router";
const router = useRouter();
function goToDetail(id: number) {
  router.push(`/puzzle/${id}`);
}
</script>

<style scoped>
.catalogue {
  max-width: 800px;
  margin: 0 auto;
}
</style>
