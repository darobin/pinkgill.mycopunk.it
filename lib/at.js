
import { Agent } from '@atproto/api';

export const publicAPIAgent = async () => {
  return { agent: new Agent({ service: "https://public.api.bsky.app" }) };
};
