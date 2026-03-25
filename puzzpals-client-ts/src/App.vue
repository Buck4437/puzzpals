<template>
  <div class="app-shell">
    <header class="main-header" v-if="$route.meta.hideHeader !== true">
      <h1>Puzzpals</h1>
      <div>
        <button class="create-room-btn" @click="openRoomDialog">
          Create Room
        </button>
        <nav class="user-icon-dropdown">
          <div v-if="currentUser">
            <img
              :src="currentUser.picture"
              class="profile-icon"
              @click="toggleDropdown"
              alt="User Icon"
            />
            <div v-if="dropdownOpen" class="dropdown-menu">
              <div>{{ currentUser.email }}</div>
              <button class="login-btn" @click="logout">Logout</button>
            </div>
          </div>
          <div v-else>
            <button class="login-btn" @click="goLogin">Login</button>
          </div>
        </nav>
      </div>
    </header>
    <main class="main-page">
      <!-- Side Bar -->
      <NavigationSidebar
        v-if="$route.meta.hideHeader !== true"
        :routes="navRoutes"
        @route-selected="handleRouteSelected"
      />
      <div class="content-area">
        <RouterView />
      </div>
      <CreateRoomDialog
        v-if="showCreateRoomDialog"
        @close="showCreateRoomDialog = false"
      />
    </main>
  </div>
</template>

<script setup lang="ts">
import "./assets/main.css";
import { computed, ref } from "vue";
import { useRouter } from "vue-router";
import NavigationSidebar from "./components/NavigationSidebar.vue";

import { useUserStore } from "./stores/user";
const userStore = useUserStore();
const router = useRouter();
const currentUser = computed(
  () => userStore.user as { picture?: string; email?: string } | null,
);

const showCreateRoomDialog = ref(false);
const dropdownOpen = ref(false);
const baseRoutes = [
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
const navRoutes = computed(() => {
  if (!currentUser.value) {
    return baseRoutes;
  }

  return [
    ...baseRoutes,
    {
      name: "My Puzzles",
      route: "/my-puzzles",
    },
  ];
});

function handleRouteSelected(route: string) {
  router.push(route);
}

function toggleDropdown() {
  dropdownOpen.value = !dropdownOpen.value;
}

async function logout() {
  await userStore.logout();
  dropdownOpen.value = false;
}

function goLogin() {
  router.push("/Login");
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
.app-shell {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
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
  border-bottom: 1px solid #e0e0e0;
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
.user-icon-dropdown {
  position: relative;
  display: inline-block;
  margin-left: 8px;
}
.profile-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  cursor: pointer;
}
.dropdown-menu {
  position: absolute;
  right: 0;
  top: 100%;
  background: #fff;
  border: 1px solid #ccc;
  min-width: 160px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  z-index: 100;
  padding: 8px;
}
.main-page {
  display: flex;
  flex: 1;
  min-height: 0;
  overflow: hidden;
}
.content-area {
  flex: 1;
  padding: 20px;
  min-width: 0;
  overflow-y: auto;
}
</style>
