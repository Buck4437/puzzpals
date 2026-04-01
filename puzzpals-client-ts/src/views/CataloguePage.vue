<template>
  <div class="catalogue">
    <h1>Puzzle Catalogue</h1>
    <div v-if="loading">Loading puzzles...</div>
    <div v-else>
      <div v-for="puzzle in puzzles" :key="puzzle.id" class="puzzle-card">
        <h2>{{ puzzle.description || "Untitled Puzzle" }}</h2>
        <p><strong>Author:</strong> {{ puzzle.author }}</p>
        <p>
          <strong>Date:</strong>
          {{
            puzzle.publish_date
              ? new Date(puzzle.publish_date).toLocaleString()
              : "Unknown"
          }}
        </p>
        <div v-if="puzzle.puzzle_json">
          <GridSVG
            :size="240"
            :grid-size="puzzle.puzzle_json.size"
            :layers="[puzzle.puzzle_json.problem]"
          />
        </div>
      </div>
      <div v-if="puzzles.length === 0">No puzzles found.</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import GridSVG from "@/components/editor/GridSVG.vue";
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
  } catch {
    puzzles.value = [];
  } finally {
    loading.value = false;
  }
}

onMounted(fetchPuzzles);
</script>

<style scoped>
.catalogue {
  max-width: 800px;
  margin: 0 auto;
}
.puzzle-card {
  border: 1px solid #ccc;
  padding: 1em;
  margin-bottom: 1em;
  border-radius: 8px;
  background: #fafafa;
}
</style>
