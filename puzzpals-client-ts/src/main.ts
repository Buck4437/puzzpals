import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";
import { createPinia } from "pinia";
const app = createApp(App);
const pinia = createPinia();

app.use(pinia);
app.use(router);

// All userStore logic removed. No session sync or user state in frontend.

app.mount("#app");

// import { useUserStore } from "./stores/user";

// window.addEventListener("storage", (event) => {
//   if (event.key === "authChanged") {
//     const userStore = useUserStore();
//     userStore.fetchUser();
//   }
// });
