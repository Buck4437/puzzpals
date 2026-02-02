<script>
import "./assets/main.css";
import JoinRoomModal from "./components/JoinRoomModal.vue";
import WelcomePage from "./components/WelcomePage.vue";
import CreateRoomModal from "./components/CreateRoomModal.vue";
import SolvingPage from "./components/SolvingPage.vue";

export default {
  name: "App",
  components: { WelcomePage, JoinRoomModal, CreateRoomModal, SolvingPage },
  data() {
    return {
      pageId: 0,
      maxPageId: 3,
      showPageId: true,
      _keyHandler: null,
    };
  },
  methods: {
    handleKeydown(event) {
      if (event.key === "," && this.pageId > 0) {
        this.pageId -= 1;
      } else if (event.key === "." && this.pageId < this.maxPageId) {
        this.pageId += 1;
      } else if (event.key === "m") {
        this.showPageId = !this.showPageId;
      }
    },
  },
  mounted() {
    this._keyHandler = (event) => this.handleKeydown(event);
    document.addEventListener("keydown", this._keyHandler);
  },
  beforeUnmount() {
    if (this._keyHandler) {
      document.removeEventListener("keydown", this._keyHandler);
      this._keyHandler = null;
    }
  },
};
</script>

<template>
  <!--
    <img alt="Vue logo" class="logo" src="./assets/logo.svg" width="125" height="125" />
    -->

  <div v-if="showPageId" class="debug-pageid">PageId: {{ pageId }}</div>
  <main>
    <template v-if="pageId === 0">
      <WelcomePage />
    </template>
    <template v-if="pageId === 1">
      <WelcomePage />
      <JoinRoomModal />
    </template>
    <template v-if="pageId === 2">
      <WelcomePage />
      <CreateRoomModal />
    </template>
    <template v-if="pageId === 3">
      <SolvingPage />
    </template>
  </main>
</template>

<style>
main {
  height: 100%;
  width: 100%;
}

.debug-pageid {
  position: absolute;
  top: 0;
  left: 0;
  background: rgba(0, 0, 0, 0.7);
  color: #fff;
  padding: 4px 8px;
  font-size: 14px;
  z-index: 1100;
}
</style>
