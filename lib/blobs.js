
import { join } from 'node:path';
import { access, constants, readFile, writeFile } from 'node:fs/promises';
import { AtpAgent } from '@atproto/api';
import { BLOB_PATH } from "./config.js";

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

export async function getBlob (cid, did, agent) {
  const ok = await ensureBlob(cid, did, agent);
  if (!ok) throw new Error(`Coudn't get blob for ${cid} (${did})`);
  return await readFile(join(BLOB_PATH, cid));
}
