
import { NodeOAuthClient } from '@atproto/oauth-client-node';
import { AUTH_HOST } from './config.js';
import { SessionStore, StateStore } from './storage.js';

export const createClient = async (db) => {
  const url = `https://${AUTH_HOST}/`;
  return new NodeOAuthClient({
    clientMetadata: {
      client_name: 'Pinkgill',
      client_id: `${url}client-metadata.json`,
      client_uri: url,
      redirect_uris: [`${url}api/oauth/callback`],
      scope: 'atproto transition:generic',
      grant_types: ['authorization_code', 'refresh_token'],
      response_types: ['code'],
      application_type: 'web',
      token_endpoint_auth_method: 'none',
      dpop_bound_access_tokens: true,
    },
    stateStore: new StateStore(db),
    sessionStore: new SessionStore(db),
  });
}
