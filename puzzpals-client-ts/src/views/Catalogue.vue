<template>
  <div class="catalogue">
    <h1>Puzzle Catalogue</h1>
    <form class="search-bar" @submit.prevent="onSearch">
      <!-- <div class="search-bar-title">Search Filters</div> -->
      <div class="search-bar-fields-row">
        <label class="search-label"
          >Title
          <input
            v-model="search.title"
            placeholder="Title"
            class="search-input"
          />
        </label>
        <label class="search-label"
          >Author
          <input
            v-model="search.author"
            placeholder="Author"
            class="search-input"
          />
        </label>
        <label class="search-label search-label-description"
          >Puzzle Description
          <input
            v-model="search.description"
            placeholder="Description"
            class="search-input search-input-description"
          />
        </label>
      </div>
      <div class="search-bar-row search-bar-dates-actions">
        <div class="date-range-inline">
          <label class="date-label-inline"
            >From
            <input
              type="date"
              v-model="search.date_start"
              :max="maxDate"
              :min="minDate"
              required
            />
          </label>
          <label class="date-label-inline"
            >To
            <input
              type="date"
              v-model="search.date_end"
              :max="maxDate"
              :min="minDate"
              required
            />
          </label>
        </div>
        <div class="search-bar-actions">
          <button type="submit">Search</button>
          <button type="button" @click="onClear">Clear</button>
        </div>
      </div>
    </form>
    <div class="sort-bar compact-sort-bar">
      <label class="sort-label"
        >Sort
        <select v-model="sort.combined" @change="onSortDropdownChange">
          <option value="publish_date-desc">Latest Puzzle</option>
          <option value="publish_date-asc">Oldest Puzzle</option>
          <option value="title-asc">Title A to Z</option>
          <option value="title-desc">Title Z to A</option>
          <option value="author-asc">Author A to Z</option>
          <option value="author-desc">Author Z to A</option>
        </select>
      </label>
    </div>
    <div v-if="initialLoading">Loading puzzles...</div>
    <div v-else>
      <div class="puzzle-grid">
        <PuzzleCard
          v-for="puzzle in puzzles"
          :key="puzzle.id"
          :puzzle="puzzle"
          :clickable="true"
          @click="goToDetail"
        />
      </div>
      <div v-if="puzzles.length === 0">No puzzles found.</div>
      <div v-if="loadingMore" class="loading-more">Loading more puzzles...</div>
      <div
        ref="loadMoreSentinel"
        class="load-more-sentinel"
        aria-hidden="true"
      ></div>
    </div>
    <AlertNotification ref="alertRef" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from "vue";
import PuzzleCard from "@/components/PuzzleCard.vue";
import {
  getSearchParams,
  fetchPuzzles,
  validateSearchParams,
  type SearchParams,
  type Puzzle,
  PUZZLE_PAGE_SIZE,
} from "@/services/PuzzleSearchService";
import AlertNotification from "@/components/AlertNotification.vue";

const sort = ref({
  field: "publish_date",
  dir: "desc",
  combined: "publish_date-desc",
});
function onSortDropdownChange() {
  const [field, dir] = sort.value.combined.split("-");
  sort.value.field = field ?? "publish_date";
  sort.value.dir = dir ?? "desc";
  offset.value = 0;
  puzzles.value = [];
  hasMore.value = true;
  initialLoading.value = true;
  fetchNextBatch();
}

const puzzles = ref<Puzzle[]>([]);
const offset = ref(0);
const hasMore = ref(true);
const initialLoading = ref(true);
const loadingMore = ref(false);
const loadMoreSentinel = ref<HTMLElement | null>(null);
let observer: IntersectionObserver | null = null;
const alertRef = ref<InstanceType<typeof AlertNotification> | null>(null);

function formatDateInput(date: Date): string {
  return date.toISOString().slice(0, 10);
}

const today = new Date();
const oneMonthAgo = new Date();
oneMonthAgo.setMonth(today.getMonth() - 1);

const maxDate = formatDateInput(today);
const minDate = "2000-01-01";

const search = ref({
  title: "",
  description: "",
  author: "",
  date_start: formatDateInput(oneMonthAgo),
  date_end: formatDateInput(today),
});

function getSearchParamsWrapper(): SearchParams {
  return getSearchParams(search.value, sort.value, offset.value);
}

async function fetchNextBatch() {
  if (loadingMore.value || !hasMore.value) {
    return;
  }
  loadingMore.value = true;
  try {
    const batch = await fetchPuzzles(getSearchParamsWrapper());
    puzzles.value.push(...batch);
    offset.value += batch.length;
    if (batch.length < PUZZLE_PAGE_SIZE) {
      hasMore.value = false;
    }
  } catch (e) {
    hasMore.value = false;
  } finally {
    loadingMore.value = false;
    initialLoading.value = false;
  }
}

function onSearch() {
  const validationError = validateSearchParams(search.value, maxDate);
  if (validationError) {
    alertRef.value?.showAlert("error", validationError);
    return;
  }
  offset.value = 0;
  puzzles.value = [];
  hasMore.value = true;
  initialLoading.value = true;
  fetchNextBatch();
}

function onClear() {
  search.value = {
    title: "",
    description: "",
    author: "",
    date_start: formatDateInput(oneMonthAgo),
    date_end: formatDateInput(today),
  };
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
  width: 100%;
  max-width: none;
  margin: 0;
  padding: 0 2vw;
  box-sizing: border-box;
}

.loading-more {
  margin-top: 12px;
  text-align: center;
}

.load-more-sentinel {
  height: 1px;
}

.search-bar {
  background: #f5f5f7;
  border-radius: 2em;
  padding: 1em 1.5em 0.5em 1.5em;
  margin-bottom: 1.5em;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  display: flex;
  flex-direction: column;
  gap: 0.5em;
}
.search-bar-title {
  font-weight: bold;
  font-size: 1.1em;
  margin-bottom: 0.2em;
  margin-left: 0.1em;
}
.search-bar-fields-row {
  display: flex;
  flex-direction: row;
  gap: 0.7em;
  margin-bottom: 0.15em;
  flex-wrap: wrap;
}
.search-label {
  display: flex;
  flex-direction: column;
  font-weight: 500;
  margin-bottom: 0.1em;
  flex: 1 1 180px;
  min-width: 140px;
  box-sizing: border-box;
}
.search-label-description {
  flex: 2 1 320px;
  min-width: 220px;
  box-sizing: border-box;
}
.search-input {
  width: 100%;
  max-width: 100%;
  margin-top: 0.2em;
  padding: 0.4em 0.7em;
  border-radius: 0.5em;
  border: 1px solid #ccc;
  font-size: 1em;
  text-align: left;
  box-sizing: border-box;
}
.search-input-description {
  min-width: 220px;
  width: 100%;
  flex: 2;
  text-align: left;
}
.search-bar-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.7em;
  align-items: center;
}
.search-bar-dates-actions {
  margin-top: 0.2em;
  gap: 1.5em;
  align-items: center;
}
.date-range-inline {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 1em;
}
.date-label-inline {
  display: flex;
  flex-direction: row;
  align-items: center;
  font-weight: 500;
  gap: 0.3em;
  min-width: 120px;
}
.sort-bar {
  display: flex;
  align-items: center;
  gap: 1em;
  margin-bottom: 0.5em;
  margin-left: 0.2em;
}
.compact-sort-bar {
  font-size: 0.97em;
  padding: 0.1em 0.2em;
  background: none;
  box-shadow: none;
  margin-bottom: 0.5em;
}
.sort-label {
  display: flex;
  align-items: center;
  gap: 0.3em;
}
.sort-bar select {
  margin-left: 0.3em;
  padding: 0.2em 0.5em;
  border-radius: 0.5em;
  border: 1px solid #ccc;
  font-size: 1em;
}

.puzzle-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.2em;
  margin-bottom: 1em;
  width: 100%;
  align-items: stretch;
}
.puzzle-grid > * {
  min-width: 260px;
  max-width: 100%;
  box-sizing: border-box;
  /* Do not override display, let .puzzle-card use flex */
}
/* Prevent last row from stretching cards */
.puzzle-grid {
  justify-items: stretch;
}
@media (max-width: 900px) {
  .puzzle-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
@media (max-width: 600px) {
  .puzzle-grid {
    grid-template-columns: 1fr;
  }
  .puzzle-grid > * {
    min-width: 0;
  }
}
.search-bar-actions {
  display: flex;
  gap: 0.7em;
  align-items: flex-end;
  margin-left: auto;
}
.search-bar input[type="date"] {
  border-radius: 0.5em;
  border: 1px solid #ccc;
  padding: 0.2em 0.6em;
}
</style>
