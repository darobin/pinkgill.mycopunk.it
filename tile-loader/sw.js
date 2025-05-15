
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

let tc;
class TileContext {
  cid;
  hostname;
  loading = Promise.resolve();
  manifest;
  constructor (cid, hostname) {
    this.cid = cid;
    this.hostname = hostname;
  }
  raslURL (cid) {
    return `https://${this.hostname}/.well-known/rasl/${cid}`;
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
      const url = this.raslURL(cid);
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

self.addEventListener('message', async (ev) => {
  warn(`MESSAGE`, ev.data);
  const { action } = ev.data || {};
  if (!action) return;
  if (action === 'load') {
    tc = new TileContext(ev.data?.cid, ev.data?.hostname);
    warn(`LOADED`);
    await tc.fetchManifest();
    ev.source.postMessage({ state: 'ready', manifest: tc.manifest, cid: ev.data?.cid });
  }
});

self.addEventListener('fetch', async (ev) => {
  warn('~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~');
  warn(`FETCH of "${ev.request.url}"`);
  const url = new URL(ev.request.url);
  // XXX IMPORTANT
  // We have to let this through since we do need to load the loader. But it means that tiles
  // can themselves load anything in loader space. We should add further protection later based
  // on fetch context or some such.
  if (/^\/\.well-known\/web-tiles\//.test(url.pathname)) return;
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
  ev.respondWith(fetch(tc.raslURL(res.src)), response(200, res.mediaType, headers));
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
