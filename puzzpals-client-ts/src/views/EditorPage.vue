<template>
  <EditorComponent ref="editor" />

  <div style="margin-top: 2em">
    <h2>Publish Puzzle</h2>
    <button @click="publishPuzzle">Publish current puzzle</button>
    <div v-if="uploadStatus">{{ uploadStatus }}</div>
  </div>
</template>

<script setup lang="ts">
import EditorComponent from "../components/EditorComponent.vue";

import { ref } from "vue";
import api from "@/services/api";
import type { Grid } from "@/models/Grid";

type EditorComponentExposed = {
  grid: Grid;
};

const editor = ref<EditorComponentExposed | null>(null);
const uploadStatus = ref("");

async function publishPuzzle() {
  uploadStatus.value = "Publishing...";
  try {
    if (!editor.value) {
      throw new Error("Editor is not ready yet.");
    }

    const puzzleObj = JSON.parse(JSON.stringify(editor.value.grid));

    console.log(puzzleObj);

    await api.post("/puzzles", {
      author: "synthetic",
      description: "Published from editor",
      puzzle_json: puzzleObj,
      publish_date: new Date().toISOString(),
    });
    uploadStatus.value = "Publish successful!";
  } catch (e: any) {
    uploadStatus.value =
      "Publish failed: " +
      (e?.response?.data?.details || e?.message || "Unknown error");
  }
}
</script>
