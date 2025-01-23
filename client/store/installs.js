
import { atom, map, onMount } from "nanostores";
import sse from "../lib/sse.js";
import apiToStore from "../lib/api-store.js";

const defaultInstalls = {
  loading: true,
  error: false,
  data: [],
};
export const $installs = map(defaultInstalls);

export async function refreshTimeline () {
  await apiToStore($installs, `/api/installed`);
}

// XXX
// Here we want a makeInstallableStore that just returns a default store.
// Separately, installTile takes the tile and that store, and updates the
// store. Done.

export function makeInstaller () {
  const $installDone = atom(false);
  const $installLoading = atom(false);
  const $installError = atom(false);

  // { tile: at-uri, operation: install | uninstall }
  const operateInstall = async (tile, operation) => {
    $installLoading.set(true);
    const res = await fetch('/api/install', {
      method: 'post',
      body: JSON.stringify({ tile, operation }),
      headers: { 'content-type': 'application/json' },
    });

    $installDone.set(true);
    if (res.ok) {
      $installError.set(false);
    }
    else {
      $installError.set((await res.json())?.error || 'Unknown error');
    }
    $installLoading.set(false);
  };
  const installTile = async (uri) => {
    await operateInstall(uri, 'install');
  };
  const uninstallTile = async (uri) => {
    await operateInstall(uri, 'uninstall');
  };

  return {
    $installDone,
    $installLoading,
    $installError,
    installTile,
    uninstallTile
  };
}


// Has a manifest with wishes and isn't already installed
export function isInstallable (tile) {
  if (!tile?.manifest?.wishes) return false;
  return !$installs.get().find((ins) => ins.tile === tile.uri);
}

onMount($installs, async () => {
  await refreshInstalls();
  sse.addEventListener('install-change', async () => {
    await refreshInstalls();
  });
});
