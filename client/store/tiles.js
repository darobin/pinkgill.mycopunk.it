
import { atom } from "nanostores";

// We'll want something more sophisticated later
const manifestCache = {};
const tileCache = {};

export function urlForTile (tile) {
  const [did, , tid] = tile.uri.replace(/^at:\/\//, '').split('/');
  return `https://${did.replace(/:/g, '.')}.${tid}.tile.${window.location.hostname}/`;
}

export function originForTile (tile) {
  return urlForTile(tile).replace(/\/$/, '');
}

export function makeTileStores () {
  const $manifest = atom({});
  const $manifestLoading = atom(true);
  const $manifestError = atom(false);

  const loadManifest = async (tile) => {
    tileCache[tile.uri] = tile;
    $manifestLoading.set(true);
    const { uri } = tile;
    if (manifestCache[uri]) {
      $manifest.set(await res.json()?.data || {});
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

export function getCachedManifest (tile) {
  return manifestCache[tile.uri];
}
