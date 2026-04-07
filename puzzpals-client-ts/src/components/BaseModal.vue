<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-content" role="dialog" aria-modal="true">
      <button
        type="button"
        class="close-btn"
        aria-label="Close"
        @click="$emit('close')"
      >
        ×
      </button>
      <div class="scrollable">
        <slot> Your content goes here </slot>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts"></script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.36);
  z-index: 1000;
}

.modal-content {
  min-width: min(480px, 75%);
  max-width: 92%;
  min-height: 140px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  padding: 16px 4px 4px;
  box-sizing: border-box;
  position: relative;
  overflow: hidden;
  /* empty rectangle visual */
  border: 2px solid rgba(0, 0, 0, 0.08);
}

.scrollable {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 18px;
}

.close-btn {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 16px;
  height: 16px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  font-size: 35px;
  line-height: 1;
  cursor: pointer;
  color: #444;
  border-radius: 6px;
}

.close-btn:hover {
  background: rgba(0, 0, 0, 0.06);
}
</style>
