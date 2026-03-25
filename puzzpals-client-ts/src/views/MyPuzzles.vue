<template>
  <div class="catalogue">
    <h1>My Puzzles</h1>
    <div v-if="loading">Loading puzzles...</div>
    <div v-else>
      <div v-for="puzzle in puzzles" :key="puzzle.id" class="puzzle-card">
        <h2>{{ puzzle.description || "Untitled Puzzle" }}</h2>
        <p>
          <strong>Status:</strong>
          {{ puzzle.published ? "Published" : "Draft" }}
        </p>
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
import { ref, onMounted, watch } from "vue";
import GridSVG from "@/components/editor/GridSVG.vue";
import api from "@/services/api";
import { useRoute } from "vue-router";
const route = useRoute();

interface Puzzle {
  id: number;
  author: string;
  description: string;
  puzzle_json: any;
  publish_date?: string;
  published?: boolean;
}

const puzzles = ref<Puzzle[]>([]);
const loading = ref(true);

async function fetchUserPuzzles() {
  loading.value = true;
  try {
    const { data } = await api.get("/puzzles/user");
    if (Array.isArray(data)) {
      puzzles.value = data;
    } else {
      puzzles.value = [];
    }
  } catch (e: any) {
    // If 401, clear puzzles and optionally redirect
    if (e?.response?.status === 401) {
      puzzles.value = [];
      // Optionally redirect to login
      // window.location.href = '/login';
    } else {
      puzzles.value = [];
    }
  } finally {
    loading.value = false;
  }
}

onMounted(fetchUserPuzzles);

watch(
  () => route.fullPath,
  () => {
    fetchUserPuzzles();
  },
);
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
