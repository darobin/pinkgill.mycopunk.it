
import { atom, onMount } from "nanostores";
import sse from "../lib/sse.js";

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

onMount($installs, async () => {
  await refreshInstalls();
  sse.addEventListener('install-change', async () => {
    await refreshInstalls();
  });
});
