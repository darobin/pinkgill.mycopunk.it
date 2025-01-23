
import { map, onMount } from "nanostores";
import { $computedRoute } from "./router.js";
import sse from "../lib/sse.js";

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
  $timeline.setKey('loading', true);
  const res = await fetch(`/api/timeline`);
  const data = await res.json();
  if (res.status !== 200) {
    const { error } = data;
    $timeline.setKey('error', error || 'Unknown error');
    $timeline.setKey('data', []);
  }
  else {
    $timeline.setKey('error', false);
    $timeline.setKey('data', data.data);
  }
  $timeline.setKey('loading', false);
}

onMount($timeline, async () => {
  sse.addEventListener('new-tile', async () => {
    await refreshTimeline();
  });
  sse.addEventListener('deletion-change', async () => {
    await refreshTimeline();
  });
});
