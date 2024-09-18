
import { atom, onMount } from "nanostores";

let sse;

export const $timeline = atom([]);
export const $timelineLoading = atom(true);
export const $timelineError = atom(false);

export async function refreshTimeline () {
  $timelineLoading.set(true);
  const res = await fetch(`/api/timeline`);
  const data = await res.json();
  if (res.status !== 200) {
    const { error } = data;
    $timelineError.set(error || 'Unknown error');
    $timeline.set([]);
  }
  else {
    $timelineError.set(false);
    $timeline.set(data.data);
  }
  $timelineLoading.set(false);
}

onMount($timeline, async () => {
  await refreshTimeline();
  sse = new EventSource('/api/events');
  sse.addEventListener('new-tile', async () => {
    await refreshTimeline();
  });
});
