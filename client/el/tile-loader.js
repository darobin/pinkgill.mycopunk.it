
import { LitElement, html, css, nothing } from 'lit';
import { styleMap } from 'lit/directives/style-map.js';
import { addActiveTile, removeActiveTile } from '../store/tiles.js';

export class PinkgillTileLoader extends LitElement {
  static properties = {
    parent: { attribute: false },
    dynHeight: { attribute: false },
    url: { attribute: false },
  };
  static styles = [
    css`
      :host {
        display: block;
        width: 100%;
      }
      iframe {
        display: block;
        width: 100%;
        height: var(--dynamic-height, 500px);
        border: 0;
      }
    `,
  ];
  getIframe () {
    return this.shadowRoot.querySelector('iframe');
  }
  disconnectedCallback () {
    removeActiveTile(this.getWindow())
    super.disconnectedCallback();
  }
  firstUpdated () {
    addActiveTile(this.parent, this.getWindow());
  }
  getWindow () {
    return this.getIframe()?.contentWindow;
  }
  postMessage (data) {
    const win = this.getWindow();
    if (!win) return;
    win.postMessage(data, new URL(this.url).origin);
  }
  render () {
    if (!this.url) return nothing;
    const style = {};
    if (this.dynHeight) style['--dynamic-height'] = `${this.dynHeight}px`;
    return html`<iframe src=${this.url} style=${styleMap(style)}></iframe>`;
  }
}

customElements.define('pg-tile-loader', PinkgillTileLoader);
