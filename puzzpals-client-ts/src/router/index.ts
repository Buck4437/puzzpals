import { createRouter, createWebHistory } from "vue-router";

import Login from "@/views/Login.vue";
import NotFound from "@/views/NotFound.vue";
import RoomPage from "@/views/RoomPage.vue";
import config from "@/config";
import EditorPage from "@/views/EditorPage.vue";
import MyPuzzles from "@/views/MyPuzzles.vue";
import Catalogue from "@/views/Catalogue.vue";

const router = createRouter({
  history: createWebHistory(config.baseUrl),
  routes: [
    {
      path: "/",
      component: Catalogue,
    },
    {
      path: "/404",
      component: NotFound,
    },
    {
      path: "/room/:token",
      component: RoomPage,
      props: true,
      meta: { isFullScreen: true },
    },
    { path: "/editor", component: EditorPage },
    {
      path: "/puzzle/:id",
      component: () => import("@/views/PuzzleDetail.vue"),
      props: true,
    },
    { path: "/my-puzzles", component: MyPuzzles },
    { path: "/login", component: Login },
    {
      path: "/:pathMatch(.*)*",
      redirect: "/404",
    },
  ],
});

import { useUserStore } from "../stores/user";

router.beforeEach(async (to, from, next) => {
  const userStore = useUserStore();
  await userStore.fetchUser();
  next();
});

export default router;
