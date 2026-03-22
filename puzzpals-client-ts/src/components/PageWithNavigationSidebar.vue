<template>
  <div class="navigation-sidebar-page">
    <div class="navigation-sidebar">
      <button
        v-for="route in routes"
        :key="route.name"
        @click="() => $router.push(route.route)"
      >
        {{ route.name }}
      </button>
    </div>
    <div class="content-area">
      <slot></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
const routes = [
  {
    name: "Home",
    route: "/",
  },
  {
    name: "Editor",
    route: "/editor",
  },
  {
    name: "Catalog",
    route: "/catalogue",
  },
];
</script>

<style scoped>
.navigation-sidebar-page {
  display: flex;
  height: 100%;
}
.navigation-sidebar {
  width: 200px;
  background-color: #f0f0f0;
  padding: 20px;
  display: flex;
  flex-direction: column;
}
.navigation-sidebar button {
  margin-bottom: 10px;
  padding: 10px;
  background-color: #fff;
  border: 1px solid #ccc;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.navigation-sidebar button:hover {
  background-color: #e0e0e0;
}

.content-area {
  flex: 1;
  padding: 20px;
}
</style>
