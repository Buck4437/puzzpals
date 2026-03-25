<template>
  <div class="editor-page">
    <section class="editor-canvas">
      <SetterEditorComponent
        :grid="grid"
        :show-rules-layer="showRulesLayerPreview"
        @edit-problem-message="onEditProblemMessage"
        @edit-solution-message="onEditSolutionMessage"
        @resize-grid="onResizeGrid"
      />
    </section>

    <aside class="editor-sidebar">
      <h2 class="sidebar-title">Editor Controls</h2>

      <div class="action-row">
        <button @click="exportPuzzle">Export puzzle</button>
        <button :disabled="isPublishing" @click="publishPuzzle">
          {{ isPublishing ? "Publishing..." : "Publish puzzle" }}
        </button>
      </div>

      <details class="panel" open>
        <summary>View options</summary>
        <label class="checkbox-row">
          <input type="checkbox" v-model="showRulesLayerPreview" />
          Preview rendering of enabled rules
        </label>
      </details>

      <details class="panel">
        <summary>
          Pre-defined rules
          <span class="count">({{ enabledRulesCount }})</span>
        </summary>
        <ul class="settings-list">
          <li v-for="rule in customRulesInfoList" :key="rule.id">
            <label class="checkbox-row">
              <input
                type="checkbox"
                :value="rule.id"
                v-model="customRulesInput[rule.id]"
                @change="updateGridRules"
              />
              <span
                ><strong>{{ rule.name }}</strong
                >: {{ rule.description }}</span
              >
            </label>
          </li>
        </ul>
      </details>

      <details class="panel">
        <summary>
          Answer checking
          <span class="count">({{ selectedTypesToCheck.length }})</span>
        </summary>
        <p class="helper-text">
          Enabling this includes the solution in the exported puzzle.
        </p>
        <ul class="settings-list">
          <li v-for="type in answerCheckInfoList" :key="type.type">
            <label class="checkbox-row">
              <input
                type="checkbox"
                :value="type.type"
                v-model="typesToCheckInput[type.type]"
              />
              <span
                ><strong>{{ type.name }}</strong
                >: {{ type.description }}</span
              >
            </label>
          </li>
        </ul>
      </details>
    </aside>
  </div>

  <BaseModal v-if="showPublishModal" @close="showPublishModal = false">
    <h3>Publish status</h3>
    <p>{{ uploadStatus }}</p>
  </BaseModal>
</template>

<script setup lang="ts">
import SetterEditorComponent from "../components/SetterEditorComponent.vue";
import BaseModal from "@/components/BaseModal.vue";

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
const showPublishModal = ref(false);
const isPublishing = ref(false);
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

const enabledRulesCount = computed(() => {
  return customRulesInfoList.filter((rule) => customRulesInput.value[rule.id])
    .length;
});

function updateGridRules() {
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

const getPuzzleJSON = () => {
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

  return puzzleObj;
};

const exportPuzzle = () => {
  updateGridRules();
  const puzzleObj = getPuzzleJSON();
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
  isPublishing.value = true;
  uploadStatus.value = "Publishing...";
  showPublishModal.value = true;

  try {
    const puzzleObj = getPuzzleJSON();

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
  } finally {
    isPublishing.value = false;
  }
}
</script>

<style scoped>
.editor-page {
  height: 100dvh;
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(280px, 340px);
  gap: 12px;
  padding: 12px;
  box-sizing: border-box;
  background: #f7f8fb;
  overflow: hidden;
}

.editor-canvas {
  min-width: 0;
  min-height: 0;
  border: 1px solid #e7e7e7;
  border-radius: 8px;
  background: #fff;
  padding: 10px;
  box-sizing: border-box;
  overflow: auto;
}

.editor-sidebar {
  min-width: 0;
  min-height: 0;
  border: 1px solid #e7e7e7;
  border-radius: 8px;
  background: #fff;
  padding: 12px;
  box-sizing: border-box;
  overflow: auto;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.sidebar-title {
  margin: 0;
  font-size: 1.15rem;
}

.action-row {
  display: grid;
  grid-template-columns: 1fr;
  gap: 8px;
}

.panel {
  border: 1px solid #ebebeb;
  border-radius: 8px;
  padding: 8px 10px;
  background: #fafafa;
}

.panel summary {
  cursor: pointer;
  font-weight: 600;
}

.settings-list {
  margin: 8px 0 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.checkbox-row {
  display: flex;
  align-items: flex-start;
  gap: 8px;
}

.helper-text {
  margin: 8px 0 0;
  color: #555;
}

.count {
  font-weight: 500;
  color: #5f5f5f;
}

@media (max-width: 980px) {
  .editor-page {
    grid-template-columns: 1fr;
    height: auto;
    min-height: 100dvh;
    overflow: auto;
  }

  .editor-canvas {
    min-height: 60dvh;
  }
}
</style>
