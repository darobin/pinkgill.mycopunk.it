
import assert from 'node:assert';
import crypto from 'node:crypto';
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
import mime from 'mime-types';
import { COOKIE_SECRET, HOST, UPLOAD_PATH, BLOB_PATH } from "./config.js";
import { ensureBlob, getBlob } from './blobs.js';
import { getTimeline, getTile, indexEvent, installTile, uninstallTile, getInstalls, deleteTile, getTiles } from './db.js';
import makeRel from './rel.js';
import { ids } from './lexicons/lexicons.js';
import { isRecord as isTileRecord, validateRecord as validateTileRecord } from './lexicons/types/space/polypod/pinkgill/tile.js';
import { isRecord as isInstallRecord, validateRecord as validateInstallRecord } from './lexicons/types/space/polypod/pinkgill/install.js';
import { isRecord as isInstanceRecord, validateRecord as validateInstanceRecord } from './lexicons/types/space/polypod/pinkgill/instance.js';
import { isRecord as isDeleteRecord, validateRecord as validateDeleteRecord } from './lexicons/types/space/polypod/pinkgill/delete.js';
import invited from './invited.js';
import makeTileHasher from '../shared/tile-hash.js';
import parseATURI from '../shared/at-uri.js';

const rel = makeRel(import.meta.url);
const tileHash = makeTileHasher(crypto);
const upload = multer({ dest: UPLOAD_PATH });
const tileCollection = ids.SpacePolypodPinkgillTile;
const installCollection = ids.SpacePolypodPinkgillInstall;
const deleteCollection = ids.SpacePolypodPinkgillDelete;
const instanceCollection = ids.SpacePolypodPinkgillInstance;
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
      session.destroy();
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
  ctx.dbEvents.on('installed', () => sendSSEEvent('install-change'));
  ctx.dbEvents.on('deleted', () => sendSSEEvent('deletion-change'));
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
  // const rx = new RegExp(`^(.+)\\.tile\\.${HOST.replace(/\./g, '\\.')}$`);
  // !!!! !!!! !!!! !!!! WARNING WARNING WARNING !!!! !!!! !!!! !!!!
  // This is NOT SAFE. To make life easier with wildcard certs, the
  // prototype puts tiles under paths instead of subdomains. A
  // modicum of protection is included, but I wouldn't recommend
  // relying on it.
  // !!!! !!!! !!!! !!!! WARNING WARNING WARNING !!!! !!!! !!!! !!!!
  router.use(async (req, res, next) => {
    // const host = req.hostname;
    // const match = host.match(rx);
    // if (!match) return next();
    if (req.hostname !== `tile.${HOST}`) return next();
    const match = req.path.match(/^\/([a-z0-9]+)(\/.*)$/);
    if (!match) return res.status(404).send({ ok: false, error: 'Nothing here' });
    const [, hash, path] = match;
    // const parts = match[1].split('.');
    // const did = parts.shift();
    // const didType = parts.shift();
    // const tid = parts.pop();
    // const uri = `at://${did}:${didType}:${parts.join('.')}/space.polypod.pinkgill.tile/${tid}`;
    // const tile = await getTile(ctx.db, uri);
    const tile = await getTile(ctx.db, hash);
    if (!tile) return res.status(404).send({ ok: false, error: 'Not found' });
    if (path === '/.well-known/tiles/wishing') {
      res.type('application/javascript');
      res.sendFile('wishing.js', { root: rel('../public/.well-known/tiles/') });
      return;
    }
    const rMap = {};
    if (!Array.isArray(tile.resources)) tile.resources = [];
    tile.resources.forEach(({ src, path }) => {
      rMap[path] = { src: src.ref.$link, mediaType: src.mimeType };
    });
    if (!rMap['/'] && rMap['/index.html']) rMap['/'] = rMap['/index.html'];
    let resource = rMap[path];
    if (!resource) return res.status(404).send({ ok: false, error: 'Not found' });
    let { mediaType } = resource;
    if (
      (!mediaType || mediaType === 'application/octet-stream') &&
      (/\.html$/.test(path) || path === '/')
    ) mediaType = 'text/html';
    else if (mediaType === 'application/pinkgill.jayson') mediaType = 'application/json';
    res.type(mediaType);
    // XXX CAUTION: this is incorrect and incomplete, it's just for demo purposes
    res.header('Clear-Site-Data', `"cookies", "storage"`);
    res.header('Content-Security-Policy', `default-src https://tile.${HOST}/${hash}/ blob: data: 'unsafe-inline'`);
    const { did } = parseATURI(tile.uri);
    await ensureBlob(resource.src, did);
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
    const handle = req.body?.handle?.replace(/^@/, '');
    if (!invited.has(handle)) return sendError(res, 'Pinkgill is invite-only — contact Robin to get in!');
    if (typeof handle !== 'string' || !isValidHandle(handle)) {
      return sendError(res, 'invalid handle');
    }
    try {
      const url = await ctx.oauthClient.authorize(handle, {
        scope: 'atproto transition:generic',
      });
      res.cookie(
        'handle',
        handle,
        {
          path: '/',
          secure: true,
          httpOnly: false,
          sameSite: 'lax',
          expires: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        }
      );
        return res.redirect(url.toString());
    }
    catch (err) {
      ctx.logger.error({ err }, 'oauth authorize failed');
      return sendError(res, err.message || "couldn't initiate login");
    }
  });
  router.post('/api/logout', async (req, res) => {
    const session = await getIronSession(req, res, sessionParams);
    session.destroy();
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
  router.get('/api/tile/:hash', async (req, res) => {
    const agent = await getSessionAgent(req, res, ctx);
    if (!agent) return res.status(401).send({ ok: false });
    const tile = await getTile(ctx.db, req.params.hash);
    const hyd = await hydrateTiles([tile], ctx.db, agent)
    res.send({ ok: hyd.ok, data: hyd.data[0] });
  });
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
        // not very good on stuff like JS
        if (encoding === 'text/plain') encoding = mime.lookup(fileName);
        console.warn(`ENCODING=${encoding}`);
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
      if (!isTileRecord(record)) return res.status(400).send({ ok: false, error: 'Not a record' });
      const { success, error } = validateTileRecord(record);
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

  router.delete('/api/tile', async (req, res) => {
    const agent = await getSessionAgent(req, res, ctx);
    if (!agent) return res.status(401).send({ ok: false });
    const uri = req.query.url;
    console.warn(uri, req.query);
    const { did } = parseATURI(uri);
    if (did !== agent.assertDid) {
      ctx.logger.warn('Cannot delete a tile you did not make.');
      return res.status(500).send({ ok: false, error: 'Cannot delete a tile you did not make.' });
    }
    const record = {
      $type: deleteCollection,
      operation: 'delete',
      tile: uri,
      createdAt: new Date().toISOString(),
    };
    const putData = {
      repo: agent.assertDid,
      collection: deleteCollection,
      rkey: TID.nextStr(),
      record,
    };
    const storeData = {
      record,
      uri: `at://${agent.assertDid}/${deleteCollection}/${putData.rkey}`,
      did: putData.repo,
    };
    try {
      console.warn(JSON.stringify(putData, null, 2));
      if (!isDeleteRecord(record)) return res.status(400).send({ ok: false, error: 'Not a record' });
      const { success, error } = validateDeleteRecord(record);
      if (!success) return res.status(400).send({ ok: false, error: error.message });
      console.warn(`Putting to the repo`);
      await agent.com.atproto.repo.putRecord(putData);
      res.send({ ok: true });
      await deleteTile(ctx.db, storeData);
      ctx.logger.info(`Successfully deleted "${uri}"`);
    }
    catch (err) {
      ctx.logger.warn({ err }, 'Failed to write record');
      return res.status(500).send({ ok: false, error: 'Failed to write record' });
    }
  });

  router.get('/api/timeline', async (req, res) => {
    const agent = await getSessionAgent(req, res, ctx);
    if (!agent) return res.status(401).send({ ok: false });
    const tiles = await getTimeline(ctx.db);
    res.send(await hydrateTiles(tiles, ctx.db, agent));
  });

  router.post('/api/install', async (req, res) => {
    const agent = await getSessionAgent(req, res, ctx);
    if (!agent) return res.status(401).send({ ok: false });
    const { operation, tile } = req.body;
    if (!operation || !tile) return res.status(400).send({ ok: false });
    const record = {
      $type: installCollection,
      operation,
      tile,
      createdAt: new Date().toISOString(),
    };
    const putData = {
      repo: agent.assertDid,
      collection: installCollection,
      rkey: TID.nextStr(),
      record,
    };
    const storeData = {
      record,
      uri: `at://${agent.assertDid}/${installCollection}/${putData.rkey}`,
      did: putData.repo,
    };
    try {
      console.warn(JSON.stringify(putData, null, 2));
      if (!isInstallRecord(record)) return res.status(400).send({ ok: false, error: 'Not a record' });
      const { success, error } = validateInstallRecord(record);
      if (!success) return res.status(400).send({ ok: false, error: error.message });
      if (operation === 'install') {
        console.warn(`Putting to the repo`);
        await agent.com.atproto.repo.putRecord(putData);
        res.send({ ok: true });
        await installTile(ctx.db, storeData);
      }
      else if (operation === 'uninstall') {
        console.warn(`Deleting from the repo`);
        await agent.com.atproto.repo.deleteRecord(putData);
        res.send({ ok: true });
        await uninstallTile(ctx.db, storeData);
      }
      ctx.logger.info(`Successfully ${operation}ed "${tile}"`);
    }
    catch (err) {
      ctx.logger.warn({ err }, 'Failed to write record');
      return res.status(500).send({ ok: false, error: 'Failed to write record' });
    }
  });

  router.post('/api/instance', async (req, res) => {
    const agent = await getSessionAgent(req, res, ctx);
    if (!agent) return res.status(401).send({ ok: false, error: "No session." });
    const { data, tile, name } = req.body;
    console.warn(`/api/instance`, data, tile, req.body);
    if (!data || !tile) return res.status(400).send({ ok: false, error: "Missing data." });
    // XXX name and resources shouldn't be needed for instances (though they could be useful)
    const record = {
      $type: instanceCollection,
      data,
      tile,
      name,
      resources: [],
      createdAt: new Date().toISOString(),
    };
    try {
      const putData = {
        repo: agent.assertDid,
        collection: instanceCollection,
        rkey: TID.nextStr(),
        record,
      };
      console.warn(JSON.stringify(putData, null, 2));
      if (!isInstanceRecord(record)) return res.status(400).send({ ok: false, error: 'Not a record' });
      const { success, error } = validateInstanceRecord(record);
      if (!success) return res.status(400).send({ ok: false, error: error.message });
      console.warn(`Putting to the repo`);
      await agent.com.atproto.repo.putRecord(putData);
      res.send({ ok: true });
      ctx.logger.info(`Successfully stored instance of "${tile}"`);
      const storeData = {
        record,
        uri: `at://${agent.assertDid}/${instanceCollection}/${putData.rkey}`,
        did: putData.repo,
      };
      await indexEvent(ctx.db, storeData);
    }
    catch (err) {
      ctx.logger.warn({ err }, 'Failed to write record');
      return res.status(500).send({ ok: false, error: 'Failed to write record' });
    }
  });

  router.get('/api/installed', async (req, res) => {
    const agent = await getSessionAgent(req, res, ctx);
    if (!agent) return res.status(401).send({ ok: false });
    const installs = await getInstalls(ctx.db, agent.assertDid);
    return res.send(await hydrateInstalls(installs, ctx.db, agent));
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

  // XXX this is all kinds of wrong
  router.get('/api/manifest', async (req, res) => {
    const { url } = req.query;
    if (!url) return res.status(400).send({ ok: false, error: 'No URL' });
    const agent = await getSessionAgent(req, res, ctx);
    if (!agent) return res.status(401).send({ ok: false });
    const { did, tid } = parseATURI(url);
    const tile = await getTile(ctx.db, await tileHash(did, tid));
    if (!tile) return res.status(404).send({ ok: false, error: 'Not found' });
    const manifest = {
      name: tile.name,
      handle: await ctx.resolver.resolveDidToHandle(tile.authorDid),
      authorDid: tile.authorDid,
      createdAt: tile.createdAt,
    };

    const man = Array.isArray(tile.resources) && tile.resources.find(({ path }) => path === '/manifest.json');
    if (man) {
      const data = JSON.parse(await getBlob(man.src.ref.$link, did, agent));
      manifest.sizing = data.sizing;
      manifest.wishes = data.wishes;
    }
    res.send({ ok: true, data: manifest });
  });

  router.use(express.static(rel('../public')));
  router.use(express.static(rel('../node_modules/@shoelace-style/shoelace/dist/')));
  // Add routes here
  router.get(/^\/(?:login|user|tile).*/, (req, res) => {
    res.sendFile('index.html', { root: rel('../public') });
  });
  return router;
}

function sendError (res, msg) {
  return res.redirect(`/?error=${encodeURIComponent(msg)}`);
}

async function hydrateTiles (tiles, db, agent) {
  if (tiles && !Array.isArray(tiles)) tiles = [tiles];
  if (!tiles?.length) return { ok: true, data: [] };
  const actors = [...new Set(tiles.map(t => t.authorDid))];
  const pr = await agent.getProfiles({ actors });
  if (!pr.success) return { ok: false, error: 'Could not fetch profiles' };
  const profileMap = {};
  pr.data?.profiles?.forEach(({ did, handle, displayName, avatar, createdAt, description, banner, followersCount, followsCount }) => {
    profileMap[did] = { did, handle, displayName, avatar, createdAt, description, banner, followersCount, followsCount };
  });
  const manData = await Promise.all(
    tiles.map(tile => {
      const man = Array.isArray(tile.resources) && tile.resources.find(({ path }) => path === '/manifest.json');
      const { did } = parseATURI(tile.uri);
      return man ? getBlob(man.src.ref.$link, did, agent) : Promise.resolve(null);
    })
  );

  const uris = [...new Set(tiles.filter(t => t.type === 'instance').map(t => t.instanceRef))];
  const instantiated = (await hydrateTiles(await getTiles(db, uris), db, agent))?.data;
  const instanceMap = {};
  instantiated.forEach(t => instanceMap[t.uri] = t);

  tiles.forEach((t, idx) => {
    t.profile = profileMap[t.authorDid] || { did: t.authorDid };
    t.manifest = {
      name: t.name,
    };
    if (manData[idx]) {
      const data = JSON.parse(manData[idx]);
      t.manifest.sizing = data.sizing;
      t.manifest.wishes = data.wishes;
    }
    if (t.instanceRef) t.instanceRef = instanceMap[t.instanceRef];
  });
  return { ok: true, data: tiles };
}

async function hydrateInstalls (installs, db, agent) {
  if (installs && !Array.isArray(installs)) installs = [installs];
  if (!installs?.length) return { ok: true, data: [] };
  const uris = [...new Set(installs.map(t => t.tile))];
  const tiles = await getTiles(db, uris);
  return await hydrateTiles(tiles, db, agent);
}
