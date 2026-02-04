<template>
  <label for="puzzle-file">Upload file: </label>
  <input
    type="file"
    name="puzzle-file"
    id="puzzle-file"
    accept=".json"
    @change="onChange"
  />
</template>

<script setup lang="ts">
const emit = defineEmits(["filePicked"]);

function onChange(event: Event) {
  // Known that element is <input>
  const input = event.target as HTMLInputElement;

  // If user cancels file selection, file will be null
  const file =
    input.files !== null && input.files[0] !== undefined
      ? input.files[0]
      : null;
  emit("filePicked", file);
}
</script>
