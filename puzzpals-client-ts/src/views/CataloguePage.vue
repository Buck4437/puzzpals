<template>
  <div class="catalogue">
    <h1>Puzzle Catalogue</h1>
    <div v-if="initialLoading">Loading puzzles...</div>
    <div v-else>
      <PuzzleCard
        v-for="puzzle in puzzles"
        :key="puzzle.id"
        :puzzle="puzzle"
        :clickable="true"
        @click="goToDetail"
      />
      <div v-if="puzzles.length === 0">No puzzles found.</div>
      <div v-if="loadingMore" class="loading-more">Loading more puzzles...</div>
      <div
        ref="loadMoreSentinel"
        class="load-more-sentinel"
        aria-hidden="true"
      ></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from "vue";
import PuzzleCard from "@/components/PuzzleCard.vue";
import api from "@/services/api";
import type { PuzzleData } from "@puzzpals/puzzle-models";

interface Puzzle {
  id: number;
  author: string;
  description: string;
  puzzle_json: PuzzleData;
  publish_date: Date;
}

const puzzles = ref<Puzzle[]>([]);
const PAGE_SIZE = 10;
const offset = ref(0);
const hasMore = ref(true);
const initialLoading = ref(true);
const loadingMore = ref(false);
const loadMoreSentinel = ref<HTMLElement | null>(null);
let observer: IntersectionObserver | null = null;

async function fetchNextBatch() {
  if (loadingMore.value || !hasMore.value) {
    return;
  }

  loadingMore.value = true;
  try {
    const { data } = await api.get("/puzzles", {
      params: { limit: PAGE_SIZE, offset: offset.value },
    });
    const batch = Array.isArray(data) ? data : [];
    puzzles.value.push(...batch);
    offset.value += batch.length;
    if (batch.length < PAGE_SIZE) {
      hasMore.value = false;
    }
  } catch {
    hasMore.value = false;
  } finally {
    loadingMore.value = false;
    initialLoading.value = false;
  }
}

onMounted(async () => {
  await fetchNextBatch();
  observer = new IntersectionObserver(
    (entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        fetchNextBatch();
      }
    },
    { root: null, rootMargin: "120px", threshold: 0 },
  );
  if (loadMoreSentinel.value) {
    observer.observe(loadMoreSentinel.value);
  }
});

onBeforeUnmount(() => {
  if (observer && loadMoreSentinel.value) {
    observer.unobserve(loadMoreSentinel.value);
  }
  observer?.disconnect();
  observer = null;
});

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

.loading-more {
  margin-top: 12px;
  text-align: center;
}

.load-more-sentinel {
  height: 1px;
}
</style>
