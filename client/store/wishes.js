
import { atom } from "nanostores";

export const $activeWish = atom({});

export async function grantWish (wish, tile) {
  console.warn(`granting`, wish, tile);
  $activeWish.set({ wish, tile });
}

export function stopWishing () {
  $activeWish.set({});
}
