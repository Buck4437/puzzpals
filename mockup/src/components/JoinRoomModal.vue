<script>
import BaseModal from "./BaseModal.vue";
export default {
  name: "JoinRoomModal",
  components: { BaseModal },
};
</script>

<template>
  <BaseModal>
    <template #default>
      <div class="main">
        <div>Enter 8-Digit Room Code:</div>
        <div class="input-con">
          <input placeholder="Room Code" />
          <button>Join Room</button>
        </div>
      </div>
    </template>
  </BaseModal>
</template>

<style scoped>
.main {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  gap: 1rem;
}

.input-con {
  display: flex;
  gap: 1rem;
  flex-direction: column;
}
</style>
