
import { atom, map } from "nanostores";
import { $computedRoute } from "./router.js";
import apiToStore from "../lib/api-store.js";
import makeTileHasher from "../../shared/tile-hash.js";
import parseATURI from "../../shared/at-uri.js";
import bodify from "../lib/bodify.js";

const defaultTile = { loading: true };
export const $curTile = map(defaultTile);

$computedRoute.subscribe(async ({ route, params }) => {
  if (route !== 'tile' || !params.hash) return;
  $curTile.setKey('loading', true);
  await apiToStore($curTile, `/api/tile/${params.hash}`);
});

const tileHash = makeTileHasher(window.crypto);

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
