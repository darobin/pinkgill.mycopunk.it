import { env } from 'node:process';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import Module from "node:module";

const require = Module.createRequire(import.meta.url);
import makeRel from './rel.js';

const rel = makeRel(import.meta.url);

export const IS_PROD = (env.NODE_ENV === 'production');
export const PORT = 3084;
export const HOST = IS_PROD
  ? 'pinkgill.mycopunk.it'
  : 'pinkgill.bast'
;
let authDomain = HOST;
if (!IS_PROD) {
  const ngrok = require('@ngrok/ngrok');
  const authtoken = (await readFile(rel('../ngrok.token'), 'utf-8')).replace(/\s+/g, '');
  const listener = await ngrok.forward({ addr: PORT, authtoken });
  const url = listener.url();
  // console.warn(`ngork URL: ${url}`);
  authDomain = new URL(url).hostname;
}

export const AUTH_HOST = authDomain;
export const COOKIE_SECRET = IS_PROD 
  ? await readFile('/var/www/pinkgill.secret', 'utf-8') 
  : await readFile(rel('../pinkgill.secret'), 'utf-8') 
;
export const NGROK_TOKEN = IS_PROD 
  ? null 
  : await readFile(rel('../ngrok.token')) 
;
export const DATA_PATH = IS_PROD ? '/var/www/pinkgill.data' : rel('../data');
export const DB_PATH = join(DATA_PATH, 'db.sqlite');
export const UPLOAD_PATH = join(DATA_PATH, 'uploads');
export const BLOB_PATH = join(DATA_PATH, 'blobs');
export const CURSOR_PATH = join(DATA_PATH, 'cursor.json');
