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
        <div>Create a room</div>
        <div class="upload-file-con">
          <div class="upload-file-con-desc">
            Drag and drop a puzzle file here, or click here to browse files.
          </div>
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

.upload-file-con {
  width: 300px;
  height: 150px;
  border: 2px dashed #888;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.upload-file-con-desc {
  text-align: center;
  color: #666;
  max-width: 50%;
}
</style>
