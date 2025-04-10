
import { map } from "nanostores";
import { createRouter, openPage } from "@nanostores/router";
import client from "./api.js";

// All resource stores have the same semantics:
//  - loading: whether the resource is being loaded (show progress)
//  - error: whether there was an error loading
//  - status: HTTP response code
//  - available: this resource is potentially available (but may be loading, may fail)
//  - data: whatever was loaded
const resourceDefaults = { loading: false, error: false, status: 0, available: false, data: null };
class Resource {
  #store;
  #defaults;
  #method;
  constructor (method, defaults = {}) {
    this.#defaults = defaults;
    this.#method = method;
    this.#store = map({ ...resourceDefaults, ...defaults });
  }
  async load (prm) {
    this.#store.setKey('loading', true);
    this.#store.setKey('available', true);
    const r = await client[this.#method](prm);
    this.#store.setKey('status', r.status);
    if (r.ok) {
      this.#store.setKey('error', false);
      this.#store.setKey('data', r.data);
    }
    else {
      this.#store.setKey('error', r.error || 'Unknown error');
      this.#store.setKey('data', (typeof this.#defaults.data !== 'undefined') ? this.#defaults.data : null);
    }
    this.#store.setKey('loading', false);
  }
  get store () {
    return this.#store;
  }
  reset () {
    this.#store.set({ ...resourceDefaults, ...this.#defaults });
  }
}

// This is the store.
// It's driven from route+logged in state, and then everything else is resources.
// We don't use a computed route.
// We listen to the router+profile and use that to make the other calls that
// control the other routers.
// Search is driven from query params (wherever it appears).

// ~~ Router
export const $router = createRouter(
  {
    home: '/',
    login: '/login',
    new: '/new',
    edit: '/edit/:cid',
    tile: '/profile/:handle/tile/:cid',
    profile: '/profile/:handle',
  },
  {
    notFound: '/404',
  }
);
export function goto (route, params) {
  openPage($router, route, params);
}

// ~~ Profile resource
export const profile = new Resource('getCurrentProfile', { available: true });
export async function loadProfile () {
  await profile.load();
}

// ~~ Actor profile resource (for the profile page)
export const actorProfile = new Resource('getActorProfile');

// Ok, let's drive these resources from the route
const profileSet = new Set(['profile', 'tile']);
$router.subscribe(async (val, old) => {
  const { route, params } = val;
  const { route: oldRoute, params: oldParams = {} } = old || {};
  // handle actor profile
  if (profileSet.has(route)) {
    const actor = params.handle;
    if (!profileSet.has(oldRoute) || actor !== oldParams.actor) await actorProfile.load({ actor });
  }
});
