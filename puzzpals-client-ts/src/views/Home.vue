<template>
  <FilePicker @file-picked="onFilePicked"/>
  <button @click="uploadFile">Upload</button>
</template>

<script setup lang="ts">
import FilePicker from '@/components/FilePicker.vue';
import api from '@/services/api';
import { useRouter } from 'vue-router';

const router = useRouter();

let pickedFile: File | null = null;

async function uploadFile() {
  if (pickedFile === null) {
    alert('Please select a file to upload.');
    return;
  }

  // While reading file, `pickedFile` might be mutated to null
  // Store `pickedFile` in `fileToRead` to avoid error
  const fileToRead = pickedFile;

  let puzzleData;

  try {
    // Read JSON file 
    puzzleData = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result);
        } else {
          reject();
        }
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsText(fileToRead);
    }).then(JSON.parse)
      .catch(() => {
        alert('Failed to read or parse the file. Please ensure it is a valid JSON file.');
        throw new Error('File read/parse error');
      });
  } catch (e) {
    return;
  }

  console.log('Parsed puzzle data:', puzzleData);

  // Send the data to the server
  const res = await api.post('/rooms/create', puzzleData, {
    headers: {
      'Content-Type': 'application/json'
    }
  }).catch((err) => {
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
