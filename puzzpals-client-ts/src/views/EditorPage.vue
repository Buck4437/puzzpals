<template>
  <SetterEditorComponent
    :grid="grid"
    @edit-problem-message="onEditProblemMessage"
    @edit-solution-message="onEditSolutionMessage"
    @resize-grid="onResizeGrid"
  />

  <div style="margin-top: 2em">
    <h2>Editor options</h2>
    <h2>Export puzzle</h2>
    <button @click="exportPuzzle">Export current puzzle</button>
    <br />
    Include solution (Enables answer-checking)
    <input type="checkbox" v-model="includeSolution" />

    <h2>Publish Puzzle</h2>
    <button @click="publishPuzzle">Publish current puzzle</button>
    <div v-if="uploadStatus">{{ uploadStatus }}</div>
  </div>
</template>

<script setup lang="ts">
import SetterEditorComponent from "../components/SetterEditorComponent.vue";

import { ref } from "vue";
import api from "@/services/api";
import {
  applyEditMessage,
  KeyToCoordinate,
  KeyToPairCoordinate,
  type EditMessage,
  type Grid,
  type LayerData,
  type SolutionData,
} from "@puzzpals/puzzle-models";

const uploadStatus = ref("");

function createEmptyLayerData(): LayerData {
  return {
    lineObjects: {},
    surfaceObjects: {},
    symbolObjects: {},
  };
}

function createEmptySolutionData(): SolutionData {
  return {
    ...createEmptyLayerData(),
    typeToCheck: [],
  };
}

function clipLayerData(
  layerData: LayerData,
  rowCount: number,
  colCount: number,
): LayerData {
  return {
    lineObjects: Object.fromEntries(
      Object.entries(layerData.lineObjects).filter(([key]) => {
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
      Object.entries(layerData.surfaceObjects).filter(([key]) => {
        const coordinate = KeyToCoordinate(key);
        return (
          coordinate !== null &&
          coordinate[0] < rowCount &&
          coordinate[1] < colCount
        );
      }),
    ),
    symbolObjects: Object.fromEntries(
      Object.entries(layerData.symbolObjects).filter(([key]) => {
        const coordinate = KeyToCoordinate(key);
        return (
          coordinate !== null &&
          coordinate[0] < rowCount &&
          coordinate[1] < colCount
        );
      }),
    ),
  };
}

const grid = ref<Grid>({
  size: [6, 7],
  problem: createEmptyLayerData(),
  solution: createEmptySolutionData(),
});

const includeSolution = ref(false);

function onEditProblemMessage(message: EditMessage) {
  grid.value = {
    ...grid.value,
    problem: applyEditMessage(grid.value.problem, message),
  };
}

function onEditSolutionMessage(message: EditMessage) {
  const currentSolution = grid.value.solution ?? createEmptySolutionData();
  grid.value = {
    ...grid.value,
    solution: {
      ...currentSolution,
      ...applyEditMessage(currentSolution, message),
      typeToCheck: currentSolution.typeToCheck,
    },
  };
}

function onResizeGrid(size: [number, number]) {
  const [rowCount, colCount] = size;

  const clippedProblem = clipLayerData(grid.value.problem, rowCount, colCount);
  const clippedSolution = grid.value.solution
    ? {
        ...grid.value.solution,
        ...clipLayerData(grid.value.solution, rowCount, colCount),
      }
    : undefined;

  grid.value = {
    ...grid.value,
    size,
    problem: clippedProblem,
    solution: clippedSolution,
  };
}

const exportPuzzle = () => {
  const puzzleObj = JSON.parse(JSON.stringify(grid.value));
  if (!includeSolution.value) {
    delete puzzleObj.solution;
  }
  downloadObjectAsJson(puzzleObj, "puzzpals-puzzle");
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
