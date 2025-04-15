
import { deepMap } from "nanostores";
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
  #options;
  constructor (options) {
    this.#options = options || {};
    this.#store = deepMap({ ...resourceDefaults, ...(options?.defaults || {}) });
  }
  async load (prm) {
    if (!this.#options.load) throw new Error(`Cannot load() a resource with no load endpoint.`);
    this.#store.setKey('loading', true);
    this.#store.setKey('available', true);
    const r = await client[this.#options.load](prm);
    this.#store.setKey('status', r.status);
    if (r.ok) {
      this.#store.setKey('error', false);
      this.#store.setKey('data', r.data);
    }
    else {
      this.#store.setKey('error', r.error || 'Unknown error');
      this.#store.setKey('data', (typeof this.#options?.data !== 'undefined') ? this.#options.data : null);
    }
    this.#store.setKey('loading', false);
  }
  get store () {
    return this.#store;
  }
  reset () {
    this.#store.set({ ...resourceDefaults, ...(this.#options.defaults || {}) });
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
export const profile = new Resource({ load: 'getCurrentProfile', defaults: { available: true } });
export async function loadProfile () {
  await profile.load();
}

// ~~ Actor profile resource (for the profile page)
export const actorProfile = new Resource({ load: 'getActorProfile' });

// ~~ Current tile for creation, editing, form…
export const currentTile = new Resource({
  load: 'getTile',
  save: 'uploadTile',
  delete: 'deleteTile',
  defaults: { data: {
    name: null,
    description: null,
    background_color: null,
    icons: [],
    sizing: null,
    wishes: [],
    resources: {},
    prev: null,
  }},
});
export function updateCurrentTile (key, value) {
  currentTile.store.setKey(`data.${key}`, value);
}
export function addWishToCurrentTile () {
  const s = currentTile.store.get();
  const cur = s.data?.wishes || [];
  currentTile.store.setKey(`data.wishes`, [...cur, { can: null }]);
}
export function removeWishfromCurrentTile (idx) {
  const s = currentTile.store.get();
  const cur = [...(s.data?.wishes || [])];
  cur.splice(idx, 1);
  currentTile.store.setKey(`data.wishes`, cur);
}

// ~~ Ok, let's drive these resources from the route
const profileSet = new Set(['profile', 'tile']);
const tileSet = new Set(['edit', 'tile']);
$router.subscribe(async (val, old) => {
  const { route, params } = val;
  const { route: oldRoute, params: oldParams = {} } = old || {};
  // handle actor profile
  if (profileSet.has(route)) {
    const actor = params.handle;
    if (!profileSet.has(oldRoute) || actor !== oldParams.actor) await actorProfile.load({ actor });
  }
  // current tile (new, edit, show)
  if (route === 'new' && oldRoute !== 'new') currentTile.reset();
  else if (tileSet.has(route)) {
    const { cid } = params;
    if (!tileSet.has(oldRoute) || cid !== oldParams.cid) await currentTile.load({ cid });
  }
});
