<template>
  <header class="main-header">
    <h1>Puzzpals</h1>
    <NavBar />
  </header>
  <main>
    <RouterView />
  </main>
</template>

<!-- NavBar integrated for user info display -->
<script setup>
import NavBar from "./components/NavBar.vue";
import { useUserStore } from "./stores/user";
import { useRouter } from "vue-router";

const userStore = useUserStore();
const router = useRouter();

function goLogin() {
  router.push("/Login");
}
</script>

<style scoped>
.main-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 32px;
  background: #f8f8f8;
  border-bottom: 1px solid #e0e0e0;
}
.user-panel {
  display: flex;
  align-items: center;
  gap: 12px;
}
.user-meta {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  line-height: 1.2;
}
.user-name {
  margin: 0;
  font-weight: 600;
}
.user-email {
  margin: 0;
  font-size: 12px;
  color: #666;
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
.profile-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  vertical-align: middle;
}
.loading-spinner {
  display: inline-block;
  width: 24px;
  height: 24px;
  border: 3px solid #ccc;
  border-top: 3px solid #4285f4;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-right: 8px;
}
@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
</style>
