
// XXX
// - server
//    x serve this from /.wk/web-tiles/?cid=CID to avoid interference with active workers
//    x do handle / but make it an error
//    x set up RASL on here plugged into the blob store — this is all the comms
//    - right permissions-policy
// - front (polypod)
//    x pg-tile component that sets up an iframe onto this
//    - need to communicate and compute sizing
// - front (tile.HOST)
//    - right CSP (copy from that thing)
//    - right sandbox
//    x load default
//    x refuse to serve as top level
//    x load SW
// x SW
//    x refuse to serve /.wk/(rasl|web-tiles) to protect the back
//    x load manifest, install map
//    x map everything just right, use MASL
//    x verify when loading

let curSWReg;
(async function () {
  const cid = new URLSearchParams(document.location.search)?.get('cid');
  if (!cid) return error('No CID', 'The tile loader received no CID.');
  if (top === window) return error('Not Embedded', 'The tile loader only works embedded.');
  console.warn(`swReg`, curSWReg);
  if (!curSWReg) {
    console.warn(`registering`);
    curSWReg = await navigator.serviceWorker.register('sw.min.js', { scope: '/' });
    console.warn(`after register`, curSWReg);
    await navigator.serviceWorker.ready;
    console.warn(`ready`, curSWReg.active);
  }
  curSWReg.active.postMessage({ cid });
  console.warn(`waiting for service worker to signal load ${cid}`);
})();

navigator.serviceWorker.onmessage = (ev) => {
  console.warn(`SW loaded`, ev.data);
  if (ev.data?.state === 'ready') {
    wipe();
    el(
      'iframe',
      {
        src: '/',
        frameborder: '0', // oh hell yeah
        // XXX this needs a better definition
        csp: [
          `default-src 'self'`,
          `style-src 'self' 'unsafe-inline'`,
          `script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval';`,
          `img-src 'self' blob: data:;`,
          `media-src 'self' blob: data:;`,
        ].join(' '),
        // XXX make this correct
        // sandbox: '',
      },
      [],
      document.body
    );
  }
};

function wipe () {
  document.body.textContent = undefined;
}

function error (title, msg) {
  wipe();
  el(
    'div',
    { class: 'error' },
    [
      el('h3', {}, [title]),
      el('p', {}, [msg]),
    ],
    document.body
  );
}

function el (ln, attrs, kids, parent) {
  const e = document.createElement(ln);
  if (attrs) {
    Object.entries(attrs).forEach(([k, v]) => {
      e.setAttribute(k, v);
    });
  }
  if (kids) {
    kids.forEach(k => {
      if (typeof k === 'string') e.append(document.createTextNode(k));
      else e.append(k);
    });
  }
  if (parent) parent.append(e);
  return e;
}
