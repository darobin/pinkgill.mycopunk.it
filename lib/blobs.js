
import { join } from 'node:path';
import { access, constants, readFile, writeFile, rename } from 'node:fs/promises';
import { AtpAgent } from '@atproto/api';
import { file } from 'tmp-promise';
import { BLOB_PATH } from "./config.js";
import { clean } from 'nanostores';
import { createReadStream } from 'node:fs';

export async function ensureBlob (cid, did, agent) {
  if (!agent) agent = new AtpAgent({ service: 'https://bsky.social' });
  const fn = join(BLOB_PATH, cid);
  try {
    await access(fn, constants.R_OK);
    return true;
  }
  catch {
    const { success, data } = await agent.com.atproto.sync.getBlob({ cid, did });
    if (success) {
      await writeFile(fn, data);
      return true;
    }
    else {
      console.warn(`Coudn't fetch blob for ${cid} (${did})`);
      return false;
    }
  }
}

export async function hasLocalBlob (cid) {
  const fn = join(BLOB_PATH, cid);
  try {
    await access(fn, constants.R_OK);
    return true;
  }
  catch {
    return false;
  }
}

export async function getBlob (cid, did, agent) {
  const ok = await ensureBlob(cid, did, agent);
  if (!ok) throw new Error(`Coudn't get blob for ${cid} (${did})`);
  return await readFile(join(BLOB_PATH, cid));
}

// body should be a ReadableStream but it might be anything that writeFile can handle.
export async function saveBlob (body, cid, agent) {
  const { path, cleanup } = await file();
  await writeFile(path, body);
  const rs = createReadStream(path);
  const uploaded = await agent.com.atproto.repo.uploadBlob(rs, { encoding: 'application/octet-stream' });
  const pdsCID = uploaded.data.blob.ref.toString();
  if (cid && pdsCID !== cid) throw new Error(`Client CID (${cid}) does not match PDS CID (${pdsCID})`);
  await rename(path, join(BLOB_PATH, cid));
  cleanup();
  return pdsCID;
}
