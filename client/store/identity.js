
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
    // const json = await res.text();
    // console.warn(`TEXT`, json);
    // const { data } = JSON.parse(json);
    // console.warn(`JSON`, data);
    // $identity.set(data);
    // console.warn(await res.text());
    $identity.set((await res.json())?.data);
  }
  $loginLoading.set(false);
}
