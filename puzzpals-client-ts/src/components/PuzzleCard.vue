<template>
  <div
    class="puzzle-card"
    :class="{ 'puzzle-card--clickable': clickable }"
    @click="handleClick"
  >
    <div class="puzzle-card-left" v-if="puzzle.puzzle_json">
      <GridSVG
        :size="size"
        :grid-size="puzzle.puzzle_json.size"
        :layers="[puzzle.puzzle_json.problem]"
      />
    </div>
    <div class="puzzle-card-right">
      <div class="puzzle-card-top-row">
        <h2>{{ puzzle.puzzle_json?.title || "Untitled Puzzle" }}</h2>
        <span class="puzzle-id">#{{ puzzle.id }}</span>
      </div>

      <p><strong>Author:</strong> {{ puzzle.author }}</p>

      <p>
        <strong>Date:</strong>
        {{
          puzzle.publish_date
            ? formatDate(new Date(puzzle.publish_date))
            : "Unknown"
        }}
      </p>

      <p class="puzzle-description">
        {{ descriptionTruncated }}
      </p>

      <p v-if="showStatus">
        <strong>Status:</strong>
        {{ puzzle.published ? "Published" : "Draft" }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { PuzzleData } from "@puzzpals/puzzle-models";
import GridSVG from "@/components/editor/GridSVG.vue";
import { formatDate } from "@/util";

interface PuzzleCardData {
  id: number;
  author: string;
  description: string;
  puzzle_json: PuzzleData;
  publish_date?: string | Date;
  published?: boolean;
}

const props = withDefaults(
  defineProps<{
    puzzle: PuzzleCardData;
    showStatus?: boolean;
    clickable?: boolean;
    size?: number;
  }>(),
  {
    showStatus: false,
    clickable: false,
    size: 180,
  },
);

const descriptionTruncated = computed(() => {
  const desc = props.puzzle.description || "No description provided";
  if (desc.length > 100) {
    return desc.slice(0, 100) + "...";
  }
  return desc;
});

const emit = defineEmits<{
  click: [id: number];
}>();

function handleClick() {
  if (!props.clickable) {
    return;
  }
  emit("click", props.puzzle.id);
}
</script>

<style scoped>
.puzzle-card {
  width: 100%;
  border: 1px solid #ccc;
  padding: 1em;
  margin-bottom: 1em;
  border-radius: 8px;
  background: #fafafa;
  display: flex;
  gap: 1rem;
  align-items: flex-start;
}

.puzzle-card--clickable {
  cursor: pointer;
  transition: box-shadow 0.2s;
}

.puzzle-card--clickable:hover {
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.puzzle-card-left {
  flex: 0 0 auto;
  padding: 0.4rem;
  background: #fff;
  border: 1px solid #e4e4e4;
  border-radius: 6px;
}

.puzzle-card-right {
  flex: 1;
  min-width: 0;
}

.puzzle-card-right p {
  word-break: break-all;
}

.puzzle-card-top-row {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 0.6rem;
}

.puzzle-card-top-row h2 {
  margin: 0;
}

.puzzle-id {
  font-size: 0.85rem;
  padding: 0.2rem 0.5rem;
  border-radius: 999px;
  border: 1px solid #d0d0d0;
  background: #ffffff;
  white-space: nowrap;
}

.puzzle-description {
  margin: 0.55rem 0 0.75rem;
  white-space: pre-line;
}

@media (max-width: 500px) {
  .puzzle-card {
    flex-direction: column;
    align-items: stretch;
    min-width: 0;
  }
  .puzzle-card-left {
    align-self: flex-start;
    margin-bottom: 0.5em;
    min-width: 0;
    max-width: 100%;
  }
}

.puzzle-card-left {
  width: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
