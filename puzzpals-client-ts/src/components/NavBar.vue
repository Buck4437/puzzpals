<template>
  <nav class="user-icon-dropdown">
    <div v-if="userStore.user">
      <img
        :src="userStore.user.picture"
        class="profile-icon"
        @click="toggleDropdown"
        alt="User Icon"
      />
      <div v-if="dropdownOpen" class="dropdown-menu">
        <div>{{ userStore.user.email }}</div>
        <button @click="logout">Logout</button>
      </div>
    </div>
    <div v-else>
      <button class="login-btn" @click="goLogin">Login</button>
    </div>
  </nav>
</template>

<script setup>
import { ref } from "vue";
import { useUserStore } from "../stores/user";
import { useRouter } from "vue-router";

const userStore = useUserStore();
const dropdownOpen = ref(false);
const router = useRouter();

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
</script>

<style scoped>
.user-icon-dropdown {
  position: relative;
  display: inline-block;
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
.login-btn {
  background: #fff;
  border: 1px solid #ccc;
  border-radius: 4px;
  padding: 8px 18px;
  font-size: 16px;
  cursor: pointer;
}
</style>
