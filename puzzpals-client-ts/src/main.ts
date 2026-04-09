import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";
import { createPinia } from "pinia";
import { useUserStore } from "./stores/user";
import api from "./services/api";
import config from "./config";

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);
app.use(router);

const userStore = useUserStore(pinia);

async function initializeAuthState() {
  await userStore.fetchUser();

  // Some browsers can block cross-site cookie writes for XHR-based login finalization.
  // If API exchange does not establish a session, retry with top-level navigation.
  const currentUrl = new URL(window.location.href);
  const loginTicket = currentUrl.searchParams.get("loginTicket");
  const finalizeAttempted =
    sessionStorage.getItem("pendingAuthFinalize") === "1";

  if (!userStore.user && loginTicket) {
    try {
      await api.post("/auth/ticket/exchange", { ticket: loginTicket });
      await userStore.fetchUser();
    } catch {
      // Ignore exchange failures; UI remains logged out.
    }

    if (!userStore.user && !finalizeAttempted) {
      sessionStorage.setItem("pendingAuthFinalize", "1");
      currentUrl.searchParams.delete("loginTicket");
      const returnUrl = `${currentUrl.pathname}${currentUrl.search}${currentUrl.hash}`;
      window.location.href = `${config.apiBase}/auth/ticket/finalize?ticket=${encodeURIComponent(loginTicket)}&returnUrl=${encodeURIComponent(returnUrl)}`;
      return;
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
