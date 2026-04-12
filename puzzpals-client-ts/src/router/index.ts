import { createRouter, createWebHistory } from "vue-router";

import LoginPage from "@/views/LoginPage.vue";
import NotFound from "@/views/NotFound.vue";
import RoomPage from "@/views/RoomPage.vue";
import config from "@/config";
import EditorPage from "@/views/EditorPage.vue";
import MyPuzzles from "@/views/MyPuzzles.vue";
import CataloguePage from "@/views/CataloguePage.vue";
import PuzzleDetail from "@/views/PuzzleDetail.vue";

const router = createRouter({
  history: createWebHistory(config.baseUrl),
  routes: [
    {
      path: "/",
      component: CataloguePage,
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
    {
      path: "/editor",
      component: EditorPage,
    },
    {
      path: "/puzzle/:id",
      component: PuzzleDetail,
      props: true,
    },
    {
      path: "/my-puzzles",
      component: MyPuzzles,
    },
    {
      path: "/login",
      component: LoginPage,
    },
    {
      path: "/:pathMatch(.*)*",
      redirect: "/404",
    },
  ],
});

export default router;
