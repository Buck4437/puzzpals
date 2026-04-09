import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";
import { createPinia } from "pinia";
import { useUserStore } from "./stores/user";
import api from "./services/api";

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);
app.use(router);

const userStore = useUserStore(pinia);

async function initializeAuthState() {
  await userStore.fetchUser();

  // Some browsers can block cross-site cookie writes.
  // First try session establishment, then explicitly request token fallback.
  const currentUrl = new URL(window.location.href);
  const loginTicket = currentUrl.searchParams.get("loginTicket");

  if (!userStore.user && loginTicket) {
    try {
      await api.post("/auth/ticket/exchange", { ticket: loginTicket });
      await userStore.fetchUser();

      if (!userStore.user) {
        const tokenResp = await api.post("/auth/ticket/exchange", {
          ticket: loginTicket,
          issueBearerToken: true,
        });
        if (tokenResp.data && tokenResp.data.persistentBearerToken) {
          localStorage.setItem(
            "persistentBearerToken",
            tokenResp.data.persistentBearerToken,
          );
        }
        await userStore.fetchUser();
      } else {
        localStorage.removeItem("persistentBearerToken");
      }
    } catch {
      // Ignore exchange failures; UI remains logged out.
    }
  }

  sessionStorage.removeItem("pendingAuthFinalize");
  if (loginTicket) {
    currentUrl.searchParams.delete("loginTicket");
    const cleanUrl = `${currentUrl.pathname}${currentUrl.search}${currentUrl.hash}`;
    window.history.replaceState({}, "", cleanUrl);
  }

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
}

app.mount("#app");
initializeAuthState();
