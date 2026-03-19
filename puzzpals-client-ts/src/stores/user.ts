// User account frontend storage logic removed. No user info is kept in frontend state.
import { defineStore } from "pinia";
import api from "@/services/api";

export const useUserStore = defineStore("user", {
  state: () => ({
    user: null,
    loading: false,
  }),
  actions: {
    async fetchUser() {
      this.loading = true;
      try {
        const res = await api.get("/auth/me");
        this.user = res.data.user;
      } catch {
        this.user = null;
      } finally {
        this.loading = false;
      }
      localStorage.setItem("authChanged", Date.now().toString());
    },
    async logout() {
      await api.post("/auth/logout");
      this.user = null;
      localStorage.setItem("authChanged", Date.now().toString());
    },
  },
});
