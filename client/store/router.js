
import { computed } from "nanostores";
import { $isLoggedIn, $loginLoading } from "./identity.js";
import { createRouter } from "../lib/router.js";

export const $router = createRouter(
  {
    home: '/',
    login: '/login',
  },
  {
    notFound: '/404',
  }
);

export const $computedRoute = computed(
  [$router, $isLoggedIn, $loginLoading],
  (router, isLoggedIn, loginLoading) => {
    if (loginLoading) return 'loading';
    if (!isLoggedIn) return 'login';
    return router.route;
  }
);
