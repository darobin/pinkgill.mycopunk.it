
import assert from 'node:assert';
import express from "express";
import { getIronSession } from 'iron-session';
import { isValidHandle } from '@atproto/syntax';
import { COOKIE_SECRET } from "./config.js";
import makeRel from './rel.js';

const rel = makeRel(import.meta.url);

export default function createRouter (ctx) {
  const router = express.Router();
  const sessionParams = {
    cookieName: 'pinkgill-sid',
    password: COOKIE_SECRET,
  };

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
    res.send({ ok: true, data: { did: session.did }});
  });

  router.use(express.static(rel('../public')));
  router.use(express.static(rel('../node_modules/@shoelace-style/shoelace/dist/')));
  return router;
}

function sendError (res, msg) {
  return res.redirect(`/?error=${encodeURIComponent(msg)}`);
}
