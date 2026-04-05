<template>
  <header class="top-bar-con">
    <h1 @click="emit('titleClick')">Puzzpals</h1>
    <div class="top-bar-middle">
      <slot name="middle" />
    </div>
    <div class="top-bar-right">
      <slot name="right" />
    </div>
  </header>
</template>

<script setup lang="ts">
const emit = defineEmits<{
  titleClick: [];
}>();
</script>

<style scoped>
.top-bar-con {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 16px;
  background: #f8f8f8;
  border-bottom: 1px solid #e0e0e0;
}

h1 {
  font-size: 24px;
  margin: 0;
  cursor: pointer;
}

.top-bar-right {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}
</style>
