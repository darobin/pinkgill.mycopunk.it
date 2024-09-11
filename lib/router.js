
import express from "express";
import { getIronSession } from 'iron-session';
import { COOKIE_SECRET } from "./config.js";
import makeRel from './rel.js';

const rel = makeRel(import.meta.url);

export default function createRouter (ctx) {
  const router = express.Router();
  const sessionParams = {
    cookieName: 'pinkgill-sid',
    password: COOKIE_SECRET,
  };

  // identity
  router.get('/api/identity', async (req, res) => {
    const session = await getIronSession(req, res, sessionParams);
    if (!session.did) return res.status(401).send({ ok: false });
    res.send({ ok: true, data: { did: session.did }});
  });
  router.post('/api/logout', async (req, res) => {
    const session = await getIronSession(req, res, sessionParams);
    await session.destroy();
  });

  router.use(express.static(rel('../public')));
  return router;
}
