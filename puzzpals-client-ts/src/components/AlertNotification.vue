<template>
  <transition name="slide-fade">
    <div v-if="alertType" :class="['alert', `alert-${alertType}`]">
      {{ alertMessage }}
    </div>
  </transition>
</template>

<script setup lang="ts">
import { ref } from "vue";

const alertType = ref<"success" | "error" | null>(null);
const alertMessage = ref("");
let alertTimeout: ReturnType<typeof setTimeout> | null = null;

function showAlert(
  type: "success" | "error",
  message: string,
  duration = 3000,
) {
  alertType.value = type;
  alertMessage.value = message;

  if (alertTimeout) clearTimeout(alertTimeout);
  alertTimeout = setTimeout(() => {
    alertType.value = null;
    alertMessage.value = "";
  }, duration);
}

defineExpose({
  showAlert,
});
</script>

<style scoped>
/* Alert/Toast Notification Styles */
.alert {
  position: fixed;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  padding: 12px 20px;
  border-radius: 6px;
  font-size: 0.95rem;
  font-weight: 500;
  z-index: 2000;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  max-width: 90%;
}

.alert-success {
  background-color: #ecfdf5;
  color: #065f46;
  border: 1px solid #a7f3d0;
}

.alert-error {
  background-color: #fef2f2;
  color: #7f1d1d;
  border: 1px solid #fecaca;
}

.slide-fade-enter-active,
.slide-fade-leave-active {
  transition: all 0.3s ease;
}

.slide-fade-enter-from {
  transform: translateX(-50%) translateY(-20px);
  opacity: 0;
}

.slide-fade-leave-to {
  transform: translateX(-50%) translateY(-20px);
  opacity: 0;
}
</style>
