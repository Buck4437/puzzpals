<template>
  <FilePicker @file-picked="onFilePicked" />
  <button @click="uploadFile">Upload</button>
  <button @click="openEditor">Open Editor</button>
</template>

<script setup lang="ts">
import FilePicker from "@/components/FilePicker.vue";
import api from "@/services/api";
import { useRouter } from "vue-router";

const router = useRouter();

let pickedFile: File | null = null;

function readFile(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
}

async function uploadFile() {
  if (pickedFile === null) {
    alert("Please select a file to upload.");
    return;
  }

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

  // Send the data to the server
  const res = await api
    .post("/rooms/create", puzzleData, {
      headers: {
        "Content-Type": "application/json",
      },
    })
    .catch((err) => {
      alert(`Upload failed: ${err.response?.data?.error || err.message}`);
    });

  if (res !== undefined && res.data && res.data.token) {
    router.push(`/room/${res.data.token}`);
  }
}

function openEditor() {
  router.push("/editor");
}
// Normally called by FilePicker
// During tests, call this directly
function onFilePicked(file: File | null) {
  pickedFile = file;
}

defineExpose({ onFilePicked });
</script>
