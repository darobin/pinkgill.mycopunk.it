
import { IdResolver, MemoryCache } from '@atproto/identity';

const HOUR = 60e3 * 60;
const DAY = HOUR * 24;

export function createIdResolver () {
  return new IdResolver({
    didCache: new MemoryCache(HOUR, DAY),
  });
}

export function createBidirectionalResolver (resolver) {
  return {
    async resolveDidToHandle (did) {
      const didDoc = await resolver.did.resolveAtprotoData(did);
      const resolvedHandle = await resolver.handle.resolve(didDoc.handle);
      if (resolvedHandle === did) return didDoc.handle;
      return did;
    },
    async resolveDidsToHandles(dids) {
      const didHandleMap = {};
      const resolves = await Promise.all(
        dids.map((did) => this.resolveDidToHandle(did).catch(() => did))
      );
      for (let i = 0; i < dids.length; i++) {
        didHandleMap[dids[i]] = resolves[i];
      }
      return didHandleMap;
    },
  }
}
