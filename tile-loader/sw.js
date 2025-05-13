
import { decode } from "@atcute/cbor";
import { toString, create, CODEC_RAW } from "@atcute/cid";

const maslHeaders = [
  'content-disposition',
  'content-encoding',
  'content-language',
  'content-security-policy',
  // 'mediaType',
  'link',
  'permissions-policy',
  'referrer-policy',
  'service-worker-allowed',
  'sourcemap',
  // 'speculation-rules',
  'supports-loading-mode',
  'x-content-type-options',
];

// XXX
// NEXT STEPS TO MAKE THIS WORK
//    BEST OPTION
//      - Use greenlock + plugin to generate a wildcard cert
//      - scp it to the server
//      - make Caddy use that in prod
//      - have local Caddy support wildcards
//      - weekly cron job once that works (that emails success or failure)
//      - use <CID>.tile.polypod.space
// - MAYBE: we can make the origin sandboxed again and see if warn() was what was missing?
//  THIS DOESN'T SEEM TO BE WORKING, like it's not using the SW for the sub-iframe
// - MAYBE use a mixed context but still the SW so we can have <CID>.tile.HOST w/o wildcard certs
// - MAYBE look at srcdoc?
// - try seeing if we can have a stable context for the fetch events. clientId doesn't seem to be it
//  MAYBE: try starting with /.well-known/web-tiles/load/<CID> and redirect, then see if that's stable
// - if that doesn't work, we might have to return to server-side…
//  MAYBE: if we sandbox the origin, can we use a cookie for the manifest-cid
//

class TileContext {
  cid;
  #clientId;
  loading = Promise.resolve();
  manifest;
  constructor (cid, clientId) {
    this.cid = cid;
    this.#clientId = clientId;
  }
  async fetchManifest () {
    warn(`in fecthManifest(${this.cid})`);
    const { promise, resolve } = Promise.withResolvers();
    this.loading = promise;
    this.manifest = decode(await this.fetchCIDAsArrayBuffer(this.cid));
    warn(`manifest`, this.manifest);
    // XXX check what we get for links in here
    Object.values(this.manifest.resources).forEach(r => {
      if (typeof r.src !== 'string') r.src = r.src.toString();
    });
    resolve();
  }
  async fetchCIDAsArrayBuffer (cid) {
    try {
      const url = raslURL(cid);
      warn(`Fetch of ${url}`);
      const r = await fetch(url);
      warn(`  GOT ${r.status}: ${r.statusText}`);
      const buf = new Uint8Array(await r.arrayBuffer());
      warn(buf);
      const checkCID = toString(await create(CODEC_RAW, buf));
      if (checkCID !== cid) throw new Error(`Content did not match CID (${checkCID} — ${cid}).`);
      return buf;
    }
    catch (err) {
      console.error(`BOOM`, err);
    }
  }
}

const clientMap = {};
self.addEventListener('message', async (ev) => {
  warn(`MESSAGE`, ev.source.id);
  const { action } = ev.data || {};
  const clientId = ev.source.id;
  if (!action) return;
  if (action === 'load') {
    const tc = new TileContext(ev.data?.cid, clientId);
    clientMap[clientId] = tc;
    warn(`LOADED ${clientId}`);
    await tc.fetchManifest();
    ev.source.postMessage({ state: 'ready', manifest: tc.manifest, cid: ev.data?.cid });
  }
  else if (action === 'unload') {
    warn(`UNLOADING ${clientId}`);
    delete clientMap[clientId];
  }
});

function raslURL (cid) {
  return `/.well-known/rasl/${cid}`;
}

self.addEventListener('fetch', async (ev) => {
  warn('~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~');
  warn(`FETCH "${ev.clientId}|${ev.replacesClientId}|${ev.resultingClientId}" of "${ev.request.url}"`);
  console.error(`################ FETCH EVENT #############`, ev);
  const url = new URL(ev.request.url);
  // XXX IMPORTANT
  // We have to let this through since we do need to load the loader. But it means that tiles
  // can themselves load anything in loader space. We should add further protection later based
  // on fetch context or some such.
  if (/^\/\.well-known\/web-tiles\//.test(url.pathname)) return;
  const tc = clientMap[ev.clientId];
  // XXX BUUUUG
  // when fetching / clientId is set to '' and we have resultingClientId instead, but it's a different source
  if (!tc) return ev.respondWith(new Response('No CID available yet.', response()));
  await tc.loading;
  if (!tc.manifest) return ev.respondWith(new Response(`Could not load tile manifest for CID ${tc.cid}`, response(404)));
  const res = tc.manifest.resources?.[url.pathname];
  if (!res) return ev.respondWith(new Response(`Not found: ${url.pathname.replace(/</g, '&gt;')}`, response(404)));
  // Here we have to be careful not to have a nested await (of a fetch at least).
  const headers = {};
  maslHeaders.forEach(h => {
    if (res[h]) {
      if (h === 'sourcemap' && !tc.manifest.resources.sourcemap) return;
      headers[h] = res[h];
    }
  })
  ev.respondWith(fetch(raslURL(res.src)), response(200, res.mediaType, headers));
});

function response (status = 200, mediaType = 'text/plain', headers = {}) {
  return {
    status,
    headers: {
      ...headers,
      'content-type': mediaType,
    },
  };
}

async function warn (...msg) {
  const cs = await self.clients.matchAll();
  cs.forEach(c => c.postMessage({ action: 'warn', msg }));
}
