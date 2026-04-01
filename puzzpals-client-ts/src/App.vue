<template>
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
  <main
    class="main-page"
    :class="{
      'main-page-fullscreen': isFullScreen,
      'main-page-left-nav-collapsed': shouldCollapseLeftNav,
    }"
  >
    <!-- Side Bar -->
    <div
      v-if="!isFullScreen"
      class="left-nav-shell"
      :class="{ collapsed: shouldCollapseLeftNav }"
    >
      <NavigationSidebar
        :routes="navRoutes"
        @route-selected="handleRouteSelected"
      />
    </div>

    <button
      v-if="!isFullScreen && isEditorPage"
      class="floating-left-nav-handle"
      :class="{ collapsed: shouldCollapseLeftNav }"
      type="button"
      @click="leftNavCollapsed = !leftNavCollapsed"
      :aria-label="
        shouldCollapseLeftNav ? 'Show left navigation' : 'Hide left navigation'
      "
    >
      {{ shouldCollapseLeftNav ? "▶" : "◀" }}
    </button>

    <div
      class="content-area"
      :class="{
        'content-area-fullscreen': isFullScreen,
        'content-area-editor': isEditorPage,
      }"
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
import "./assets/colors.css";
import { computed, ref, watch } from "vue";

import { useRoute, useRouter } from "vue-router";
import NavigationSidebar from "./components/NavigationSidebar.vue";
import CreateRoomDialog from "./components/CreateRoomModal.vue";

import { useUserStore } from "./stores/user";
const userStore = useUserStore();
const router = useRouter();
const route = useRoute();
const currentUser = computed(
  () => userStore.user as { picture?: string; email?: string } | null,
);

const showCreateRoomDialog = ref(false);
const dropdownOpen = ref(false);
const leftNavCollapsed = ref(false);
const baseRoutes = [
  {
    name: "Editor",
    route: "/editor",
  },
  {
    name: "Catalog",
    route: "/",
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

const isFullScreen = computed(() => route.meta.fullScreen === true);
const isEditorPage = computed(() => route.path === "/editor");
const shouldCollapseLeftNav = computed(
  () => isEditorPage.value && leftNavCollapsed.value,
);

watch(
  () => route.path,
  (path) => {
    if (path !== "/editor") {
      leftNavCollapsed.value = false;
    }
  },
);

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
  router.push("/login");
}

function goToHome() {
  router.push("/");
}

function openRoomDialog() {
  showCreateRoomDialog.value = true;
}
</script>

<style scoped>
h1 {
  font-size: 24px;
  margin: 0;
  cursor: pointer;
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

.main-header > div {
  display: flex;
  align-items: center;
  gap: 8px;
}
.login-btn {
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

.create-room-btn {
  padding: 8px 16px;
  font-size: 16px;
  cursor: pointer;
  border: 1px solid #ccc;
  background: #fff;
  border-radius: 4px;
  transition: box-shadow 0.2s;
  vertical-align: middle;
}

.create-room-btn:hover {
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
  display: block;
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
  position: relative;
}

.left-nav-shell {
  width: 300px;
  flex: 0 0 300px;
  min-width: 0;
  overflow: hidden;
  transition:
    width 0.2s ease,
    flex-basis 0.2s ease,
    opacity 0.2s ease;
}

.left-nav-shell.collapsed {
  width: 0;
  flex-basis: 0;
  opacity: 0;
}

.floating-left-nav-handle {
  position: absolute;
  left: 308px;
  top: 50%;
  transform: translateY(-50%);
  height: 200px;
  padding: 12px 10px;
  border-radius: 4px;
  color: #1f2a4d;
  cursor: pointer;
  z-index: 110;
  opacity: 0.12;
  transition: opacity 0.2s ease;
}

.floating-left-nav-handle.collapsed {
  left: 8px;
}

.floating-left-nav-handle:hover,
.floating-left-nav-handle:focus-visible {
  opacity: 0.9;
}
.content-area {
  flex: 1;
  padding: 20px;
  min-width: 0;
  overflow-y: auto;
}

.content-area-editor {
  padding: 0;
  overflow: hidden;
}
</style>
