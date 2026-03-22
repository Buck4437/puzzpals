<script setup></script>

<template>
  <div class="main">
    <div class="center-box">
      <div class="title">Welcome to Puzzpals!</div>

      <div class="action-buttons">
        <button>Create Room</button>
        <button>Join Room</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.main {
  height: calc(100% - 4rem);
  width: calc(100% - 4rem);
  padding: 2rem;
  display: flex;
  justify-content: center;
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

.action-buttons {
  margin-top: 2rem;
  display: flex;
  gap: 1rem;
}
</style>
