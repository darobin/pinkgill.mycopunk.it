
import { atom } from "nanostores";

export const $isLoggedIn = atom(false);
export const $identity = atom(null);
export const $loginLoading = atom(true);

export async function loadIdentity () {
  $loginLoading.set(true);
  const res = await fetch(`/api/identity`);
  if (res.status !== 200) {
    $isLoggedIn.set(false);
    $identity.set(null);
  }
  else {
    $isLoggedIn.set(true);
    $identity.set((await res.json())?.data);
  }
  $loginLoading.set(false);
}
