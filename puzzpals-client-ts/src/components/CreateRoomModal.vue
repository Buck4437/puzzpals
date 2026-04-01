<template>
  <BaseModal @close="emit('close')">
    <div class="create-room">
      <div>Create a room:</div>
      <div class="input-con">
        <label
          class="fake-file-input button"
          :class="{ 'fake-file-input-disabled': isLoading }"
          :for="isLoading ? undefined : 'file-upload'"
        >
          {{
            isLoading ? "Uploading..." : "Click to select a puzzle file (JSON)"
          }}
        </label>
        <input
          id="file-upload"
          class="file-input-box"
          type="file"
          name="file"
          accept=".json"
          :disabled="isLoading"
          @change="onFileInputChange"
        />
      </div>
    </div>
  </BaseModal>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import api from "@/services/api";
import BaseModal from "@/components/BaseModal.vue";

const router = useRouter();
const emit = defineEmits(["close", "upload-success"]);
const isLoading = ref(false);

let pickedFile: File | null = null;

async function onFileInputChange(event: Event) {
  if (isLoading.value) {
    return;
  }

  const inputTarget = event.target;
  if (!(inputTarget instanceof HTMLInputElement)) {
    return;
  }

  const input = inputTarget;
  pickedFile = input.files?.[0] ?? null;

  // Nothing selected
  if (pickedFile === null) {
    return;
  }

  await uploadFile();

  input.value = "";
}

async function uploadFile() {
  if (pickedFile === null) {
    alert("Please select a file to upload.");
    return;
  }

  isLoading.value = true;

  try {
    let fileContent;
    try {
      fileContent = await readFile(pickedFile);
    } catch (error) {
      alert("Failed to read the file.");
      return;
    }

    let puzzleData;
    try {
      puzzleData = JSON.parse(fileContent);
    } catch (error) {
      alert("Failed to parse the file. Please ensure it is a valid JSON file.");
      return;
    }

    if (
      puzzleData === null ||
      typeof puzzleData !== "object" ||
      Array.isArray(puzzleData)
    ) {
      alert("Puzzle file must contain a JSON object.");
      return;
    }

    try {
      const res = await api.post("/rooms/create", puzzleData, {
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (res?.data?.token) {
        emit("upload-success");
        router.push(`/room/${res.data.token}`);
      }
    } catch (err: any) {
      alert(`Upload failed: ${err.response?.data?.error || err.message}`);
    }
  } finally {
    isLoading.value = false;
  }
}

function readFile(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
}

// Normally called by FilePicker
// During tests, call this directly
function onFilePicked(file: File | null) {
  pickedFile = file;
}

defineExpose({ onFilePicked });
</script>

<style scoped>
.create-room {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  gap: 1rem;
}

.input-con {
  display: flex;
  gap: 1rem;
  flex-direction: column;
  align-items: center;
  width: 100%;
}

.fake-file-input {
  cursor: pointer;
  width: min(100%, 320px);
  min-width: 250px;
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
}

.fake-file-input-disabled {
  cursor: not-allowed;
  opacity: 0.6;
  pointer-events: none;
}

.file-input-box {
  display: none;
}
</style>
