
import { atom } from "nanostores";
import makeTileHasher from "../../shared/tile-hash.js";
import parseATURI from "../../shared/at-uri.js";

const tileHash = makeTileHasher(window.crypto);

// We'll want something more sophisticated later
const manifestCache = {};

export async function urlForTile (tile) {
  const { did, tid } = parseATURI(tile.uri);
  // return `https://${did.replace(/:/g, '.')}.${tid}.tile.${window.location.hostname}/`;
  // return `https://${await tileHash(did, tid)}.tile.${window.location.hostname}/`;
  return `https://tile.${window.location.hostname}/${await tileHash(did, tid)}/`;
}

export async function originForTile (tile) {
  return (await urlForTile(tile)).replace(/\/$/, '');
}

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
    const res = await fetch(`/api/manifest?${new URLSearchParams({ url: uri })}`);
    if (res.ok) {
      const man = (await res.json())?.data || {};
      $manifest.set(man);
      manifestCache[uri] = man;
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

export function getCachedManifest (uri) {
  return manifestCache[uri];
}
