<template>
  <div class="main">
    <div class="center-box">
      <div class="title">Welcome to Puzzpals!</div>
      <div class="options"></div>
    </div>
  </div>
</template>

<script setup lang="ts"></script>

<style scoped>
.main {
  height: calc(100% - 4rem);
  width: calc(100% - 4rem);
  padding: 2rem;
  display: flex;
  align-items: center;
  flex-direction: column;
}

.center-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.title {
  font-size: 2rem;
  display: flex;
  align-items: center;
}

.options {
  display: flex;
  gap: 4rem;
}
</style>
