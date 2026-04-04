<template>
  <header class="main-header" v-if="!isFullScreen">
    <h1 @click="goToHome">Puzzpals</h1>
    <div>
      <button class="create-room-btn" @click="openRoomDialog">
        Create Room
      </button>
      <nav class="user-icon-dropdown">
        <div v-if="currentUser">
          <img
            :src="currentUser.picture"
            class="profile-icon"
            ref="profileIconRef"
            @click="toggleDropdown"
            alt="User Icon"
          />
          <div v-if="dropdownOpen" ref="dropdownRef" class="dropdown-menu">
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
    }"
  >
    <!-- Side Bar -->
    <div v-if="!isFullScreen" class="left-nav-shell">
      <NavigationSidebar
        :routes="navRoutes"
        @route-selected="handleRouteSelected"
      />
    </div>

    <div
      class="content-area"
      :class="{
        'content-area-fullscreen': isFullScreen,
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
import { computed, ref, onMounted, onBeforeUnmount } from "vue";
import config from "@/config";

import { useRoute, useRouter } from "vue-router";
import NavigationSidebar from "@/components/NavigationSidebar.vue";
import CreateRoomDialog from "@/components/CreateRoomModal.vue";

import { useUserStore } from "@/stores/user";
const userStore = useUserStore();
const router = useRouter();
const route = useRoute();
const currentUser = computed(
  () => userStore.user as { picture?: string; email?: string } | null,
);

const showCreateRoomDialog = ref(false);
const dropdownOpen = ref(false);
const profileIconRef = ref<HTMLElement | null>(null);
const dropdownRef = ref<HTMLElement | null>(null);
const baseRoutes = [
  {
    name: "Home",
    route: "/",
  },
  {
    name: "Editor",
    route: "/editor",
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

const isFullScreen = computed(() => route.meta.isFullScreen === true);

function handleRouteSelected(route: string) {
  router.push(route);
}

function toggleDropdown() {
  dropdownOpen.value = !dropdownOpen.value;
}

function onDocumentClick(e: MouseEvent) {
  const target = e.target as Node | null;
  if (!dropdownOpen.value) return;
  const clickedInsideDropdown =
    !!dropdownRef.value && dropdownRef.value.contains(target as Node);
  const clickedOnIcon =
    !!profileIconRef.value && profileIconRef.value.contains(target as Node);
  if (!clickedInsideDropdown && !clickedOnIcon) {
    dropdownOpen.value = false;
  }
}

onMounted(() => {
  document.addEventListener("click", onDocumentClick);
});

onBeforeUnmount(() => {
  document.removeEventListener("click", onDocumentClick);
});

async function logout() {
  await userStore.logout();
  dropdownOpen.value = false;
}

function goLogin() {
  const basePath = config.baseUrl.replace(/\/$/, "");
  const routeReturnUrl = route.path === "/login" ? "/" : route.fullPath;
  const returnUrl =
    basePath && basePath !== "/"
      ? `${basePath}${routeReturnUrl}`
      : routeReturnUrl;
  router.push({
    path: "/login",
    query: { returnUrl },
  });
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

.create-room-btn,
.login-btn {
  padding: 8px 16px;
  font-size: 16px;
  cursor: pointer;
  margin: 4px 0;
  margin-left: 8px;
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
  width: 200px;
  flex: 0 0 200px;
  min-width: 0;
  overflow: hidden;
  transition:
    width 0.2s ease,
    flex-basis 0.2s ease,
    opacity 0.2s ease;
}

.content-area {
  flex: 1;
  padding: 20px;
  min-width: 0;
  overflow-y: auto;
}

.content-area-fullscreen {
  padding: 0;
}
</style>
