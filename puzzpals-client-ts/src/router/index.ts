import { createRouter, createWebHistory } from "vue-router";

import NotFound from "@/views/NotFound.vue";
import RoomPage from "@/views/RoomPage.vue";
import config from "@/config";
import EditorPage from "@/views/EditorPage.vue";
import CataloguePage from "@/views/CataloguePage.vue";

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
      meta: { fullScreen: true },
    },
    {
      path: "/editor",
      component: EditorPage,
    },
    {
      path: "/:pathMatch(.*)*",
      redirect: "/404",
    },
  ],
});

export default router;
