
import process from 'node:process';
import { Agent, lexicons } from '@atproto/api';
import * as xrpc from '@atproto/xrpc-server';
import { getIronSession } from 'iron-session';
import { lexiconForXRPC, instanceDefs, tileDefs } from './lexicons/lexicons.js';
import { hasLocalBlob } from './blobs.js';
import { SESSION_PARAMS } from "./config.js";

// This is to get debugging from XRPC
process.env.LOG_ENABLED = 1;

export default async function createXRPCServer (ctx) {
  const server = xrpc.createServer([
    // the dependencies for ours
    ...lexicons.docs.values(),
    tileDefs,
    instanceDefs,
    ...Object.values(lexiconForXRPC),
  ]);

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

  // - [ ] space.polypod.getActorTiles()
  // - [ ] space.polypod.getInstalledTiles()
  // - [ ] space.polypod.searchTiles()
  // - [ ] space.polypod.uploadBlob()
  // - [ ] space.polypod.getBlob()
  // - [ ] space.polypod.uploadTile() — if it's an update, just include a prev field with the CID
  // - [ ] space.polypod.getTile()
  // - [ ] space.polypod.deleteTile()
  // - [ ] space.polypod.installTile()
  // - [ ] space.polypod.uninstallTile()
  // - [ ] space.polypod.createInstance()
  // - [ ] space.polypod.deleteInstance()




  // await agent.app.bsky.actor.getProfile({ actor: agent.assertDid });
  //   const handle = await ctx.resolver.resolveDidToHandle(agent.assertDid);
  //   res.send({ ok: true, data: { handle, did: agent.assertDid, ...profileRecord.value } });

  return server;
}


function response (body) {
  return { encoding: 'application/json', body };
}
