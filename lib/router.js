
import express from "express";
import makeRel from './rel.js';

const rel = makeRel(import.meta.url);

export default function createRouter (ctx) {
  const router = express.Router();


  router.use(express.static(rel('../public')));
  return router;
}
