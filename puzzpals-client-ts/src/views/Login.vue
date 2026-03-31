<template>
  <div class="login-page">
    <h2>Login</h2>
    <button class="google-btn" @click="loginWithGoogle">
      Login with Google
    </button>
    <!-- Guest login removed -->
  </div>
</template>

<script setup lang="ts">
import config from "@/config";
import { useRoute } from "vue-router";

const route = useRoute();
const returnUrl =
  typeof route.query.returnUrl === "string" ? route.query.returnUrl : "/";

function loginWithGoogle() {
  window.location.href = `${config.apiBase}/auth/google/login?returnUrl=${encodeURIComponent(returnUrl)}`;
}
</script>

<style scoped>
.login-page {
  max-width: 400px;
  margin: 40px auto;
  padding: 24px;
  border-radius: 8px;
  background: #fff;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}
.google-btn {
  background: #4285f4;
  color: #fff;
  border: none;
  border-radius: 4px;
  padding: 10px 24px;
  margin-bottom: 16px;
  font-size: 16px;
  cursor: pointer;
}
.google-btn:hover {
  background: #357ae8;
}
form {
  margin-bottom: 24px;
}
input {
  padding: 8px;
  margin-right: 8px;
  border-radius: 4px;
  border: 1px solid #ccc;
}
button[type="submit"] {
  background: #eee;
  border: 1px solid #ccc;
  border-radius: 4px;
  padding: 8px 18px;
  font-size: 16px;
  cursor: pointer;
}
button[type="submit"]:hover {
  background: #ddd;
}
</style>
