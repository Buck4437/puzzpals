import { createRouter, createWebHistory } from "vue-router";

import Home from "@/views/Home.vue";
import Login from "@/views/Login.vue";
import NotFound from "@/views/NotFound.vue";
import RoomPage from "@/views/RoomPage.vue";
import config from "@/config";
import EditorPage from "@/views/EditorPage.vue";
import MyPuzzles from "@/views/MyPuzzles.vue";

const router = createRouter({
  history: createWebHistory(config.baseUrl),
  routes: [
    { path: "/", component: Home },
    { path: "/404", component: NotFound, meta: { hideHeader: true } },
    {
      path: "/room/:token",
      component: RoomPage,
      props: true,
      meta: { hideHeader: true },
    },
    { path: "/editor", component: EditorPage },
    { path: "/catalogue", component: () => import("@/views/Catalogue.vue") },
    {
      path: "/puzzle/:id",
      component: () => import("@/views/PuzzleDetail.vue"),
      props: true,
    },
    { path: "/my-puzzles", component: MyPuzzles },
    { path: "/login", component: Login, meta: { hideHeader: false } },
  ],
});

import { useUserStore } from "../stores/user";

router.beforeEach(async (to, from, next) => {
  const userStore = useUserStore();
  await userStore.fetchUser();
  next();
});

export default router;
