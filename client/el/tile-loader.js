
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
    return html`<iframe src=${src} style=${styleMap(style)} loading="lazy"></iframe>`;
  }
}

customElements.define('pg-tile-loader', PinkgillTileLoader);
