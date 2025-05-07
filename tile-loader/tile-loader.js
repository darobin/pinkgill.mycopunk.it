
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
//    - right CSP (copy from that thing, move to the worker)
//    - right sandbox
//    x load default
//    x refuse to serve as top level
//    x load SW
// x SW
//    x refuse to serve /.wk/(rasl|web-tiles) to protect the back
//    x load manifest, install map
//    x map everything just right, use MASL
//    x verify when loading

(async function () {
  const cid = new URLSearchParams(document.location.search)?.get('cid');
  if (!cid) return error('No CID', 'The tile loader received no CID.');
  if (top === window) return error('Not Embedded', 'The tile loader only works embedded.');
  let curSWReg = await navigator.serviceWorker.getRegistration();
  console.warn(`swReg`, curSWReg);
  if (!curSWReg) {
    curSWReg = await navigator.serviceWorker.register('sw.min.js', { scope: '/' });
    await navigator.serviceWorker.ready;
    console.warn(`ready`, curSWReg.active, curSWReg.waiting);
  }
  curSWReg.active.postMessage({ action: 'load', cid });
  window.addEventListener('beforeunload', () => {
    curSWReg?.active?.postMessage({ action: 'unload' });
  });
  console.warn(`waiting for service worker to signal load ${cid}`);
})();


navigator.serviceWorker.onmessage = (ev) => {
  if (ev.data?.action === 'warn') {
    console.warn(`[SW]`, ...ev.data.msg);
  }
  else if (ev.data?.state === 'ready') {
    console.warn(`SW loaded`, ev.data);
    // const src = `https://${ev.data.cid}@${window.location.host}/`;
    // console.warn(`SRC=${src}`);
    wipe();
    el(
      'iframe',
      {
        src: '/',
        // src,
        frameborder: '0', // oh hell yeah
        // XXX make this correct
        sandbox: [
          'allow-downloads',
          'allow-forms',
          // 'allow-modals',
          // 'allow-orientation-lock',
          // 'allow-pointer-lock',
          // 'allow-popups',
          // 'allow-popups-to-escape-sandbox',
          // 'allow-presentation',
          // 'allow-same-origin',
          'allow-scripts',
          // 'allow-top-navigation',
          'allow-top-navigation-by-user-activation',
          // 'allow-top-navigation-to-custom-protocols',
        ].join(' '),
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
