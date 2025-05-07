
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

let curCID;
let loading = Promise.resolve();
let curManifest;
console.warn(`Hi from the SW!`);
self.onmessage = async (ev) => {
  console.warn(`MESSAGE!`);
  console.warn(`[SW] ${ev.data?.cid}`);
  curCID = ev.data?.cid;
  loading = fetchManifest(curCID);
  await loading;
  ev.source.postMessage({ state: 'ready', manifest: curManifest });
};

function raslURL (cid) {
  return `/.well-known/rasl/${cid}`;
}

async function fetchCIDAsArrayBuffer (cid) {
  try {
    const url = raslURL(cid);
    console.warn(`Fetch of ${url}`);
    const r = await fetch(url);
    console.warn(`  GOT ${r.status}: ${r.statusText}`);
    const buf = await r.arrayBuffer();
    console.warn(buf);
    const checkCID = toString(await create(CODEC_RAW, buf));
    if (checkCID !== cid) throw new Error(`Content did not match CID (${checkCID} — ${cid}).`);
    return buf;
  }
  catch (err) {
    console.error(`BOOM`, err);
  }
}

async function fetchManifest (cid) {
  console.warn(`in fecthMan`);
  curManifest = decode(await fetchCIDAsArrayBuffer(cid));
  console.warn(`manifest`, curManifest);
  // XXX check what we get for links in here
  Object.values(curManifest.resources).forEach(r => {
    if (typeof r.src !== 'string') r.src = r.src.toString();
  });
}

self.addEventListener('fetch', async (ev) => {
  const url = new URL(ev.request.url);
  // XXX IMPORTANT
  // We have to let this through since we do need to load the loader. But it means that tiles
  // can themselves load anything in loader space. We should add further protection later based
  // on fetch context or some such.
  if (/^\/\.well-known\/web-tiles\//.test(url.pathname)) return;
  if (!curCID) return ev.respondWith(new Response('No CID available yet.', response()));
  await loading;
  if (!curManifest) return ev.respondWith(new Response(`Could not load tile manifest for CID ${curCID}`, response(404)));
  const res = curManifest.resources?.[url.pathname];
  if (!res) return ev.respondWith(new Response(`Not found: ${url.pathname.replace(/</g, '&gt;')}`, response(404)));
  // Here we have to be careful not to have a nested await (of a fetch at least).
  const headers = {};
  maslHeaders.forEach(h => {
    if (res[h]) {
      if (h === 'sourcemap' && !curManifest.resources.sourcemap) return;
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
