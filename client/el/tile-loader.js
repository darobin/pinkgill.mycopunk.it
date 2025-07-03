
import { LitElement, html, css, nothing } from 'lit';
import { StoreController } from "@nanostores/lit";
import { createTileResource } from '../store.js';

const MIN_SIZE = 150;
const MAX_SIZE = 3000;

export class PinkgillTileLoader extends LitElement {
  #tileResource = createTileResource();
  #tile = new StoreController(this, this.#tileResource.store);
  static properties = {
    cid: {},
    width: { attribute: false, state: true },
  };
  static styles = [
    css`
      :host {
        display: block;
        width: 100%;
        line-height: 0;
      }
      iframe {
        /* display: block; */
        /* width: var(--dynamic-width, 100%);
        height: var(--dynamic-height, 500px); */
        border: 0;
      }
    `,
  ];
  // reload () {
  //   const ifr = this.getIframe();
  //   if (!ifr) return;
  //   ifr.src = ifr.src;
  // }
  connectedCallback () {
    super.connectedCallback();
    this.loadCID();
  }
  disconnectedCallback () {
    super.disconnectedCallback();
    this.#tileResource?.reset();
  }
  firstUpdated () {
    this.width = this.parentNode?.offsetWidth || 0;
    console.warn(`UP: ${this.width}`);
  }
  attributeChangedCallback (name, _old, value) {
    super.attributeChangedCallback(name, _old, value);
    if (name !== 'cid') return;
    this.loadCID();
  }
  async loadCID () {
    if (this.cid) this.#tileResource.load({ cid: this.cid });
  }
  render () {
    if (!this.cid) return nothing;
    let w = nothing;
    let h = nothing;
    const { sizing } = this.#tile.value?.data?.tile || {};
    console.warn(`SIZING:`, sizing, this.#tile.value);
    if (sizing && this.width) {
      let { width, height } = sizing || {};
      if (width < MIN_SIZE) width = MIN_SIZE;
      if (width !== this.width) {
        const factor = this.width / width;
        height *= factor;
      }
      if (height < MIN_SIZE) height = MIN_SIZE;
      if (height > MAX_SIZE) height = MAX_SIZE;
      w = this.width;
      h = height;
    }
    const src = `https://${this.cid}.tile.${window.location.host}/.well-known/web-tiles/`
    console.warn(`in <pg-tile-loader>`, src, w, h);
    // const sandbox = [
    //   'allow-downloads',
    //   'allow-forms',
    //   // 'allow-modals',
    //   // 'allow-orientation-lock',
    //   // 'allow-pointer-lock',
    //   // 'allow-popups',
    //   // 'allow-popups-to-escape-sandbox',
    //   // 'allow-presentation',
    //   // 'allow-same-origin',
    //   'allow-scripts',
    //   // 'allow-top-navigation',
    //   'allow-top-navigation-by-user-activation',
    //   // 'allow-top-navigation-to-custom-protocols',
    // ].join(' ');
    return html`<iframe src=${src} width=${w} height=${h} loading="lazy"></iframe>`;
  }
}

customElements.define('pg-tile-loader', PinkgillTileLoader);
