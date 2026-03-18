<template>
  <SetterEditorComponent
    :grid="grid"
    :show-rules-layer="showRulesLayerPreview"
    @edit-problem-message="onEditProblemMessage"
    @edit-solution-message="onEditSolutionMessage"
    @resize-grid="onResizeGrid"
  />

  <div style="margin-top: 2em">
    <h2>Editor options</h2>
    <h2>Export puzzle</h2>
    <button @click="exportPuzzle">Export current puzzle</button>
    <br />

    Preview rendering of enabled rules
    <input type="checkbox" v-model="showRulesLayerPreview" />

    <br />

    Pre-defined rules
    <ul>
      <li v-for="rule in customRulesInfoList" :key="rule.id">
        <input
          type="checkbox"
          :value="rule.id"
          v-model="customRulesInput[rule.id]"
          @change="copyGridRules"
        />
        <strong>{{ rule.name }}</strong
        >: {{ rule.description }}
      </li>
    </ul>

    <br />

    Answer-checking (enabling this will include the solution in the exported
    puzzle)
    <ul>
      <li v-for="type in answerCheckInfoList" :key="type.type">
        <input
          type="checkbox"
          :value="type.type"
          v-model="typesToCheckInput[type.type]"
        />
        <strong>{{ type.name }}</strong
        >: {{ type.description }}
      </li>
    </ul>
    <h2>Publish Puzzle</h2>
    <button @click="publishPuzzle">Publish current puzzle</button>
    <div v-if="uploadStatus">{{ uploadStatus }}</div>
  </div>
</template>

<script setup lang="ts">
import SetterEditorComponent from "../components/SetterEditorComponent.vue";

import { computed, ref } from "vue";
import api from "@/services/api";
import {
  applyEditMessage,
  getAnswerCheckList,
  getRulesList,
  KeyToCoordinate,
  KeyToPairCoordinate,
  type EditMessage,
  type Grid,
  type LayerData,
  type RulesType,
  type SolutionData,
  type TypeToCheck,
} from "@puzzpals/puzzle-models";

const uploadStatus = ref("");
const answerCheckInfoList = getAnswerCheckList();
const customRulesInfoList = getRulesList();

const typesToCheckInput = ref<Record<TypeToCheck, boolean>>({
  lineObjectsExact: false,
  lineObjectsGreenOnly: false,
  surfaceObjectsExact: false,
  surfaceObjectsDarkOnly: false,
  textObjectsExact: false,
  textObjectsContentOnly: false,
  shapeObjectsExcludeCrossMarks: false,
});

const customRulesInput = ref<Record<RulesType, boolean>>({
  akari: false,
});

function createEmptyLayerData(): LayerData {
  return {
    lineObjects: {},
    surfaceObjects: {},
    textObjects: {},
    shapeObjects: {},
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
    textObjects: Object.fromEntries(
      Object.entries(layerData.textObjects).filter(([key]) => {
        const coordinate = KeyToCoordinate(key);
        return (
          coordinate !== null &&
          coordinate[0] < rowCount &&
          coordinate[1] < colCount
        );
      }),
    ),
    shapeObjects: Object.fromEntries(
      Object.entries(layerData.shapeObjects).filter(([key]) => {
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
  size: [10, 10],
  problem: createEmptyLayerData(),
  solution: createEmptySolutionData(),
  options: {
    rules: [],
  },
});

const showRulesLayerPreview = ref(true);

const selectedTypesToCheck = computed<TypeToCheck[]>(() => {
  return answerCheckInfoList
    .filter((type) => typesToCheckInput.value[type.type])
    .map((type) => type.type);
});

const includeSolution = computed(() => {
  return selectedTypesToCheck.value.length > 0;
});

function copyGridRules() {
  grid.value = {
    ...grid.value,
    options: {
      ...grid.value.options,
      rules: customRulesInfoList
        .filter((rule) => customRulesInput.value[rule.id])
        .map((rule) => rule.id),
    },
  };
}

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
  } else if (puzzleObj.solution) {
    puzzleObj.solution.typeToCheck = [...selectedTypesToCheck.value];
  }

  puzzleObj.options = {
    ...puzzleObj.options,
    rules: [...grid.value.options.rules],
  };

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
    copyGridRules();

    const puzzleObj = JSON.parse(JSON.stringify(grid.value));

    if (puzzleObj.solution) {
      puzzleObj.solution.typeToCheck = [...selectedTypesToCheck.value];
    }

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
