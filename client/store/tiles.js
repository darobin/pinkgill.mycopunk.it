
import { atom } from "nanostores";
import makeTileHasher from "../../shared/tile-hash.js";
import parseATURI from "../../shared/at-uri.js";

const tileHash = makeTileHasher(window.crypto);

// We'll want something more sophisticated later
const manifestCache = {};
const tilesPerWindow = new Map();

export function addActiveTile (tile, win) {
  tilesPerWindow.set(win, tile);
}
export function removeActiveTile (win) {
  tilesPerWindow.delete(win);
}
export function getMatchingActiveTile (win) {
  return tilesPerWindow.get(win);
}

export async function urlForTile (uri) {
  const { did, tid } = parseATURI(uri);
  // return `https://${did.replace(/:/g, '.')}.${tid}.tile.${window.location.hostname}/`;
  // return `https://${await tileHash(did, tid)}.tile.${window.location.hostname}/`;
  return `https://tile.${window.location.hostname}/${await tileHash(did, tid)}/`;
}

export async function originForTile (tile) {
  return (await urlForTile(tile)).replace(/\/$/, '');
}

// XXX these could use some refactoring love to unify and expose them more cleanly to elements
export function makeTileStores () {
  const $manifest = atom({});
  const $manifestLoading = atom(true);
  const $manifestError = atom(false);

  const loadManifest = async (uri) => {
    $manifestLoading.set(true);
    if (manifestCache[uri]) {
      $manifest.set(manifestCache[uri]);
      $manifestError.set(false);
      $manifestLoading.set(false);
      return;
    }
    const man = await getManifest(uri);
    if (man) {
      $manifest.set(man);
      $manifestError.set(false);
    }
    else {
      $manifest.set({});
      $manifestError.set(`Loading error.`);
    }
    $manifestLoading.set(false);
  };

  return {
    $manifest,
    $manifestLoading,
    $manifestError,
    loadManifest,
  };
}

export function makeTileUploaderStores () {
  const $uploadDone = atom(false);
  const $uploadLoading = atom(true);
  const $uploadError = atom(false);

  const uploadTile = async (body) => {
    $uploadLoading.set(true);
    const res = await fetch('/api/tile', {
      method: 'post',
      body,
    });

    $uploadDone.set(true);
    if (res.ok) {
      $uploadError.set(false);
    }
    else {
      $uploadError.set((await res.json())?.error || 'Unknown error');
    }
    $uploadLoading.set(false);
  };

  return {
    $uploadDone,
    $uploadLoading,
    $uploadError,
    uploadTile,
  };
}

export function makeInstantiationStores () {
  const $instanceDone = atom(false);
  const $instanceLoading = atom(true);
  const $instanceError = atom(false);

  const createInstance = async (body) => {
    $instanceLoading.set(true);
    // XXX
    // Something somewhere posted this as string [Object object] instead of the real thing
    const res = await fetch('/api/instance', {
      method: 'post',
      body,
    });

    $instanceDone.set(true);
    if (res.ok) {
      $instanceError.set(false);
    }
    else {
      $instanceError.set((await res.json())?.error || 'Unknown error');
    }
    $instanceLoading.set(false);
  };

  return {
    $instanceDone,
    $instanceLoading,
    $instanceError,
    createInstance,
  };
}

export async function getManifest (uri) {
  if (manifestCache[uri]) return manifestCache[uri];
  const res = await fetch(`/api/manifest?${new URLSearchParams({ url: uri })}`);
  if (res.ok) {
    const man = (await res.json())?.data;
    manifestCache[uri] = man;
    return man || {};
  }
}

export function getCachedManifest (uri) {
  return manifestCache[uri];
}
