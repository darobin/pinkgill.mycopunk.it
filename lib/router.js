
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
import { COOKIE_SECRET, HOST, UPLOAD_PATH, BLOB_PATH } from "./config.js";
import makeRel from './rel.js';
import { ids } from './lexicons/lexicons.js';

const rel = makeRel(import.meta.url);
const upload = multer({ dest: UPLOAD_PATH });
const tileCollection = ids.SpacePolypodPinkgillTile;

export default function createRouter (ctx) {
  const router = express.Router();
  const sessionParams = {
    cookieName: 'pinkgill-sid',
    password: COOKIE_SECRET,
  };

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

  // Tiles
  router.post('/api/tile', upload.array('tile'), async (req, res) => {
    const agent = await getSessionAgent(req, res, ctx);
    if (!agent) return res.status(401).send({ ok: false });
    console.warn(`Processing ${req.files.length} files`, req.files);
    const resources = [];
    // XXX PROBLEMS TO FIX
    // - the file name is not the full path — encodeURI() it on the client and decode it here to not lose the /
    // - client does nothing on completion
    // - optimistic indexing
    // - event stream to signal stream refresh
    // - pull stream data
    // - render stream data
    for (let f of req.files) {
      const { originalname: fileName, mimetype: mimeType, path } = f;
      try {
        console.warn(`• Reading ${path}`);
        const file = await readFile(path);
        const uploaded = await agent.com.atproto.repo.uploadBlob(file, { encoding: mimeType || 'application/octet-stream' });
        console.warn(`Upload`, uploaded);
        const cid = uploaded.data.blob.ref.toString();
        // { data: { blob: { cid, mimeType } }} (I *think*)
        await rename(path, join(BLOB_PATH, cid));
        resources.push({
          path: fileName,
          src: { ref: cid, mimeType: uploaded.data.blob.mimeType, size: uploaded.data.blob.size },
        });
      }
      catch (err) {
        ctx.logger.error({ err }, 'failed to process file to blob');
      }
    }
    const record = {
      $type: tileCollection,
      name: req.body?.name,
      resources,
      createdAt: new Date().toISOString(),
    };
    try {
      await agent.com.atproto.repo.putRecord({
        repo: agent.assertDid, 
        collection: tileCollection,
        rkey: TID.nextStr(),
        record,
      })
      res.send({ ok: true });
    } 
    catch (err) {
      ctx.logger.warn({ err }, 'failed to write record');
      return res.status(500).send({ ok: false, error: 'failed to write record' });
    }
  });

  router.use(express.static(rel('../public')));
  router.use(express.static(rel('../node_modules/@shoelace-style/shoelace/dist/')));
  return router;
}

function sendError (res, msg) {
  return res.redirect(`/?error=${encodeURIComponent(msg)}`);
}
