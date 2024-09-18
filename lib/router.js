
import assert from 'node:assert';
import { readFile, rename } from 'node:fs/promises';
import { join } from 'node:path';
import express from "express";
import multer from 'multer2';
import cookieParser from 'cookie-parser';
import { getIronSession } from 'iron-session';
import { Agent } from '@atproto/api';
import { isValidHandle } from '@atproto/syntax';
import { TID } from '@atproto/common';
import { WASMagic } from "wasmagic";
import { COOKIE_SECRET, HOST, UPLOAD_PATH, BLOB_PATH } from "./config.js";
import { getTimeline, getTile, indexEvent } from './db.js';
import makeRel from './rel.js';
import { ids } from './lexicons/lexicons.js';
import { isRecord, validateRecord } from './lexicons/types/space/polypod/pinkgill/tile.js';

const rel = makeRel(import.meta.url);
const upload = multer({ dest: UPLOAD_PATH });
const tileCollection = ids.SpacePolypodPinkgillTile;
const ssePool = new Set();

export default async function createRouter (ctx) {
  const router = express.Router();
  const sessionParams = {
    cookieName: 'pinkgill-sid',
    password: COOKIE_SECRET,
  };
  const magic = await WASMagic.create();

  async function getSessionAgent (req, res, ctx) {
    const session = await getIronSession(req, res, sessionParams);
    if (!session.did) return null;
    try {
      const oauthSession = await ctx.oauthClient.restore(session.did);
      return oauthSession ? new Agent(oauthSession) : null;
    }
    catch (err) {
      ctx.logger.warn({ err }, 'oauth restore failed');
      await session.destroy();
      return null;
    }
  }

  function sendSSEEvent (type, data = {}) {
    if (!ssePool.size) return;
    Array.from(ssePool.values()).forEach(res => {
      res.write(`event: ${type}\ndata: ${JSON.stringify(data)}\n\n`);
    });
  }
  ctx.dbEvents.on('indexed', () => sendSSEEvent('new-tile'));
  setInterval(() => sendSSEEvent('beat'), 10 * 1000);

  // Auth & Identity
  router.get('/client-metadata.json', (req, res) => {
    return res.json(ctx.oauthClient.clientMetadata);
  });
  // - complete session creation
  router.get('/api/oauth/callback', async (req, res) => {
    const params = new URLSearchParams(req.originalUrl.split('?')[1]);
    try {
      const { session } = await ctx.oauthClient.callback(params);
      const clientSession = await getIronSession(req, res, sessionParams);
      assert(!clientSession.did, 'session already exists');
      clientSession.did = session.did;
      await clientSession.save();
    }
    catch (err) {
      ctx.logger.error({ err }, 'oauth callback failed');
      return sendError(res, err.message);
    }
    return res.redirect('/');
  });
  // tiles are served from subdomains
  const rx = new RegExp(`^(.+)\\.tile\\.${HOST.replace(/\./g, '\\.')}$`);
  // console.warn(rx);
  router.use(async (req, res, next) => {
    const host = req.hostname;
    const match = host.match(rx);
    if (!match) return next();
    const parts = match[1].split('.');
    const did = parts.shift();
    const didType = parts.shift();
    const tid = parts.pop();
    const uri = `at://${did}:${didType}:${parts.join('.')}/space.polypod.pinkgill.tile/${tid}`;
    const tile = await getTile(ctx.db, uri);
    if (!tile) return res.status(404).send({ ok: false, error: 'Not found' });
    const rMap = {};
    tile.resources.forEach(({ src, path }) => {
      rMap[path] = { src: src.ref.$link, mediaType: src.mimeType };
    });
    if (!rMap['/'] && rMap['/index.html']) rMap['/'] = rMap['/index.html'];
    let resource = rMap[req.path];
    if (!resource) return res.status(404).send({ ok: false, error: 'Not found' });
    let { mediaType } = resource;
    if (
      (!mediaType || mediaType === 'application/octet-stream') &&
      (/\.html$/.test(req.path) || req.path === '/')
    ) mediaType = 'text/html';
    else if (mediaType === 'application/pinkgill.jayson') mediaType = 'application/json';
    res.type(mediaType);
    // XXX CAUTION: this is incorrect and incomplete, it's just for demo purposes
    res.header('Content-Security-Policy', `default-src 'self' blob: data: 'unsafe-inline'`);
    res.sendFile(resource.src, { root: BLOB_PATH });
  });

  router.use(cookieParser(), (req, res, next) => {
    if (/ngrok-free\.app/.test(req.hostname)) {
      const search = new URLSearchParams([
        ['path', req.originalUrl || '/'],
        ['cookie', req.cookies[sessionParams.cookieName]],
      ]).toString();
      return res.redirect(`https://${HOST}/api/set-cookie?${search}`);
    }
    next();
  });

  router.get('/api/set-cookie', (req, res) => {
    const { path, cookie } = req.query;
    res.cookie(
      sessionParams.cookieName,
      cookie,
      {
        path: '/',
        secure: true,
        httpOnly: true,
        sameSite: 'lax',
      }
    );
    res.redirect(path || '/');
  });
  router.post('/api/login', async (req, res) => {
    const handle = req.body?.handle;
    if (typeof handle !== 'string' || !isValidHandle(handle)) {
      return sendError(res, 'invalid handle');
    }
    try {
      const url = await ctx.oauthClient.authorize(handle, {
        scope: 'atproto transition:generic',
      });
      return res.redirect(url.toString());
    }
    catch (err) {
      ctx.logger.error({ err }, 'oauth authorize failed');
      return sendError(res, err.message || "couldn't initiate login");
    }
  });
  router.post('/api/logout', async (req, res) => {
    const session = await getIronSession(req, res, sessionParams);
    await session.destroy();
    return res.redirect('/');
  });
  router.get('/api/identity', async (req, res) => {
    const session = await getIronSession(req, res, sessionParams);
    if (!session.did) return res.status(401).send({ ok: false });
    const agent = await getSessionAgent(req, res, ctx);
    if (!agent) return res.status(401).send({ ok: false });
    const { data: profileRecord } = await agent.com.atproto.repo.getRecord({
      repo: agent.assertDid,
      collection: 'app.bsky.actor.profile',
      rkey: 'self',
    });
    const handle = await ctx.resolver.resolveDidToHandle(agent.assertDid);
    res.send({ ok: true, data: { handle, did: agent.assertDid, ...profileRecord.value } });
  });

  // Tiles & Timeline
  router.post('/api/tile', upload.array('tile'), async (req, res) => {
    const agent = await getSessionAgent(req, res, ctx);
    if (!agent) return res.status(401).send({ ok: false });
    const resources = [];
    for (let f of req.files) {
      let { originalname: fileName, path } = f;
      fileName = decodeURIComponent(fileName);
      try {
        const file = await readFile(path);
        let encoding = magic.detect(file);
        // If you send JSON to uploadBlob() it gets very unhappy
        if (encoding === 'application/json') encoding = 'application/pinkgill.jayson';
        const uploaded = await agent.com.atproto.repo.uploadBlob(file, { encoding });
        const cid = uploaded.data.blob.ref.toString();
        await rename(path, join(BLOB_PATH, cid));
        resources.push({
          path: fileName,
          // src: { ref: cid, mimeType: uploaded.data.blob.mimeType, size: uploaded.data.blob.size },
          src: uploaded.data.blob, // you really want to use the returned object
        });
      }
      catch (err) {
        ctx.logger.error({ err }, `failed to process file "${fileName}" to blob`);
        return res.status(500).send({ ok: false, error: `Failed to process file "${fileName}": ${err.message}` });
      }
    }
    const record = {
      $type: tileCollection,
      name: req.body?.name,
      resources,
      createdAt: new Date().toISOString(),
    };
    try {
      const putData = {
        repo: agent.assertDid, 
        collection: tileCollection,
        rkey: TID.nextStr(),
        record,
      };
      console.warn(JSON.stringify(putData, null, 2));
      if (!isRecord(record)) return res.status(400).send({ ok: false, error: 'Not a record' });
      const { success, error } = validateRecord(record);
      if (!success) return res.status(400).send({ ok: false, error: error.message });
      console.warn(`Putting to the repo`);
      await agent.com.atproto.repo.putRecord(putData);
      res.send({ ok: true });
      ctx.logger.info(`Successfully uploaded tile "${req.body?.name}"`);
      await indexEvent(ctx.db, {
        record,
        uri: `at://${agent.assertDid}/${tileCollection}/${putData.rkey}`,
        did: putData.repo,
      });
    } 
    catch (err) {
      ctx.logger.warn({ err }, 'Failed to write record');
      return res.status(500).send({ ok: false, error: 'Failed to write record' });
    }
  });

  router.get('/api/timeline', async (req, res) => {
    const tiles = await getTimeline(ctx.db);
    const didHandleMap = await ctx.resolver.resolveDidsToHandles(
      tiles.map((s) => s.authorDid)
    );
    tiles.forEach(t => {
      t.handle = didHandleMap[t.authorDid] || t.authorDid;
    });
    return res.send({ ok: true, data: tiles });
  });

  router.get('/api/events', (req, res) => {
    res.writeHead(200, {
      connection: 'keep-alive',
      'cache-control': 'no-cache',
      'content-type': 'text/event-stream',
    });
    ssePool.add(res);
    res.on('close', () => {
      ssePool.delete(res);
      res.end();
    });
  });

  router.get('/api/manifest', async (req, res) => {
    const { url } = req.query;
    if (!url) return res.status(400).send({ ok: false, error: 'No URL' });
    const tile = await getTile(ctx.db, url);
    if (!tile) return res.status(404).send({ ok: false, error: 'Not found' });
    const manifest = {
      name: tile.name,
    };
    const man = tile.resources.find(({ path }) => path === '/manifest.json');
    if (man) {
      const data = JSON.parse(await readFile(join(BLOB_PATH, man.src.ref.$link)));
      manifest.sizing = data.sizing;
      manifest.wishes = data.wishes;
    }
    res.send({ ok: true, data: manifest });
  });

  router.use(express.static(rel('../public')));
  router.use(express.static(rel('../node_modules/@shoelace-style/shoelace/dist/')));
  return router;
}

function sendError (res, msg) {
  return res.redirect(`/?error=${encodeURIComponent(msg)}`);
}
