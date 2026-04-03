// Pinia store for user session data; keeps minimal user info in frontend state.
import { defineStore } from "pinia";
import api from "@/services/api";

let inFlightFetch: Promise<void> | null = null;

export const useUserStore = defineStore("user", {
  state: () => ({
    user: null,
    loading: false,
    initialized: false,
  }),
  actions: {
    async fetchUser() {
      if (inFlightFetch) {
        return inFlightFetch;
      }
      inFlightFetch = (async () => {
        this.loading = true;
        try {
          const res = await api.get("/auth/session");
          this.user = res.data.authenticated ? res.data.data : null;
        } catch {
          this.user = null;
        } finally {
          this.loading = false;
          this.initialized = true;
          inFlightFetch = null;
        }
      })();
      return inFlightFetch;
    },
    async logout() {
      await api.post("/auth/logout");
      this.user = null;
      localStorage.setItem("authChanged", Date.now().toString());
      location.reload();
    },
  },
});
