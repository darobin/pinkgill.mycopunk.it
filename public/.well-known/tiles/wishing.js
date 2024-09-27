
const validModes = new Set([
  'bare',     // the tile just shows in the timeline, as initially uploaded
  'create',   // the tile is used to create, in response to instantiate wish
  'instance', // the tile is rendering an instance, comes with data
]);

class Wishing {
  #readyPromise = null;
  #parent = null;
  constructor () {}
  get ready () {
    if (this.#readyPromise) return this.#readyPromise;
    this.#readyPromise = new Promise((resolve, reject) => {
      window.addEventListener('message', (ev) => {
        if (!ev.data?.action) return;
        const { action, payload } = ev.data;
        if (action === 'make-wish-ready') {
          if (!payload || !validModes.has(payload.mode)) return reject(new Error(`Invalid mode: ${payload.mode || '<unspecified>'}`));
          if (payload.mode === 'instance') {
            if (!payload.data) return reject(new Error('Cannot instantiate without data'));
            this.#parent = ev.source;
            return resolve({ mode: payload.mode, data: payload.data });
          }
          this.#parent = ev.source;
          return resolve({ mode: payload.mode });
        }
      });
      // We post to whoever because we don't know where we get embedded.
      window.parent?.postMessage({ action: 'wish-receiving' }, '*');
    });
    return this.#readyPromise;
  }
}

(async () => {
  if (!window.wish) window.wish = new Wishing();
})();
