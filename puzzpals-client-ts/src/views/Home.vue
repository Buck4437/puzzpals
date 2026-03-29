<template>
  <div class="main">
    <div class="center-box">
      <div class="title">Welcome to Puzzpals!</div>
      <div class="options">
        <div class="join-room">
          <div>Enter 10-Digit Room Code:</div>
          <div class="input-con">
            <input placeholder="Room Code" v-model="roomCode" />
            <button @click="redirect">Join Room</button>
          </div>
        </div>
        <div class="create-room">
          <div>Create a room:</div>
          <div class="input-con">
            <label class="fake-file-input button" for="file-upload">
              Choose Puzzle File (JSON)
            </label>
            <input
              id="file-upload"
              class="file-input-box"
              ref="fileInput"
              type="file"
              name="avatar"
              accept=".json"
              @change="uploadFile"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import api from "@/services/api";
import { useRouter } from "vue-router";
import { ref } from "vue";

const router = useRouter();
const roomCode = ref("");

let pickedFile: File | null = null;

function readFile(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
}

function redirect() {
  router.push(`/room/${roomCode.value}`);
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

  if (res !== undefined && res.data) {
    router.push(`/room/${res.data}`);
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

<style scoped>
.main {
  height: calc(100% - 4rem);
  width: calc(100% - 4rem);
  padding: 2rem;
  display: flex;
  align-items: center;
  flex-direction: column;
}

.center-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.title {
  font-size: 2rem;
  display: flex;
  align-items: center;
}

.options {
  display: flex;
  gap: 4rem;
}

.join-room,
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
}

.fake-file-input {
  cursor: pointer;
  width: 100%;
  min-width: 250px;
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
}

.file-input-box {
  display: none;
}
</style>
