
import { lexicons } from '@atproto/api';
import * as xrpc from '@atproto/xrpc-server';
import { Agent } from '@atproto/api';
import { getIronSession } from 'iron-session';
import { lexiconForXRPC, instanceDefs, tileDefs } from './lexicons/lexicons.js';
import { SESSION_PARAMS } from "./config.js";

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
    const error = (message) => ({ status: 401, error: 'AuthError', message });
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

  server.method(
    'space.polypod.getCurrentProfile',
    {
      auth: mustBeLoggedIn,
      handler: async ({ auth: { agent } }) => {
        const profile = await agent.app.bsky.actor.getProfile({ actor: agent.assertDid });
        const handle = await ctx.resolver.resolveDidToHandle(agent.assertDid);
        return response({ handle, did: agent.assertDid, profile });
      }
    }
  );

  // XXX
  // Checkpoint here: this is enough to check that this works from the front end
  //  - start client for all this
  //  - start store for all this
  //  - reboot UI with just login + profile working


  // - [ ] space.polypod.getActorProfile()
  // - [ ] space.polypod.getActorTiles()
  // - [ ] space.polypod.getInstalledTiles()
  // - [ ] space.polypod.searchTiles()
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
