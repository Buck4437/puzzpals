<template>
  <div class="navigation-sidebar">
    <button
      v-for="route in routes"
      :key="route.name"
      @click="$emit('route-selected', route.route)"
    >
      {{ route.name }}
    </button>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  routes: { name: string; route: string }[];
}>();
</script>

<style scoped>
.navigation-sidebar {
  height: 100%;
  background-color: #f0f0f0;
  padding: 8px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}

.navigation-sidebar button {
  margin-bottom: 10px;
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 4px;
}
</style>
