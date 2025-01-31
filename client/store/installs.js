
import { map, onMount } from "nanostores";
import sse from "../lib/sse.js";
import apiToStore from "../lib/api-store.js";

const defaultInstalls = {
  loading: true,
  error: false,
  data: [],
};
export const $installs = map(defaultInstalls);

export async function refreshInstalls () {
  await apiToStore($installs, `/api/installed`);
}

// This is for the install status of a single tile
const defaultInstall = { loading: false, error: false, done: false, data: null };
export function makeInstallStore () {
  return map(defaultInstall);
}
export async function operateInstall ($store, tile, operation) {
  $store.setKey('loading', true);
  const res = await fetch('/api/install', {
    method: 'post',
    body: JSON.stringify({ tile: (typeof tile === 'string') ? tile : tile.uri, operation }),
    headers: { 'content-type': 'application/json' },
  });
  $store.setKey('done', true);
  if (res.ok) $store.setKey('error', false);
  else $store.setKey('error', (await res.json())?.error || 'Unknown error');
  $store.setKey('loading', false);
}
export async function installTile ($store, tile) {
  await operateInstall($store, tile, 'install');
}
export async function uninstallTile ($store, tile) {
  await operateInstall($store, tile, 'uninstall');
}


// Has a manifest with wishes and isn't already installed
export function isInstallable (tile) {
  if (!tile?.manifest?.wishes) return false;
  return !$installs.get()?.data?.find((ins) => ins.tile === tile.uri);
}

onMount($installs, () => {
  refreshInstalls();
  sse.addEventListener('install-change', refreshInstalls);
  return () => {
    sse.removeEventListener('install-change', refreshInstalls);
  };
});
