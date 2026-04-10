import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";
import { createPinia } from "pinia";
import { useUserStore } from "./stores/user";

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);
app.use(router);

const userStore = useUserStore(pinia);

async function initializeAuthState() {
  await userStore.fetchUser();

  window.addEventListener("storage", (event) => {
    if (event.key === "authChanged") {
      userStore.fetchUser();
    }
  });
}

app.mount("#app");
initializeAuthState();
