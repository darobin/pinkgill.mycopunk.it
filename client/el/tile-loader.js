
import { LitElement, html, css, nothing } from 'lit';
import { styleMap } from 'lit/directives/style-map.js';

export class PinkgillTileLoader extends LitElement {
  static properties = {
    cid: {},
  };
  static styles = [
    css`
      :host {
        display: block;
        width: 100%;
        line-height: 0;
      }
      iframe {
        display: block;
        width: 100%;
        height: var(--dynamic-height, 500px);
        border: 0;
      }
    `,
  ];
  // reload () {
  //   const ifr = this.getIframe();
  //   if (!ifr) return;
  //   ifr.src = ifr.src;
  // }
  render () {
    if (!this.cid) return nothing;
    const style = {};
    if (this.dynHeight) style['--dynamic-height'] = `${this.dynHeight}px`;
    const src = `https://tile.${window.location.host}/.well-known/web-tiles/?cid=${this.cid}`
    console.warn(`in <pg-tile-loader>`, src);
    return html`<iframe src=${src} style=${styleMap(style)} loading="lazy"></iframe>`;
  }
}

customElements.define('pg-tile-loader', PinkgillTileLoader);
