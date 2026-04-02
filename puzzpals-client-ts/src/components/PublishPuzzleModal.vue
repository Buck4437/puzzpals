<template>
  <BaseModal v-if="isOpen" @close="emit('close')">
    <h3>Publish puzzle</h3>

    <div class="publish-form">
      <label>
        Title
        <input
          :value="title"
          type="text"
          placeholder="Enter puzzle title"
          @input="onTitleInput"
        />
      </label>

      <label>
        Author
        <input
          :value="author"
          type="text"
          placeholder="Enter optional nickname"
          @input="onAuthorInput"
        />
      </label>

      <div class="publish-description-row">
        <span>Description</span>
        <button
          type="button"
          class="secondary-button"
          @click="showDescription = true"
        >
          Edit
        </button>
      </div>

      <PuzzleDescriptionModal
        :isOpen="showDescription"
        :description="description"
        @close="showDescription = false"
        @save="onSaveDescription"
      />

      <label class="publish-toggle-row" for="publish-toggle-modal">
        <div>
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
        <button type="button" class="secondary-button" @click="emit('close')">
          Cancel
        </button>
        <button type="button" :disabled="isPublishing" @click="emitPublish">
          {{ isPublishing ? "Publishing..." : "Publish" }}
        </button>
      </div>
    </div>
  </BaseModal>
</template>

<script setup lang="ts">
import { ref } from "vue";

import BaseModal from "@/components/BaseModal.vue";
import PuzzleDescriptionModal from "@/components/PuzzleDescriptionModal.vue";

const props = defineProps<{
  isOpen: boolean;
  title: string;
  author: string;
  description: string;
  published: boolean;
  isPublishing: boolean;
  statusText: string;
}>();

const emit = defineEmits<{
  close: [];
  publish: [];
  updateTitle: [value: string];
  updateAuthor: [value: string];
  updateDescription: [value: string];
  updatePublished: [value: boolean];
}>();

const showDescription = ref(false);

function onTitleInput(event: Event) {
  const target = event.target;
  if (target instanceof HTMLInputElement) {
    emit("updateTitle", target.value);
  }
}

function onAuthorInput(event: Event) {
  const target = event.target;
  if (target instanceof HTMLInputElement) {
    emit("updateAuthor", target.value);
  }
}

function onPublishedInput(event: Event) {
  const target = event.target;
  if (target instanceof HTMLInputElement) {
    emit("updatePublished", target.checked);
  }
}

function onSaveDescription(value: string) {
  emit("updateDescription", value);
  showDescription.value = false;
}

function emitPublish() {
  emit("publish");
}
</script>

<style scoped>
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

.publish-description-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.publish-toggle-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
  cursor: pointer;
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
  margin: 2px 0;
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
