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

async function bootstrap() {
  await userStore.fetchUser();
  if (sessionStorage.getItem("pendingAuthLogin") === "1") {
    sessionStorage.removeItem("pendingAuthLogin");
    if (userStore.user) {
      localStorage.setItem("authChanged", Date.now().toString());
    }
  }
  window.addEventListener("storage", (event) => {
    if (event.key === "authChanged") {
      userStore.fetchUser();
    }
  });
  app.mount("#app");
}

bootstrap();
