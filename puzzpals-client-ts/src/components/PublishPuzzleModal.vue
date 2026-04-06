<template>
  <BaseModal v-if="isOpen" @close="emit('close')">
    <h3>Puzzle Information</h3>

    <div class="publish-form">
      <label>
        Title
        <input
          :value="title"
          type="text"
          placeholder="Enter puzzle title (Max 100 characters)"
          @input="onTitleInput"
        />
      </label>

      <label>
        Instructions
        <textarea
          :value="instructions"
          rows="5"
          placeholder="Enter puzzle instructions (Max 1000 characters; you can also describe additional rules here)"
          @input="onInstructionsInput"
        ></textarea>
      </label>

      <div class="import-export-action">
        <button type="button" @click="emit('exportPuzzle')">
          Export Puzzle
        </button>
      </div>
    </div>

    <h3>{{ isUpdateMode ? "Update puzzle" : "Publish puzzle" }}</h3>

    <p v-if="!isLoggedIn" class="status-text">
      You must log in to {{ isUpdateMode ? "update" : "publish" }} puzzle.
    </p>

    <div class="publish-form">
      <label>
        Description
        <textarea
          :value="description"
          rows="4"
          placeholder="Enter catalogue description (Max 1000 characters)"
          @input="onDescriptionInput"
        ></textarea>
      </label>

      <label>
        Author
        <input
          :value="author"
          type="text"
          placeholder="Enter optional nickname (Max 100 characters)"
          @input="onAuthorInput"
        />
      </label>

      <label class="publish-toggle-row" for="publish-toggle-modal">
        <div class="public-text">
          <span class="publish-toggle-title">Public</span>
          <p class="publish-toggle-helper">
            If enabled, your puzzle will be visible to everyone in the
            catalogue. If disabled, only you can access it.
          </p>
        </div>
        <span class="switch">
          <input
            id="publish-toggle-modal"
            type="checkbox"
            :checked="published"
            @change="onPublishedInput"
          />
          <span class="slider"></span>
        </span>
      </label>

      <p v-if="statusText" class="status-text">{{ statusText }}</p>

      <div class="actions">
        <button
          type="button"
          :disabled="isPublishing || !isLoggedIn"
          @click="emitPublish"
        >
          {{
            isPublishing
              ? isUpdateMode
                ? "Updating..."
                : "Publishing..."
              : isUpdateMode
                ? "Update"
                : "Publish"
          }}
        </button>
      </div>
    </div>
  </BaseModal>
</template>

<script setup lang="ts">
import BaseModal from "@/components/BaseModal.vue";
import {
  PUZZLE_AUTHOR_MAX_LENGTH,
  PUZZLE_DESCRIPTION_MAX_LENGTH,
  PUZZLE_INSTRUCTIONS_MAX_LENGTH,
  PUZZLE_TITLE_MAX_LENGTH,
} from "@puzzpals/puzzle-models";

defineProps<{
  isOpen: boolean;
  title: string;
  instructions: string;
  description: string;
  author: string;
  published: boolean;
  isPublishing: boolean;
  isUpdateMode: boolean;
  statusText: string;
  isLoggedIn: boolean;
}>();

const emit = defineEmits<{
  close: [];
  publish: [];
  exportPuzzle: [];
  updateTitle: [value: string];
  updateInstructions: [value: string];
  updateDescription: [value: string];
  updateAuthor: [value: string];
  updatePublished: [value: boolean];
}>();

function onTitleInput(event: Event) {
  const target = event.target;
  if (target instanceof HTMLInputElement) {
    emit("updateTitle", target.value.slice(0, PUZZLE_TITLE_MAX_LENGTH));
  }
}

function onInstructionsInput(event: Event) {
  const target = event.target;
  if (target instanceof HTMLTextAreaElement) {
    emit(
      "updateInstructions",
      target.value.slice(0, PUZZLE_INSTRUCTIONS_MAX_LENGTH),
    );
  }
}

function onDescriptionInput(event: Event) {
  const target = event.target;
  if (target instanceof HTMLTextAreaElement) {
    emit(
      "updateDescription",
      target.value.slice(0, PUZZLE_DESCRIPTION_MAX_LENGTH),
    );
  }
}

function onAuthorInput(event: Event) {
  const target = event.target;
  if (target instanceof HTMLInputElement) {
    emit("updateAuthor", target.value.slice(0, PUZZLE_AUTHOR_MAX_LENGTH));
  }
}

function onPublishedInput(event: Event) {
  const target = event.target;
  if (target instanceof HTMLInputElement) {
    emit("updatePublished", target.checked);
  }
}

function emitPublish() {
  emit("publish");
}
</script>

<style scoped>
h3 {
  margin-top: 0;
}

input {
  height: 24px;
}

textarea {
  box-sizing: border-box;
  width: 100%;
  min-height: 120px;
  padding: 6px 8px;
  border: 1px solid #d5daef;
  border-radius: 4px;
  resize: vertical;
}

.publish-form .import-export-action {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

.publish-form {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.publish-form label {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

label.publish-toggle-row {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  cursor: pointer;
}

.public-text {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 0 0 80%;
}

.publish-toggle-title {
  font-size: 1rem;
}

.publish-toggle-helper {
  margin: 3px 0 0;
  font-size: 0.9rem;
  color: #666;
}

.status-text {
  color: #444;
}

.actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.secondary-button {
  border: 1px solid #d5daef;
  background: #f2f5ff;
  border-radius: 8px;
  padding: 6px 10px;
  cursor: pointer;
}

.switch {
  position: relative;
  display: inline-flex;
  justify-content: flex-end;
  align-items: center;
  flex: 0 0 auto;
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
  background-color: #fff;
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
</style>
