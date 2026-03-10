<template>
  <EditorComponent
    :grid="grid"
    @edit-message="onEditMessage"
    @resize-grid="onResizeGrid"
  />

  <div style="margin-top: 2em">
    <h2>Export puzzle</h2>
    <button @click="exportPuzzle">Export current puzzle</button>
    <h2>Publish Puzzle</h2>
    <button @click="publishPuzzle">Publish current puzzle</button>
    <div v-if="uploadStatus">{{ uploadStatus }}</div>
  </div>
</template>

<script setup lang="ts">
import EditorComponent from "../components/EditorComponent.vue";

import { ref } from "vue";
import api from "@/services/api";
import {
  applyEditMessage,
  KeyToCoordinate,
  KeyToPairCoordinate,
  type EditMessage,
  type Grid,
} from "@puzzpals/puzzle-models";

const uploadStatus = ref("");
const grid = ref<Grid>({
  size: [6, 7],
  problem: {
    lineObjects: {},
    surfaceObjects: {},
    symbolObjects: {},
  },
});

function onEditMessage(message: EditMessage) {
  grid.value = {
    ...grid.value,
    problem: applyEditMessage(grid.value.problem, message),
  };
}

function onResizeGrid(size: [number, number]) {
  const [rowCount, colCount] = size;

  grid.value = {
    ...grid.value,
    size,
    problem: {
      lineObjects: Object.fromEntries(
        Object.entries(grid.value.problem.lineObjects).filter(([key]) => {
          const pair = KeyToPairCoordinate(key);
          if (pair === null) {
            return false;
          }

          const [start, end] = pair;
          return (
            start[0] < rowCount &&
            start[1] < colCount &&
            end[0] < rowCount &&
            end[1] < colCount
          );
        }),
      ),
      surfaceObjects: Object.fromEntries(
        Object.entries(grid.value.problem.surfaceObjects).filter(([key]) => {
          const coordinate = KeyToCoordinate(key);
          return (
            coordinate !== null &&
            coordinate[0] < rowCount &&
            coordinate[1] < colCount
          );
        }),
      ),
      symbolObjects: Object.fromEntries(
        Object.entries(grid.value.problem.symbolObjects).filter(([key]) => {
          const coordinate = KeyToCoordinate(key);
          return (
            coordinate !== null &&
            coordinate[0] < rowCount &&
            coordinate[1] < colCount
          );
        }),
      ),
    },
  };
}

const exportPuzzle = () => {
  downloadObjectAsJson(grid.value, "puzzpals-puzzle");
};

const downloadObjectAsJson = (exportObj: object, exportName: string) => {
  const dataStr =
    "data:text/json;charset=utf-8," +
    encodeURIComponent(JSON.stringify(exportObj));
  const downloadAnchorNode = document.createElement("a");
  downloadAnchorNode.setAttribute("href", dataStr);
  downloadAnchorNode.setAttribute("download", exportName + ".json");
  document.body.appendChild(downloadAnchorNode); // required for firefox
  downloadAnchorNode.click();
  downloadAnchorNode.remove();
};

async function publishPuzzle() {
  uploadStatus.value = "Publishing...";
  try {
    const puzzleObj = JSON.parse(JSON.stringify(grid.value));

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
