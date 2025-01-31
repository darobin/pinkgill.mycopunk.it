
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

export async function refreshTimeline () {
  await apiToStore($timeline, `/api/timeline`);
}

$computedRoute.subscribe(async ({ route }) => {
  if (route !== 'home') return;
  await refreshTimeline();
});

onMount($timeline, () => {
  sse.addEventListener('new-tile', refreshTimeline);
  sse.addEventListener('deletion-change', refreshTimeline);
  return () => {
    sse.removeEventListener('new-tile', refreshTimeline);
    sse.removeEventListener('deletion-change', refreshTimeline);
  };
});
