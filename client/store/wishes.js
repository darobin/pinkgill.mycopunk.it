
import { atom } from "nanostores";
import { getManifest } from "./tiles.js";

export const $activeWish = atom({});

export async function grantWish (wish, tileURI) {
  const manifest = await getManifest(tileURI);
  console.warn(`granting`, wish, tileURI, manifest);
  $activeWish.set({ wish, tileURI, manifest });
}

export function stopWishing () {
  $activeWish.set({});
}
