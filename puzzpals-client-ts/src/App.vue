<template>
  <header class="main-header" v-if="$route.meta.fullScreen !== true">
    <h1>Puzzpals</h1>
    <div>
      <button class="create-room-btn" @click="openRoomDialog">
        Create Room
      </button>
      <button class="login-btn" @click="goToLogin">Login</button>
    </div>
  </header>
  <main
    class="main-page"
    :class="{ 'main-page-fullscreen': $route.meta.fullScreen === true }"
  >
    <!-- Side Bar -->
    <NavigationSidebar
      v-if="$route.meta.fullScreen !== true"
      :routes="routes"
      @route-selected="handleRouteSelected"
    />
    <div
      class="content-area"
      :class="{ 'content-area-fullscreen': $route.meta.fullScreen === true }"
    >
      <RouterView />
    </div>
    <CreateRoomDialog
      v-if="showCreateRoomDialog"
      @close="showCreateRoomDialog = false"
      @upload-success="showCreateRoomDialog = false"
    />
  </main>
</template>

<script setup lang="ts">
import "./assets/main.css";
import { ref } from "vue";
import { useRouter } from "vue-router";
import NavigationSidebar from "./components/NavigationSidebar.vue";
import CreateRoomDialog from "./components/CreateRoomModal.vue";

const router = useRouter();
const showCreateRoomDialog = ref(false);
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

function handleRouteSelected(route: string) {
  router.push(route);
}

function goToLogin() {
  router.push("/login");
}

function openRoomDialog() {
  showCreateRoomDialog.value = true;
}
</script>

<style scoped>
h1 {
  font-size: 24px;
  margin: 0;
}

main {
  height: 100%;
  width: 100%;
}

.main-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 16px;
  background: #f8f8f8;
  font-size: 24px;
  border-bottom: 1px solid #e0e0e0;
  height: 67px;
}

.login-btn {
  background: #fff;
  border: 1px solid #ccc;
  border-radius: 4px;
  margin: 4px 0;
  margin-left: 8px;
  padding: 8px 16px;
  font-size: 16px;
  cursor: pointer;
  transition: box-shadow 0.2s;
}

.login-btn:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.main-page {
  display: flex;
  height: calc(100% - 67px);
}

.main-page-fullscreen {
  height: 100%;
}

.content-area {
  flex: 1;
  overflow-y: scroll;
  padding: 16px;
}

.content-area-fullscreen {
  height: 100%;
  padding: 0;
}
</style>
