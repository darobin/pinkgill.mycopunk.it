
import { map } from "nanostores";
import bodify from "../lib/bodify";

const defaultUploadState = { loading: true, done: false, error: false };
export const $tileUploader = map(defaultUploadState);

export async function uploadTile (body) {
  $tileUploader.setKey('loading', true);
  const res = await fetch('/api/tile', bodify(body, { method: 'post' }));
  $tileUploader.setKey('done', true);
  if (res.ok) $tileUploader.setKey('error', false);
  else $tileUploader.setKey('loading', (await res.json())?.error || 'Unknown error');
  $tileUploader.setKey('loading', false);
}

export function resetTileUploader () {
  $tileUploader.set(defaultUploadState);
}
