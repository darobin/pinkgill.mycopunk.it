
import { computed } from "nanostores";
import { $isLoggedIn, $loginLoading } from "./identity.js";
import { createRouter, openPage } from "../lib/router.js";

export const $router = createRouter(
  {
    home: '/',
    login: '/login',
    user: '/user/:handle',
    tile: '/tile/:hash',
  },
  {
    notFound: '/404',
  }
);

export function goto (route, params) {
  openPage($router, route, params);
}

export const $computedRoute = computed(
  [$router, $isLoggedIn, $loginLoading],
  (router, isLoggedIn, loginLoading) => {
    if (loginLoading) return { route: 'loading', params: {} };
    if (!isLoggedIn) return { route: 'login', params: {} };
    return router;
  }
);
