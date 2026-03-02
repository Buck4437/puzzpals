<template>
  <FilePicker @file-picked="onFilePicked" />
  <button @click="uploadFile">Upload</button>

  <GridSVG
    :size="480"
    :grid="grid"
    @center-cell-click="logCenterCellClick"
    @center-cell-enter="logCenterCellEnter"
    @corner-cell-click="logCornerCellClick"
    @corner-cell-enter="logCornerCellEnter"
  />
</template>

<script setup lang="ts">
import FilePicker from "@/components/FilePicker.vue";
import GridSVG from "@/components/GridSVG.vue";
import api from "@/services/api";
import { type Ref, ref } from "vue";
import type { Grid } from "@/models/Grid";
import { useRouter } from "vue-router";

function logCenterCellClick(...args: any[]) {
  console.log("Center cell clicked:", ...args);
}

function logCenterCellEnter(...args: any[]) {
  console.log("Center cell entered:", ...args);
}

function logCornerCellClick(...args: any[]) {
  console.log("Corner cell clicked:", ...args);
}

function logCornerCellEnter(...args: any[]) {
  console.log("Corner cell entered:", ...args);
}

const grid: Ref<Grid> = ref({
  size: [6, 7],
  problem: {
    lineObjects: [
      {
        start: [0, 0],
        end: [4, 4],
        color: "red",
      },
    ],
    surfaceObjects: [
      {
        location: [1.5, 1.5],
        color: "blue",
      },
    ],
    cellObjects: [
      {
        location: [2.5, 2.5],
        content: "A",
        color: "green",
      },
    ],
  },
});

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

// Normally called by FilePicker
// During tests, call this directly
function onFilePicked(file: File | null) {
  pickedFile = file;
}

defineExpose({ onFilePicked });
</script>
