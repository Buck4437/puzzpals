<template>
  <div class="catalogue">
    <h1>My Puzzles</h1>
    <div v-if="loading">Loading puzzles...</div>
    <div v-else>
      <PuzzleCard
        v-for="puzzle in puzzles"
        :key="puzzle.id"
        :puzzle="puzzle"
        :show-status="true"
        :clickable="true"
        @click="goToDetail"
      />
      <div v-if="puzzles.length === 0">No puzzles found.</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from "vue";
import PuzzleCard from "@/components/PuzzleCard.vue";
import api from "@/services/api";
import { useRoute, useRouter } from "vue-router";
import type { PuzzleData } from "@puzzpals/puzzle-models";
const route = useRoute();
const router = useRouter();

interface Puzzle {
  id: number;
  author: string;
  puzzle_json: PuzzleData;
  publish_date?: string;
  published?: boolean;
}

const puzzles = ref<Puzzle[]>([]);
const loading = ref(true);

function goToDetail(id: number) {
  router.push(`/puzzle/${id}`);
}

async function fetchUserPuzzles() {
  loading.value = true;
  try {
    const { data } = await api.get("/puzzles/user");
    if (Array.isArray(data)) {
      puzzles.value = data;
    } else {
      puzzles.value = [];
    }
  } catch {
    puzzles.value = [];
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
</style>
