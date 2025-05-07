
import { join } from 'node:path';
import { createReadStream } from 'node:fs';
import { access, constants, readFile, writeFile, rename } from 'node:fs/promises';
import { file } from 'tmp-promise';
import { BLOB_PATH } from "./config.js";
import { publicAPIAgent } from './at.js';

export async function ensureBlob (cid, did, agent) {
  if (!agent) agent = publicAPIAgent;
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

export async function getBlob (cid, did, agent, mode = 'content') {
  if (!agent) agent = publicAPIAgent;
  const ok = await ensureBlob(cid, did, agent);
  if (mode === 'head') return ok;
  if (!ok) throw new Error(`Coudn't get blob for ${cid} (${did})`);
  if (mode === 'stream') return createReadStream(join(BLOB_PATH, cid));
  return await readFile(join(BLOB_PATH, cid));
}

// body should be a ReadableStream but it might be anything that writeFile can handle.
export async function saveBlob (body, cid, agent) {
  if (!agent) agent = publicAPIAgent;
  const { path, cleanup } = await file();
  await writeFile(path, body);
  const rs = createReadStream(path);
  const uploaded = await agent.com.atproto.repo.uploadBlob(rs, { encoding: 'application/octet-stream' });
  const pdsCID = uploaded.data.blob.ref.toString();
  if (cid && pdsCID !== cid) throw new Error(`Client CID (${cid}) does not match PDS CID (${pdsCID})`);
  await rename(path, join(BLOB_PATH, pdsCID));
  cleanup();
  return pdsCID;
}
