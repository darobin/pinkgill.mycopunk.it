
import process from 'node:process';
import { Agent, lexicons } from '@atproto/api';
import * as xrpc from '@atproto/xrpc-server';
import { TID } from '@atproto/common';
import { Lexicons } from '@atproto/lexicon';
import { encode, decode } from '@atcute/cbor';
import { CID } from 'multiformats';
import { getIronSession } from 'iron-session';
import { lexiconForXRPC, instanceDefs, tileDefs, daslDefs } from './lexicons/lexicons.js';
import { getBlob, hasLocalBlob, saveBlob } from './blobs.js';
import { SESSION_PARAMS } from "./config.js";

// This is to get debugging from XRPC
process.env.LOG_ENABLED = 1;

// Lexicons
const lexiconList = [
  // the dependencies for ours
  ...lexicons.docs.values(),
  daslDefs,
  tileDefs,
  instanceDefs,
  ...Object.values(lexiconForXRPC),
];
const lexiconValidator = new Lexicons();
lexiconList.forEach(lex => lexiconValidator.add(lex));

export default async function createXRPCServer (ctx) {
  const errorParser = (err) => {
    ctx.logger.error({ err }, 'XRPC explosion');
    return xrpc.XRPCError.fromError(err);
  }
  const server = xrpc.createServer(lexiconList, { errorParser });

  // Auth handler that requires login and sets up agent with session.
  const mustBeLoggedIn = async ({ req, res }) => {
    const session = await getIronSession(req, res, SESSION_PARAMS);
    const error = (message) => {
      ctx.logger.error(message);
      return { status: 401, error: 'AuthError', message };
    }
    if (!session.did) return error('No DID in session.');
    try {
      const oauthSession = await ctx.oauthClient.restore(session.did);
      return oauthSession ? { session, agent: new Agent(oauthSession) } : error('No OAuth session.');
    }
    catch (err) {
      ctx.logger.warn({ err }, 'oauth restore failed');
      session.destroy();
      return error('Oauth restore failed.');
    }
  };

  // XXX Note: we might want to check if we're logged in anyway and use the logged
  // in agent if available, for some calls it can make a difference.
  const publicAPIAgent = async () => {
    return { agent: new Agent({ service: "https://public.api.bsky.app" }) };
  };

  server.method(
    'space.polypod.getCurrentProfile',
    {
      auth: mustBeLoggedIn,
      handler: async ({ auth: { agent } }) => {
        try {
          const profile = await agent.app.bsky.actor.getProfile({ actor: agent.assertDid });
          return response(profile.data);
        }
        catch (err) {
          ctx.logger.error({ err }, 'getCurrentProfile failed');
        }
      }
    }
  );

  server.method(
    'space.polypod.getActorProfile',
    {
      auth: publicAPIAgent,
      handler: async ({ req, auth: { agent } }) => {
        try {
          const profile = await agent.app.bsky.actor.getProfile({ actor: req.query.actor });
          return response(profile.data);
        }
        catch (err) {
          ctx.logger.error({ err }, 'getActorProfile failed');
        }
      }
    }
  );

  server.method(
    'space.polypod.hasBlob',
    {
      // auth: publicAPIAgent,
      handler: async ({ req }) => {
        try {
          const exists = await hasLocalBlob(req.query.cid);
          return response({ exists });
        }
        catch (err) {
          ctx.logger.error({ err }, 'hasBlob failed');
          return false;
        }
      }
    }
  );

  server.method(
    'space.polypod.uploadBlob',
    {
      auth: mustBeLoggedIn,
      handler: async ({ req, auth: { agent }, input: { body } }) => {
        // body is a ReadableStream
        try {
          const cid = await saveBlob(body, req.query.cid, agent);
          const validatableCID = CID.parse(cid);
          return response({ cid: validatableCID });
        }
        catch (err) {
          ctx.logger.error({ err }, 'uploadBlob failed');
          return false;
        }
      }
    }
  );

  server.method(
    'space.polypod.uploadTile',
    {
      auth: mustBeLoggedIn,
      handler: async ({ auth: { agent }, input: { body: { tile } } }) => {
        try {
          const cbor = encode(tile);
          const cid = await saveBlob(cbor, null, agent);
          const putData = await saveRecord(agent, 'space.polypod.tile', { cid, tile });
          await ctx.dbWrapper.indexTile(putData);
          return response({
            cid,
            uri: tileURI(agent.assertDid, putData.rkey),
          });
        }
        catch (err) {
          ctx.logger.error({ err }, 'uploadBlob failed');
          return false;
        }
      }
    }
  );

  server.method(
    'space.polypod.getTile',
    {
      auth: publicAPIAgent,
      handler: async ({ req, auth: { agent } }) => {
        try {
          const { cid } = req.query;
          const { authorDid: did, tid, createdAt, indexedAt } = await ctx.dbWrapper.getTileMetadata(cid);
          const cbor = await getBlob(cid, did, agent);
          const tile = decode(cbor);
          const { data: author } = await agent.app.bsky.actor.getProfile({ actor: did });
          return response({
            cid,
            uri: tileURI(did, tid),
            author,
            tile,
            createdAt,
            indexedAt,
          });
        }
        catch (err) {
          ctx.logger.error({ err }, 'getTile failed');
          return false;
        }
      }
    }
  );

  // - [ ] space.polypod.getActorTiles()
  // - [ ] space.polypod.getInstalledTiles()
  // - [ ] space.polypod.searchTiles()
  // - [ ] space.polypod.getBlob()
  // - [ ] space.polypod.deleteTile()
  // - [ ] space.polypod.installTile()
  // - [ ] space.polypod.uninstallTile()
  // - [ ] space.polypod.createInstance()
  // - [ ] space.polypod.deleteInstance()

  return server;
}


function response (body) {
  return { encoding: 'application/json', body };
}

// - agent
// - content: the content of the record without $type or createdAt
// - schema: the lexicon name to validate against
// - collection: the collection
// Returns tid, throws
async function saveRecord (agent, collection, content) {
  const record = { ...content, $type: collection, createdAt: new Date().toISOString() };
  const rkey = TID.nextStr();
  const putData = { repo: agent.assertDid, collection, rkey, record };
  lexiconValidator.assertValidRecord(collection, record);
  await agent.com.atproto.repo.putRecord(putData);
  return putData;
}

function tileURI (did, tid) {
  return `at://${did}/space.polypod.tile/${tid}`;
}
