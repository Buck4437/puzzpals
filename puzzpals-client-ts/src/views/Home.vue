<template>
  <FilePicker @file-picked="onFilePicked" />
  <button @click="uploadFile">Upload</button>
  <button @click="openEditor">Open Editor</button>
  <!-- <button @click="loadPuzzleCatalog">Load Puzzle Catalog</button> -->
  <div v-if="catalogLoading">Loading puzzles...</div>
  <div v-if="catalogError" style="color: red">{{ catalogError }}</div>
  <div v-if="puzzleCatalog.length > 0" class="catalog-section">
    <h3>Available Puzzles:</h3>
    <div class="puzzle-grid">
      <div v-for="puzzle in puzzleCatalog" :key="puzzle.pId" class="puzzle-box">
        <h4>{{ puzzle.title }}</h4>
        <p class="puzzle-date">
          Created: {{ new Date(puzzle.createdAt).toLocaleDateString() }}
        </p>
        <p class="puzzle-id">ID: {{ puzzle.pId.substring(0, 8) }}...</p>
        <button
          @click="createRoomFromPuzzle(puzzle.pId)"
          class="create-room-btn"
        >
          Create Room
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from "vue";
import FilePicker from "@/components/FilePicker.vue";
import api from "@/services/api";
import { useRouter } from "vue-router";

const router = useRouter();
const catalogLoading = ref(false);
const catalogError = ref("");
const puzzleCatalog = ref<any[]>([]);

let pickedFile: File | null = null;

function readFile(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
}

async function uploadFile() {
  if (pickedFile === null) {
    alert("Please select a file to upload.");
    return;
  }

  let fileContent;
  try {
    fileContent = await readFile(pickedFile);
  } catch (error) {
    alert("Failed to read the file.");
    return;
  }

  let puzzleData;
  try {
    puzzleData = JSON.parse(fileContent);
  } catch (error) {
    alert("Failed to parse the file. Please ensure it is a valid JSON file.");
    return;
  }

  // Send the data to the server
  const res = await api
    .post("/rooms/create", puzzleData, {
      headers: {
        "Content-Type": "application/json",
      },
    })
    .catch((err) => {
      alert(`Upload failed: ${err.response?.data?.error || err.message}`);
    });

  if (res !== undefined && res.data && res.data.token) {
    router.push(`/room/${res.data.token}`);
  }
}

function openEditor() {
  router.push("/editor");
}
// Normally called by FilePicker
// During tests, call this directly
function onFilePicked(file: File | null) {
  pickedFile = file;
}

async function loadPuzzleCatalog() {
  catalogLoading.value = true;
  catalogError.value = "";
  puzzleCatalog.value = [];

  try {
    const response = await api.get("/puzzles/ctlgSearch", {
      params: {
        sortBy: "createdAt",
        sortDir: 1,
        title: "",
        rowRange: 20,
      },
    });

    if (response.data && response.data.results) {
      puzzleCatalog.value = response.data.results;
    } else {
      catalogError.value = "No puzzles found";
    }
  } catch (error) {
    catalogError.value =
      error instanceof Error ? error.message : "Failed to load puzzle catalog";
    console.error("Error loading puzzle catalog:", error);
  } finally {
    catalogLoading.value = false;
  }
}

async function createRoomFromPuzzle(pId: string) {
  try {
    const roomRes = await api.get("/rooms/createFromPuzzle", {
      params: { pId: pId },
    });

    if (roomRes.data && roomRes.data.token) {
      router.push(`/room/${roomRes.data.token}`);
    }
  } catch (error) {
    alert(
      `Failed to create room: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
    console.error("Error creating room from puzzle:", error);
  }
}

const handlePopstate = () => {
  loadPuzzleCatalog();
};

onMounted(() => {
  loadPuzzleCatalog();
  window.addEventListener("popstate", handlePopstate);
});

onBeforeUnmount(() => {
  window.removeEventListener("popstate", handlePopstate);
});

defineExpose({ onFilePicked });
</script>
