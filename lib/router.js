
import assert from 'node:assert';
import express from "express";
import multer from 'multer2';
import cookieParser from 'cookie-parser';
import { getIronSession } from 'iron-session';
import { Agent } from '@atproto/api';
import { isValidHandle } from '@atproto/syntax';
import { COOKIE_SECRET, HOST, UPLOAD_PATH } from "./config.js";
import makeRel from './rel.js';

const rel = makeRel(import.meta.url);
const upload = multer({ dest: UPLOAD_PATH });

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
    // res.send({ ok: true, data: { did: session.did }});
  });

  // Tiles
  router.post('/api/tile', upload.array('tile'), async (req, res) => {
    // XXX
    // - generate helpers
    // - make a migration
    // - connect to the firehose and ingest
    // - get he mime type
    // - upload the blob
    // - use the returned CID as the name of the resource and move from uploads to blobs under that name
    // XXX this is an example 
    // const file = Buffer.from(labeledImgB64, 'base64')
    // const uploadedImg = await bob.com.atproto.repo.uploadBlob(file, {
    //   encoding: 'image/png',
    // })
    // Construct their status record
    //  const record = {
    //   $type: 'xyz.statusphere.status',
    //   status: req.body?.status,
    //   createdAt: new Date().toISOString(),
    // }
    //   const record = {
    //    $type: 'space.polypod.pinkgill.tile',
    //    name: 'I am a tile',
    //    resources: [{ path: "/", src: { cid: '...', mimeType: '...' } }, ...]
    //    createdAt: new Date().toISOString(),
    //  }

  // try {
  //   // Write the status record to the user's repository
  //   await agent.com.atproto.putRecord({
  //     repo: agent.assertDid, 
  //     collection: 'xyz.statusphere.status',
  //     rkey: TID.nextStr(),
  //     record,
  //   })
  // } catch (err) {
  //   logger.warn({ err }, 'failed to write record')
  //   return res.status(500).type('html').send('<h1>Error: Failed to write record</h1>')
  // }

    // XXX this isn't right since it's a record but not a post
    // const labeledPost = await bob.app.bsky.feed.post.create(
    //   { repo: bob.accountDid },
    //   {
    //     text: 'naughty post',
    //     embed: {
    //       $type: 'app.bsky.embed.images',
    //       images: [
    //         {
    //           image: uploadedImg.data.blob,
    //           alt: 'naughty naughty',
    //         },
    //       ],
    //     },
    //     createdAt: date.next().value,
    //   },
    // )
  });

  router.use(express.static(rel('../public')));
  router.use(express.static(rel('../node_modules/@shoelace-style/shoelace/dist/')));
  return router;
}

function sendError (res, msg) {
  return res.redirect(`/?error=${encodeURIComponent(msg)}`);
}
