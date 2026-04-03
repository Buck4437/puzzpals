<template>
  <BaseModal v-if="isOpen" @close="handleCancel">
    <h3>Edit Description</h3>
    <textarea
      v-model="tempDescription"
      class="editor-meta-input description-modal-textarea"
      placeholder="Enter puzzle description"
      rows="8"
    ></textarea>
    <div
      style="
        display: flex;
        justify-content: flex-end;
        gap: 10px;
        margin-top: 16px;
      "
    >
      <button class="secondary-button" @click="handleCancel">Cancel</button>
      <button class="secondary-button" @click="handleSave">Save</button>
    </div>
  </BaseModal>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import BaseModal from "@/components/BaseModal.vue";

const props = defineProps<{
  isOpen: boolean;
  description: string;
}>();

const emit = defineEmits<{
  close: [];
  save: [description: string];
}>();

const tempDescription = ref("");

// Sync tempDescription when modal opens
watch(
  () => props.isOpen,
  (val) => {
    if (val) {
      tempDescription.value = props.description;
    }
  },
);

function handleCancel() {
  tempDescription.value = props.description;
  emit("close");
}

function handleSave() {
  emit("save", tempDescription.value);
  emit("close");
}
</script>

<style scoped>
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

.secondary-button {
  border: 1px solid #d5daef;
  background: #f2f5ff;
  border-radius: 8px;
  padding: 6px 10px;
  cursor: pointer;
}
</style>
