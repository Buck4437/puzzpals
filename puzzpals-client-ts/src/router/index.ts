import { createRouter, createWebHistory } from "vue-router";

import Home from "@/views/Home.vue";
import LoginPage from "@/components/LoginPage.vue";
import NotFound from "@/views/NotFound.vue";
import RoomPage from "@/views/RoomPage.vue";
import config from "@/config";
import Editor from "@/views/Editor.vue";

const router = createRouter({
  history: createWebHistory(config.baseUrl),
  routes: [
    { path: "/", component: Home },
    { path: "/login", component: LoginPage },
    { path: "/404", component: NotFound },
    { path: "/room/:token", component: RoomPage, props: true },
    { path: "/editor", component: Editor },
    { path: "/catalogue", component: () => import("@/views/Catalogue.vue") },
  ],
});

export default router;
