
import { atom } from "nanostores";
import makeTileHasher from "../../shared/tile-hash.js";
import parseATURI from "../../shared/at-uri.js";
import bodify from "../lib/bodify.js";

const tileHash = makeTileHasher(window.crypto);

// We'll want something more sophisticated later.
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

export async function urlForTile (uriOrTile) {
  const { did, tid } = parseATURI((typeof uriOrTile === 'string') ? uriOrTile : uriOrTile.uri);
  // return `https://${did.replace(/:/g, '.')}.${tid}.tile.${window.location.hostname}/`;
  // return `https://${await tileHash(did, tid)}.tile.${window.location.hostname}/`;
  return `https://tile.${window.location.hostname}/${await tileHash(did, tid)}/`;
}

export async function originForTile (tile) {
  return (await urlForTile(tile)).replace(/\/$/, '');
}

export async function deleteTile (tile) {
  const { uri } = tile;
  const res = await fetch(`/api/tile?${new URLSearchParams({ url: uri })}`, { method: 'delete' });
  return res.ok;
}

export function makeInstantiationStores () {
  const $instanceDone = atom(false);
  const $instanceLoading = atom(true);
  const $instanceError = atom(false);

  const createInstance = async (body) => {
    $instanceLoading.set(true);
    const res = await fetch('/api/instance', bodify(body, { method: 'post' }));

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
