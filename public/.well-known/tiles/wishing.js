
const validModes = new Set([
  'bare',         // the tile just shows in the timeline, as initially uploaded
  'create',       // the tile is used to create, which is to say it's creating something that isn't a tile (e.g. an image)
  'instantiate',  // the tile is used to instantiate, which is to say it's creating data for a tile instance
  'instance',     // the tile rendering an instance with data
]);

class Wishing {
  #readyPromise = null;
  #parent = null;
  #postHandler = null;
  #cancelHandler = null;
  constructor () {}
  get ready () {
    if (this.#readyPromise) return this.#readyPromise;
    this.#readyPromise = new Promise((resolve, reject) => {
      window.addEventListener('message', async (ev) => {
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
        if (action === 'get-data') {
          const data = this.#postHandler ? await this.#postHandler() : {};
          window.parent?.postMessage({ action: 'got-data', data }, '*');
        }
        if (action === 'check-is-dirty') {
          const isDirty = this.#cancelHandler ? await this.#cancelHandler() : false;
          window.parent?.postMessage({ action: 'is-dirty', isDirty }, '*');
        }
      });
      // We post to whoever because we don't know where we get embedded.
      window.parent?.postMessage({ action: 'wish-receiving' }, '*');
    });
    return this.#readyPromise;
  }
  registerPostHandler (handler) {
    this.#postHandler = handler;
  }
  registerCancelHandler (handler) {
    this.#cancelHandler = handler;
  }
}

(async () => {
  if (!window.wish) window.wish = new Wishing();
})();
