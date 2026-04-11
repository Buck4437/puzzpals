<template>
  <div v-if="loading">Loading puzzle...</div>
  <div v-else-if="puzzle">
    <h1>{{ puzzle.puzzle_json?.title || "Untitled Puzzle" }}</h1>
    <p><strong>Author:</strong> {{ puzzle.author }}</p>
    <p style="white-space: pre-line">
      <strong>Description:</strong>
      {{ puzzle.description || "" }}
    </p>
    <p><strong>Date:</strong> {{ formattedDate }}</p>
    <div class="puzzle-preview" v-if="puzzle.puzzle_json">
      <GridSVG
        :display-size="480"
        :grid-size="puzzle.puzzle_json.size"
        :layers="[puzzle.puzzle_json.problem]"
      />
    </div>
    <div class="actions">
      <button @click="createRoom">Create Room</button>
      <button v-if="isOwner" @click="editPuzzle">Edit Puzzle</button>
    </div>
  </div>
  <div v-else>
    <p>Puzzle not found.</p>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useUserStore } from "@/stores/user";
import api from "@/services/api";
import GridSVG from "@/components/editor/GridSVG.vue";
import { formatDate } from "@/util";
import { isAxiosError } from "axios";

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();

// TODO: Move `Puzzle` interface to a common package
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const puzzle = ref<any>(null);
const loading = ref(true);

const puzzleId = computed(() => Number(route.params.id));

// TODO: Move `SessionUser` interface to a common package
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getUserId(user: any): string | undefined {
  if (!user) return undefined;
  if (typeof user === "object") {
    return user.id;
  }
  return undefined;
}

const isOwner = computed(() => {
  return (
    puzzle.value &&
    userStore.user &&
    puzzle.value.author_id === getUserId(userStore.user)
  );
});

const formattedDate = computed(() => {
  if (!puzzle.value?.publish_date) return "Unknown";
  return formatDate(new Date(puzzle.value.publish_date));
});

async function fetchPuzzle() {
  loading.value = true;
  try {
    const res = await api.get(`/puzzles/${puzzleId.value}`);
    puzzle.value = res.data;
  } catch {
    puzzle.value = null;
  } finally {
    loading.value = false;
  }
}

async function createRoom() {
  try {
    const res = await api.post(
      "/rooms/create-from-id",
      { puzzleId: puzzleId.value },
      {
        headers: { "Content-Type": "application/json" },
      },
    );
    if (res?.data?.token) {
      router.push(`/room/${res.data.token}`);
    } else {
      alert("Failed to create room.");
    }
  } catch (err) {
    if (isAxiosError(err)) {
      alert(
        `Failed to create room: ${err.response?.data?.error || err.message}`,
      );
    } else {
      alert("Failed to create room: Unknown error");
    }
  }
}

function editPuzzle() {
  router.push({ path: `/editor`, query: { id: puzzleId.value } });
}

onMounted(() => {
  fetchPuzzle();
});
</script>

<style scoped>
.puzzle-preview {
  flex: 0 0 auto;
  padding: 0.4rem;
  background: #fff;
  border: 1px solid #e4e4e4;
  border-radius: 6px;
  width: fit-content;
}

.actions {
  margin-top: 1.5em;
}
.actions button {
  margin-right: 1em;
}
</style>
