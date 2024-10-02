
import { atom, onMount } from "nanostores";
import sse from "../lib/sse.js";
import { getCachedManifest } from "./tiles.js";

export const $installs = atom([]);
export const $installsLoading = atom(true);
export const $installsError = atom(false);

export async function refreshInstalls () {
  $installsLoading.set(true);
  const res = await fetch(`/api/installed`);
  const data = await res.json();
  if (res.status !== 200) {
    const { error } = data;
    $installsError.set(error || 'Unknown error');
    $installs.set([]);
  }
  else {
    $installsError.set(false);
    $installs.set(data.data);
  }
  $installsLoading.set(false);
}

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
  const manifest = getCachedManifest(tile.uri);
  if (!manifest?.wishes) return false;
  return !$installs.get().find((ins) => ins.tile === tile.uri);
}

onMount($installs, async () => {
  await refreshInstalls();
  sse.addEventListener('install-change', async () => {
    await refreshInstalls();
  });
});
