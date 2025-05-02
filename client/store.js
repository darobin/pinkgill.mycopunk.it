
import { deepMap, computed } from "nanostores";
import { createRouter, openPage } from "@nanostores/router";
import client from "./api.js";

// All resource stores have the same semantics:
//  - loading: whether the resource is being loaded (show progress)
//  - error: whether there was an error loading
//  - status: HTTP response code
//  - available: this resource is potentially available (but may be loading, may fail)
//  - data: whatever was loaded
const resourceDefaults = { loading: false, error: false, status: 0, available: false, dirty: false, data: null };
class Resource {
  #store;
  #options;
  constructor (options) {
    this.#options = options || {};
    this.#store = deepMap({ ...resourceDefaults, ...(options?.defaults || {}) });
    this.#store.listen((s, old, key) => {
      if (!/^data/.test(key)) return;
      this.#store.setKey('dirty', true);
    });
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
  markSaved () {
    this.#store.setKey('dirty', false);
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
export function goto (route, params, search) {
  openPage($router, route, params, search);
}

// ~~ Profile resource
export const profile = new Resource({ load: 'getCurrentProfile', defaults: { available: true } });
export async function loadProfile () {
  await profile.load();
}
export const isLoggedIn = computed(profile.store, p => !!p?.data && !p.loading);

// ~~ Actor profile resource (for the profile page)
export const actorProfile = new Resource({ load: 'getActorProfile' });

// ~~ Current tile for creation, editing, form…
// IMPORTANT NOTE:
// The `resources` field is a map, but maps are really painful to deal with
// in forms, with a virtual DOM, etc. So we map it to an array both ways.
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
    resources: [],
    prev: null,
  }},
});
function realTileFromCurrent (dr) {
  const real = structuredClone(currentTile.store.get()?.data);
  Object.keys(real).forEach(k => {
    if (Array.isArray(real[k]) && !real[k].length) delete real[k];
    if (real[k] == null) delete real[k];
  });
  const res = {};
  (real.resources || []).forEach(r => {
    res[r.path] = { src: r.src, mediaType: r.mediaType };
  });
  if (!res['/'] && dr && res[dr]) res['/'] = structuredClone(res[dr]);
  real.resources = res;
  return real;
}
export function updateCurrentTile (key, value) {
  currentTile.store.setKey(`data.${key}`, value);
}
export function addResourceToCurrentTile () {
  const s = currentTile.store.get();
  const cur = s.data?.resources || [];
  currentTile.store.setKey(`data.resources`, [...cur, { path: '/new', src: null, mediaType: null } ]);
}
export function removeResourceFromCurrentTile (idx) {
  const s = currentTile.store.get();
  const cur = [...(s.data?.resources || [])];
  cur.splice(idx, 1);
  currentTile.store.setKey(`data.resources`, cur);
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
export function validateCurrentTile (dr) {
  const tile = realTileFromCurrent(dr);
  const report = { count: 0, errors: {} };
  const error = (k, msg) => {
    report.count++;
    if (!report.errors[k]) report.errors[k] = [];
    report.errors[k].push(msg);
  };
  // name
  if (!tile.name) error('name', 'Required')
  if (tile.name?.length > 100) error('name', 'Longer than 100')
  // description
  if (tile.description?.length > 300) error('description', 'Longer than 300')
  // background_color — no checks
  // icons
  if (tile.icons) {
    const { src } = tile.icons[0] || {};
    if (!src) error('icons[0]', 'No source');
    const res = tile.resources[src];
    if (!res) error('icons[0]', 'Source does not match a resource');
    if (res && !/^image\//.test(res.mediaType)) error('icons[0]', 'Source should point to an image');
  }
  // sizing
  if (tile.sizing) {
    ['width', 'height'].forEach(k => {
      if (!tile.sizing[k]) error(`sizing`, `${k} is required and must be positive`);
      if (!/^\d+$/.test(tile.sizing[k])) error(`sizing`, `${k} must be a positive number`);
    });
  }
  // wishes
  const canSet = new Set(['instantiate']);
  if (tile.wishes) {
    tile.wishes.forEach((w, idx) => {
      if (!w.can) error(`wishes[${idx}]`, `can is required`);
      if (w.can && !canSet.has(w.can)) error(`wishes[${idx}]`, `${w.can} is not a valid can value`);
    });
  }
  // resources
  if (!Object.keys(tile.resources || {}).length) error('resources', 'Required');
  Object.entries(tile.resources || {}).forEach(([k, r]) => {
    if (!/^\//.test(k)) error(`resources`, `Path "${k}" needs to start with a '/'"`);
    if (!r.mediaType) error(`resources`, `Media type required for "${k}"`);
    if (!r.src?.$link) error(`resources`, `Source required for "${k}"`);
  });
  if (Object.keys(tile.resources || {}).length && !tile.resources['/']) error('default_resource', 'A default resource must be specified');
  return report;
}
// IMPORTANT: this assumes that validation has already happened
export async function saveCurrentTile (dr) {
  const tile = realTileFromCurrent(dr);
  const r = await client.uploadTile({ tile });
  if (r.ok) {
    currentTile.markSaved();
    return r.data.cid; // we also get an at-uri back but don't need it
  }
  throw new Error(r.error);
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
