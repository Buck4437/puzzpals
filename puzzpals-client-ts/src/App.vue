<template>
  <header class="main-header">
    <h1>Puzzpals</h1>
    <button class="login-btn" @click="goToLogin">Login</button>
  </header>
  <main>
    <!-- Side Bar -->
    <div class="navigation-bar"></div>
    <RouterView />
  </main>
</template>

<script setup lang="ts">
import "./assets/main.css";
import { useRouter } from "vue-router";

const routes = [
  {
    name: "Home",
  },
  {
    name: "Editor",
  },
  {
    name: "Catalog",
  },
];
const router = useRouter();

function goToLogin() {
  router.push("/login");
}
</script>

<style scoped>
main {
  height: 100%;
  width: 100%;
}
.main-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 32px;
  background: #f8f8f8;
  border-bottom: 1px solid #e0e0e0;
}
.login-btn {
  background: #fff;
  border: 1px solid #ccc;
  border-radius: 4px;
  padding: 8px 18px;
  font-size: 16px;
  cursor: pointer;
  transition: box-shadow 0.2s;
}
.login-btn:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}
</style>
