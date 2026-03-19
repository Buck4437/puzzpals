import { createRouter, createWebHistory } from "vue-router";

import Home from "@/views/Home.vue";
import Login from "@/views/Login.vue";
import NotFound from "@/views/NotFound.vue";
import RoomPage from "@/views/RoomPage.vue";
import config from "@/config";
import EditorPage from "@/views/EditorPage.vue";

const router = createRouter({
  history: createWebHistory(config.baseUrl),
  routes: [
    { path: "/", component: Home },
    { path: "/login", component: Login },
    { path: "/404", component: NotFound },
    { path: "/room/:token", component: RoomPage, props: true },
    { path: "/editor", component: EditorPage },
    { path: "/catalogue", component: () => import("@/views/Catalogue.vue") },
  ],
});

import { useUserStore } from "../stores/user";

router.beforeEach(async (to, from, next) => {
  const userStore = useUserStore();
  await userStore.fetchUser();
  next();
});

export default router;
