<template>
  <div class="editor-page">
    <section class="editor-canvas">
      <SetterEditorComponent
        :grid="grid"
        :show-rules-layer="showRulesLayerPreview"
        @edit-problem-message="onEditProblemMessage"
        @edit-solution-message="onEditSolutionMessage"
      />
    </section>

    <aside class="editor-sidebar">
      <h2 class="sidebar-title">Editor Controls</h2>

      <div class="action-con">
        <button @click="exportPuzzle">Export puzzle</button>
        <button :disabled="isPublishing" @click="publishPuzzle">
          {{ isPublishing ? "Publishing..." : "Publish puzzle" }}
        </button>
      </div>

      <section class="panel" aria-labelledby="dimension-heading">
        <h3 id="dimension-heading" class="panel-title">Grid dimensions</h3>
        <p class="helper-text compact">
          Current: {{ grid.size[0] }} rows x {{ grid.size[1] }} cols
        </p>
        <div class="dimension-row">
          <label for="editor-row-input">Rows</label>
          <input
            id="editor-row-input"
            type="number"
            v-model.number="inputRowCount"
            min="1"
            max="100"
          />
        </div>
        <div class="dimension-row">
          <label for="editor-col-input">Cols</label>
          <input
            id="editor-col-input"
            type="number"
            v-model.number="inputColCount"
            min="1"
            max="100"
          />
        </div>
        <button class="secondary-button" @click="setDimensions">
          Apply size
        </button>
      </section>

      <section class="panel action-panel">
        <div>
          <h3 class="panel-title">Pre-defined rules</h3>
          <p class="helper-text compact">{{ enabledRulesCount }} enabled</p>
        </div>
        <button class="secondary-button" @click="showRulesModal = true">
          Configure
        </button>
      </section>

      <section class="panel action-panel">
        <div>
          <h3 class="panel-title">Answer checking</h3>
          <p class="helper-text compact">
            {{ selectedTypesToCheck.length }} selected
          </p>
        </div>
        <button class="secondary-button" @click="showAnswerCheckModal = true">
          Configure
        </button>
      </section>

      <details class="panel bottom-panel">
        <summary>View options</summary>
        <label class="checkbox-row">
          <input type="checkbox" v-model="showRulesLayerPreview" />
          Preview rendering of enabled rules
        </label>
      </details>
    </aside>
  </div>

  <BaseModal v-if="showPublishModal" @close="showPublishModal = false">
    <h3>Publish status</h3>
    <p>{{ uploadStatus }}</p>
  </BaseModal>

  <BaseModal v-if="showRulesModal" @close="showRulesModal = false">
    <h3>Pre-defined rules</h3>
    <p class="helper-text no-top-margin">
      These rules add additional visual display to the puzzle according to the
      constraints.
    </p>
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
  </BaseModal>

  <BaseModal v-if="showAnswerCheckModal" @close="showAnswerCheckModal = false">
    <h3>Answer checking</h3>
    <p class="helper-text no-top-margin">
      Enabling checks includes solution data in exports and publishing.
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
  </BaseModal>
</template>

<script setup lang="ts">
import SetterEditorComponent from "../components/SetterEditorComponent.vue";
import BaseModal from "@/components/BaseModal.vue";

import { computed, ref, watch, type Ref } from "vue";
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
const showRulesModal = ref(false);
const showAnswerCheckModal = ref(false);
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
const inputRowCount: Ref<string | number> = ref(grid.value.size[0]);
const inputColCount: Ref<string | number> = ref(grid.value.size[1]);

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

function setDimensions() {
  const rows = Number(inputRowCount.value);
  const cols = Number(inputColCount.value);

  if (
    !Number.isFinite(rows) ||
    !Number.isFinite(cols) ||
    !Number.isInteger(rows) ||
    !Number.isInteger(cols) ||
    rows < 1 ||
    cols < 1 ||
    rows > 100 ||
    cols > 100
  ) {
    alert("Please enter valid positive integers for dimensions (1-100).");
    return;
  }

  onResizeGrid([rows, cols]);
}

watch(
  () => grid.value.size,
  ([rows, cols]) => {
    inputRowCount.value = rows;
    inputColCount.value = cols;
  },
  { immediate: true },
);

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
    uploadStatus.value = "Publish failed. Please try again later.";
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
  box-sizing: border-box;
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

.action-con {
  display: grid;
  grid-template-columns: 1fr;
  gap: 8px;
}

.panel {
  border: 1px solid #e4e6ef;
  border-radius: 8px;
  padding: 10px;
  background: #fbfcff;
}

.panel-title {
  margin: 0;
  font-size: 0.98rem;
}

.action-panel {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.secondary-button {
  border: 1px solid #d5daef;
  background: #f2f5ff;
  border-radius: 8px;
  padding: 6px 10px;
  cursor: pointer;
}

.dimension-row {
  display: grid;
  grid-template-columns: 48px 1fr;
  align-items: center;
  gap: 8px;
  margin: 8px 0;
}

.dimension-row input {
  width: 100%;
  box-sizing: border-box;
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

.helper-text.no-top-margin {
  margin-top: 0;
}

.helper-text.compact {
  margin-top: 4px;
  margin-bottom: 0;
}

.count {
  font-weight: 500;
  color: #5f5f5f;
}

.bottom-panel {
  margin-top: auto;
}

h3 {
  margin-top: 0;
  margin-bottom: 12px;
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
