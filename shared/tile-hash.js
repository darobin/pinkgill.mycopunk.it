
import { base36 } from 'multiformats/bases/base36';

export default function makeTileHasher (crypto) {
  return async function tileHash (did, tid) {
    const msgUint8 = new TextEncoder().encode(`${tid}@${did}`);
    const hashBuffer = await crypto.subtle.digest("SHA-256", msgUint8);
    return base36.encode(new Uint8Array(hashBuffer));
  }  
}
