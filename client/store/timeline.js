
import { map, onMount } from "nanostores";
import { $computedRoute } from "./router.js";
import sse from "../lib/sse.js";
import apiToStore from "../lib/api-store.js";

const defaultTimeline = {
  loading: true,
  error: false,
  data: [],
};
export const $timeline = map(defaultTimeline);

$computedRoute.subscribe(async ({ route }) => {
  if (route !== 'home') return;
  await refreshTimeline();
});

export async function refreshTimeline () {
  await apiToStore($timeline, `/api/timeline`);
}

onMount($timeline, async () => {
  sse.addEventListener('new-tile', async () => {
    await refreshTimeline();
  });
  sse.addEventListener('deletion-change', async () => {
    await refreshTimeline();
  });
});
