<template>
  <div class="editor-page" :class="{ 'controls-collapsed': controlsCollapsed }">
    <!-- Alert/Toast Notification -->
    <AlertNotification ref="alertRef" />

    <section class="editor-canvas">
      <SetterEditorComponent
        :grid="grid"
        :show-rules-layer="showRulesLayerPreview"
        @edit-problem-message="onEditProblemMessage"
        @edit-solution-message="onEditSolutionMessage"
      />

      <button
        class="floating-controls-handle"
        :class="{ collapsed: controlsCollapsed }"
        type="button"
        @click="controlsCollapsed = !controlsCollapsed"
      >
        {{ !controlsCollapsed ? "▶" : "◀" }}
      </button>

      <button
        class="floating-controls-handle-bottom"
        v-show="controlsCollapsed"
        :class="{ collapsed: controlsCollapsed }"
        type="button"
        @click="controlsCollapsed = !controlsCollapsed"
      >
        Show editor controls
      </button>
    </section>

    <aside class="editor-sidebar" :class="{ collapsed: controlsCollapsed }">
      <h2 class="sidebar-title">Editor Controls</h2>
      <p class="editor-mode-indicator">{{ editorModeLabel }}</p>

      <div class="action-con">
        <button @click="showCreateNewPuzzleModal = true">
          Create New Puzzle
        </button>
        <button @click="importPuzzle">Import Puzzle</button>
        <button @click="showPublishModal = true">
          Export / {{ publishActionLabel }} Puzzle
        </button>
      </div>
      <input
        ref="importInputRef"
        type="file"
        class="hidden-import-input"
        accept=".json"
        @change="onImportInputChange"
      />

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

      <details class="panel">
        <summary>View options</summary>
        <label class="checkbox-row">
          <input type="checkbox" v-model="showRulesLayerPreview" />
          Preview rendering of enabled rules
        </label>
      </details>
    </aside>
  </div>

  <PublishPuzzleModal
    :isOpen="showPublishModal"
    :title="puzzleTitle"
    :instructions="puzzleInstructions"
    :description="puzzleDescription"
    :author="authorName"
    :published="publishToggle"
    :isPublishing="isPublishing"
    :isUpdateMode="isExistingPuzzle"
    :statusText="uploadStatus"
    :isLoggedIn="!!userStore.user"
    @close="showPublishModal = false"
    @publish="publishPuzzle"
    @export-puzzle="exportPuzzle"
    @update-title="puzzleTitle = $event"
    @update-instructions="puzzleInstructions = $event"
    @update-description="puzzleDescription = $event"
    @update-author="authorName = $event"
    @update-published="publishToggle = $event"
  />

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
      Enables automatic answer checking for the selected types of objects.
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

  <BaseModal
    v-if="showCreateNewPuzzleModal"
    @close="showCreateNewPuzzleModal = false"
    :hide-close-button="true"
  >
    <div class="new-puzzle-model-con">
      <p class="helper-text">
        Are you sure you want to create a new puzzle? Any unsaved progress on
        the current puzzle will be lost.
      </p>
      <div class="confirm-actions">
        <button type="button" @click="createNewPuzzle">
          Create New Puzzle
        </button>
        <button type="button" @click="showCreateNewPuzzleModal = false">
          Cancel
        </button>
      </div>
    </div>
  </BaseModal>
</template>

<script setup lang="ts">
import SetterEditorComponent from "../components/SetterEditorComponent.vue";
import BaseModal from "../components/BaseModal.vue";
import AlertNotification from "../components/AlertNotification.vue";
import PublishPuzzleModal from "../components/PublishPuzzleModal.vue";

import {
  computed,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
  type Ref,
} from "vue";
import api from "@/services/api";
import { useRoute, useRouter } from "vue-router";
import { useUserStore } from "@/stores/user";
import {
  applyEditMessage,
  PUZZLE_AUTHOR_MAX_LENGTH,
  PUZZLE_DESCRIPTION_MAX_LENGTH,
  getAnswerCheckList,
  getRulesList,
  KeyToCoordinate,
  KeyToPairCoordinate,
  PUZZLE_INSTRUCTIONS_MAX_LENGTH,
  PUZZLE_TITLE_MAX_LENGTH,
  type EditMessage,
  type LayerData,
  type PuzzleData,
  type RulesType,
  type SolutionData,
  type TypeToCheck,
} from "@puzzpals/puzzle-models";
import { parsePuzzle } from "@puzzpals/puzzle-parser";
import { isAxiosError } from "axios";

// Author, title, instructions, description, and publish toggle for editor controls
const authorName = ref("");
const puzzleTitle = ref("");
const puzzleInstructions = ref("");
const puzzleDescription = ref("");
const publishToggle = ref(false);

const uploadStatus = ref("");
const puzzleId = ref<number | null>(null);
const route = useRoute();
const router = useRouter();
const showPublishModal = ref(false);
const showRulesModal = ref(false);
const showAnswerCheckModal = ref(false);
const showCreateNewPuzzleModal = ref(false);
const controlsCollapsed = ref(false);
const isPublishing = ref(false);
const answerCheckInfoList = getAnswerCheckList();
const customRulesInfoList = getRulesList();
const userStore = useUserStore();
const importInputRef = ref<HTMLInputElement | null>(null);

const LOCAL_STORAGE_DRAFT_KEY = "puzzpals.editorDraft.v1";
const DRAFT_SAVE_DELAY_MS = 300;

interface EditorDraft {
  puzzleId: number | null;
  puzzleData: PuzzleData;
  puzzleDescription: string;
  puzzleInstructions: string;
  authorName: string;
  publishToggle: boolean;
}

const isExistingPuzzle = computed(() => puzzleId.value !== null);
const publishActionLabel = computed(() =>
  isExistingPuzzle.value ? "Update" : "Publish",
);
const editorModeLabel = computed(() =>
  puzzleId.value === null
    ? "Editing: New puzzle"
    : `Editing: Puzzle #${puzzleId.value}`,
);

let saveDraftTimeout: number | undefined;

// Alert/Toast notification component ref
const alertRef = ref<InstanceType<typeof AlertNotification> | null>(null);

function importPuzzle() {
  importInputRef.value?.click();
}

async function onImportInputChange(event: Event) {
  const target = event.target;
  if (!(target instanceof HTMLInputElement)) {
    return;
  }

  const file = target.files?.[0] ?? null;
  target.value = "";
  if (file === null) {
    return;
  }

  try {
    const fileContent = await file.text();
    const puzzleJson = JSON.parse(fileContent) as unknown;
    const parsedPuzzle = parsePuzzle(puzzleJson) as PuzzleData;

    grid.value = parsedPuzzle;
    puzzleTitle.value = parsedPuzzle.title.slice(0, PUZZLE_TITLE_MAX_LENGTH);
    puzzleInstructions.value = parsedPuzzle.instructions.slice(
      0,
      PUZZLE_INSTRUCTIONS_MAX_LENGTH,
    );
    puzzleDescription.value = "";

    customRulesInfoList.forEach((rule) => {
      customRulesInput.value[rule.id] = parsedPuzzle.options.rules.includes(
        rule.id,
      );
    });

    answerCheckInfoList.forEach((type) => {
      typesToCheckInput.value[type.type] =
        parsedPuzzle.solution?.typeToCheck.includes(type.type) ?? false;
    });

    puzzleId.value = null;
    publishToggle.value = false;

    alertRef.value?.showAlert("success", "Puzzle JSON imported successfully.");
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to import puzzle JSON.";
    alertRef.value?.showAlert("error", message);
  }
}

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

function createEmptyPuzzleData(): PuzzleData {
  return {
    title: "Untitled Puzzle",
    instructions: "",
    size: [10, 10],
    problem: createEmptyLayerData(),
    solution: createEmptySolutionData(),
    options: {
      rules: [],
    },
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

const grid = ref<PuzzleData>(createEmptyPuzzleData());

function syncCheckboxInputsFromGridData() {
  customRulesInfoList.forEach((rule) => {
    customRulesInput.value[rule.id] = grid.value.options.rules.includes(
      rule.id,
    );
  });

  answerCheckInfoList.forEach((type) => {
    typesToCheckInput.value[type.type] =
      grid.value.solution?.typeToCheck.includes(type.type) ?? false;
  });
}

function restoreDraft(
  targetPuzzleId: number | null,
  forceLoad = false,
): boolean {
  // Target puzzle id: The puzzle id that the draft should match to restore
  // forceLoad: Force restore the draft, used for new puzzle
  const draftJson = localStorage.getItem(LOCAL_STORAGE_DRAFT_KEY);
  if (!draftJson) {
    return false;
  }

  try {
    const draft = JSON.parse(draftJson) as Partial<EditorDraft>;
    if (draft.puzzleData === undefined || draft.puzzleId === undefined) {
      return false;
    }

    if (!forceLoad && draft.puzzleId !== targetPuzzleId) {
      return false;
    }

    const parsedPuzzle = parsePuzzle(draft.puzzleData);
    grid.value = parsedPuzzle;
    puzzleId.value = draft.puzzleId;
    puzzleTitle.value = parsedPuzzle.title ?? "";
    puzzleInstructions.value = parsedPuzzle.instructions ?? "";
    puzzleDescription.value = draft.puzzleDescription ?? "";
    authorName.value = draft.authorName ?? "";
    publishToggle.value = draft.publishToggle ?? false;
    syncCheckboxInputsFromGridData();
    return true;
  } catch {
    return false;
  }
}

function saveDraft(targetPuzzleId: number | null) {
  const draft: EditorDraft = {
    puzzleId: targetPuzzleId,
    puzzleData: getPuzzleJSON(),
    puzzleDescription: puzzleDescription.value,
    puzzleInstructions: puzzleInstructions.value,
    authorName: authorName.value,
    publishToggle: publishToggle.value,
  };

  try {
    localStorage.setItem(LOCAL_STORAGE_DRAFT_KEY, JSON.stringify(draft));
  } catch {
    // Ignore local storage quota/storage errors
  }
}

function scheduleDraftSave() {
  if (saveDraftTimeout !== undefined) {
    clearTimeout(saveDraftTimeout);
  }

  saveDraftTimeout = window.setTimeout(() => {
    saveDraft(puzzleId.value);
  }, DRAFT_SAVE_DELAY_MS);
}

function clearDraft() {
  localStorage.removeItem(LOCAL_STORAGE_DRAFT_KEY);
}

async function fetchUploadedPuzzle() {
  const idParam = route.query.id;
  if (idParam && typeof idParam === "string" && /^[0-9]+$/.test(idParam)) {
    try {
      const res = await api.get(`/puzzles/${idParam}/edit`);
      if (res.data && res.data.puzzle_json) {
        const puzzleData = res.data.puzzle_json as PuzzleData;
        grid.value = puzzleData;

        puzzleId.value = Number(idParam);
        puzzleTitle.value = puzzleData.title || "";
        puzzleInstructions.value = puzzleData.instructions || "";
        puzzleDescription.value = (res.data.description as string) || "";
        authorName.value = res.data.author || "";
        publishToggle.value = res.data.published || false;
        syncCheckboxInputsFromGridData();

        // If draft exist, restore the draft
        if (restoreDraft(puzzleId.value)) {
          alertRef.value?.showAlert(
            "success",
            `Local draft restored for puzzle #${puzzleId.value}`,
          );
        } else {
          alertRef.value?.showAlert(
            "success",
            `Editing puzzle #${puzzleId.value}`,
          );
        }
      }
    } catch {
      const targetPuzzleId = Number(idParam);
      if (restoreDraft(targetPuzzleId)) {
        puzzleId.value = targetPuzzleId;
        alertRef.value?.showAlert(
          "success",
          `Local draft restored for puzzle #${targetPuzzleId}`,
        );
      } else {
        uploadStatus.value = "Failed to load puzzle for editing";
      }
    }

    return;
  }

  puzzleId.value = null;
  if (restoreDraft(null, true)) {
    if (puzzleId.value === null) {
      alertRef.value?.showAlert("success", "Local draft restored");
    } else {
      alertRef.value?.showAlert(
        "success",
        `Local draft restored for puzzle #${puzzleId.value}`,
      );
    }
  }
}

function resetEditorToNewPuzzle() {
  grid.value = createEmptyPuzzleData();
  puzzleId.value = null;
  puzzleTitle.value = "";
  puzzleDescription.value = "";
  puzzleInstructions.value = "";
  authorName.value = "";
  publishToggle.value = false;
  uploadStatus.value = "";
  syncCheckboxInputsFromGridData();
}

function createNewPuzzle() {
  showCreateNewPuzzleModal.value = false;
  clearDraft();
  resetEditorToNewPuzzle();
  router.replace({ path: "/editor" });
  alertRef.value?.showAlert("success", "New puzzle created");
}

const showRulesLayerPreview = ref(true);
const inputRowCount: Ref<string | number> = ref(grid.value.size[0]);
const inputColCount: Ref<string | number> = ref(grid.value.size[1]);

const selectedTypesToCheck = computed<TypeToCheck[]>(() => {
  return answerCheckInfoList
    .filter((type) => typesToCheckInput.value[type.type])
    .map((type) => type.type);
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
  const puzzleObj = JSON.parse(JSON.stringify(grid.value)) as PuzzleData;
  if (puzzleObj.solution) {
    puzzleObj.solution.typeToCheck = [...selectedTypesToCheck.value];
  }

  puzzleObj.title = puzzleTitle.value.trim();
  puzzleObj.instructions = puzzleInstructions.value;

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
  const isUpdateMode = isExistingPuzzle.value;

  if (!userStore.user) {
    alertRef.value?.showAlert(
      "error",
      `Authentication required to ${publishActionLabel.value.toLowerCase()} puzzles. Login to submit.`,
    );
    return;
  }
  const title = puzzleTitle.value.trim();
  if (!title) {
    alertRef.value?.showAlert(
      "error",
      `Please enter a puzzle title before ${publishActionLabel.value.toLowerCase()}.`,
    );
    return;
  }

  uploadStatus.value = isUpdateMode ? "Updating..." : "Publishing...";
  isPublishing.value = true;
  try {
    const puzzleObj = getPuzzleJSON();
    const author =
      authorName.value.trim().slice(0, PUZZLE_AUTHOR_MAX_LENGTH) || "Anonymous";
    const description = puzzleDescription.value
      .trim()
      .slice(0, PUZZLE_DESCRIPTION_MAX_LENGTH);

    let res;
    if (puzzleId.value != null) {
      res = await api.patch(`/puzzles/${puzzleId.value}`, {
        author,
        description,
        puzzleJson: puzzleObj,
        published: publishToggle.value,
      });
    } else {
      res = await api.post("/puzzles", {
        author,
        description,
        puzzleJson: puzzleObj,
        published: publishToggle.value,
      });
      clearDraft();
      puzzleId.value = res.data.id;
    }
    alertRef.value?.showAlert(
      "success",
      isUpdateMode
        ? "Puzzle updated successfully!"
        : "Puzzle published successfully!",
    );
    showPublishModal.value = false;
  } catch (e) {
    let errorMessage;
    if (isAxiosError(e)) {
      errorMessage =
        e?.response?.data?.details || e?.message || "Unknown error";
      if (e.response?.status === 400) {
        errorMessage = "Invalid payload";
      } else if (e.response?.status === 401) {
        errorMessage = `Login required to ${publishActionLabel.value.toLowerCase()} puzzles`;
      }
    } else {
      errorMessage = "Unknown error";
    }
    alertRef.value?.showAlert(
      "error",
      `${publishActionLabel.value} failed: ${errorMessage}`,
    );
  } finally {
    isPublishing.value = false;
    uploadStatus.value = "";
  }
}

watch(
  [
    grid,
    puzzleTitle,
    puzzleDescription,
    puzzleInstructions,
    authorName,
    publishToggle,
    typesToCheckInput,
    customRulesInput,
    puzzleId,
  ],
  () => {
    scheduleDraftSave();
  },
  { deep: true },
);

onMounted(() => {
  fetchUploadedPuzzle();
});

onBeforeUnmount(() => {
  if (saveDraftTimeout !== undefined) {
    clearTimeout(saveDraftTimeout);
  }
  saveDraft(puzzleId.value);
});
</script>

<style scoped>
.editor-meta-panel {
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 1px solid #e0e0e0;
}
.editor-meta-label {
  display: flex;
  flex-direction: column;
  font-size: 0.98rem;
  color: #3a3a3a;
  margin-bottom: 8px;
}
.editor-meta-input {
  width: 100%;
  box-sizing: border-box;
  margin-top: 2px;
  padding: 4px 8px;
  border: 1px solid #d5daef;
  border-radius: 4px;
  font-size: 1rem;
  resize: vertical;
}
.editor-meta-panel {
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 1px solid #e0e0e0;
}
.editor-page {
  height: 100%;
  min-height: 0;
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(280px, 340px);
  gap: 12px;
  box-sizing: border-box;
  overflow: hidden;
  position: relative;
}

.editor-page.controls-collapsed {
  grid-template-columns: minmax(0, 1fr) 0;
}

.editor-canvas {
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
  border: 1px solid #e7e7e7;
  border-radius: 8px;
  background: #fff;
  padding: 16px;
  box-sizing: border-box;
  overflow: hidden;
  position: relative;
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
  transition: opacity 0.2s ease;
}
.editor-sidebar.collapsed {
  opacity: 0;
  pointer-events: none;
}

.sidebar-title {
  margin: 0;
  font-size: 1.15rem;
}

.editor-mode-indicator {
  margin: 0;
  color: #4d4d4d;
  font-size: 0.95rem;
}

.collapse-button {
  border: 1px solid #d5daef;
  background: #f2f5ff;
  border-radius: 8px;
  padding: 6px 10px;
  cursor: pointer;
  font-size: 0.85rem;
}

.floating-controls-handle,
.floating-controls-handle-bottom {
  position: absolute;
  border-radius: 4px;
  color: #1f2a4d;
  cursor: pointer;
  z-index: 100;
}

.floating-controls-handle {
  right: 8px;
  top: 8px;
  height: 100px;
  padding: 12px 10px;
  border: 2px solid rgba(0, 0, 0, 0.08);
}

.floating-controls-handle-bottom {
  bottom: 16px;
  left: 50%;
  width: 200px;
  transform: translateX(-50%);
  padding: 10px 12px;
  border: 2px solid rgba(0, 0, 0, 0.08);
  display: none;
}

.action-con {
  display: grid;
  grid-template-columns: 1fr;
  gap: 8px;
}

.hidden-import-input {
  display: none;
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
  grid-template-columns: 60px 1fr;
  align-items: center;
  gap: 14px;
  margin: 10px 0;
}

.author-title-vertical-row {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 6px;
  margin: 10px 0;
}
.author-title-vertical-row label {
  text-align: left;
}
.author-title-vertical-row input[type="text"] {
  width: 100%;
  margin-left: 0;
  text-align: left;
}
.title-label {
  font-weight: 500;
}

.publish-toggle-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin: 10px 0 0 0;
  gap: 12px;
}
.publish-toggle-label-col {
  flex: 1 1 auto;
  min-width: 0;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}
.publish-toggle-label {
  font-size: 1rem;
  color: #333;
  margin-bottom: 2px;
}
.publish-toggle-helper {
  font-size: 0.92rem;
  color: #666;
  max-width: 260px;
}
.publish-toggle-switch-col {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  min-width: 48px;
}
.switch {
  position: relative;
  display: inline-block;
  width: 42px;
  height: 24px;
}
.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}
.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #ccc;
  transition: 0.4s;
  border-radius: 24px;
}
.slider:before {
  position: absolute;
  content: "";
  height: 18px;
  width: 18px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  transition: 0.4s;
  border-radius: 50%;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12);
}
.switch input:checked + .slider {
  background-color: #4cd964;
}
.switch input:checked + .slider:before {
  transform: translateX(18px);
}

.dimension-row label {
  margin-right: 0;
  white-space: nowrap;
}

.dimension-row input[type="text"],
.dimension-row input[type="number"] {
  margin-left: 0;
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

.new-puzzle-model-con {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  flex: 1;
  min-height: 0;
}

.confirm-actions {
  display: flex;
  margin-top: auto;
  gap: 8px;
}

.helper-text.compact {
  margin-top: 4px;
  margin-bottom: 0;
}

.count {
  font-weight: 500;
  color: #5f5f5f;
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

  .floating-controls-handle {
    display: none;
  }

  .floating-controls-handle-bottom {
    display: block;
  }
}
</style>
