import { createRouter, createWebHistory } from "vue-router";

import Home from "@/views/Home.vue";
import NotFound from "@/views/NotFound.vue";
import RoomPage from "@/views/RoomPage.vue";
import config from "@/config";
import EditorPage from "@/views/EditorPage.vue";
import Catalogue from "@/views/Catalogue.vue";

const router = createRouter({
  history: createWebHistory(config.baseUrl),
  routes: [
    {
      path: "/",
      component: Home,
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
      path: "/catalogue",
      component: Catalogue,
    },
    {
      path: "/:pathMatch(.*)*",
      redirect: "/404",
    },
  ],
});

export default router;
