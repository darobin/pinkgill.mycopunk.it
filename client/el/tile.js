
import { LitElement, html, css, nothing } from 'lit';
import { until } from 'lit/directives/until.js';
import { MultiStoreController } from '@nanostores/lit';
import { urlForTile, makeTileStores } from '../store/tiles.js';
import { isInstallable, makeInstaller } from '../store/installs.js';
import { buttons, errors } from './styles.js';

export class PinkgillTile extends LitElement {
  static properties = {
    tile: { attribute: false },
  };
  static styles = [
    css`
      :host {
        display: block;
        width: 100%;
      }
      div[slot="header"] {
        display: grid;
        grid-template-areas:
          "a b"
          "c b"
        ;
      }
      h3 {
        grid-area: a;
        font-family: var(--header-fam);
        font-size: 1rem;
        margin: 0;
      }
      .handle {
        grid-area: b;
        font-weight: bold;
        line-height: 1;
        text-align: right;
      }
      time {
        grid-area: c;
        font-size: 0.8rem;
        color: var(--sl-color-neutral-500);
      }
      sl-card {
        width: 100%;
      }
      sl-card::part(body) {
        padding: 0;
      }
      iframe {
        width: 100%;
        height: var(--dynamic-height, 500px);
        border: 0;
      }
      div[slot="footer"] {
        text-align: right;
      }
    `,
    buttons,
    errors,
  ];
  #storeData = makeTileStores();
  #installerData = makeInstaller();
  #controller = new MultiStoreController(this, [
    this.#storeData.$manifest, 
    this.#storeData.$manifestLoading, 
    this.#storeData.$manifestError, 
    this.#installerData.$installDone,
    this.#installerData.$installLoading,
    this.#installerData.$installError,
  ]);
  async connectedCallback () {
    super.connectedCallback();
    if (!this.tile) return;
    await this.#storeData.loadManifest(this.tile.uri);
  }
  async handleMessage (ev) {
    if (ev.source !== this.getWindow()) return;
    const { data } = ev;
    if (data?.action === 'wish-receiving') {
      ev.source.postMessage({
        action: 'make-wish-ready',
        payload: {
          mode: 'bare',
        },
      }, ev.origin);
    }
  }
  async handleInstall () {
    if (!this.tile) return;
    await this.#installerData.installTile(this.tile);
  }
  renderCardContainer (content, footer) {
    return html`<sl-card>
      <div slot="header">
        <h3>${this.tile.name}</h3>
        <span class="handle">@${this.tile.handle}</span>
        <time datetime=${this.tile.createdAt}>${this.tile.createdAt}</time>
      </div>
      ${content || nothing}
      ${footer || nothing}
    </sl-card>`;
  }
  getWindow () {
    return this.shadowRoot.querySelector('iframe')?.contentWindow;
  }
  render () {
    if (!this.tile) return nothing;
    // did.plc.izttpdp3l6vss5crelt5kcux.3l4e5yozvmk2j.tile.pinkgill.bast
    const loading = this.#storeData.$manifestLoading.get();
    if (loading) return this.renderCardContainer(html`<pg-loading></pg-loading>`)
    let dynHeight;
    const manifest = this.#storeData.$manifest.get();
    if (manifest?.sizing?.width && manifest?.sizing?.height) {
      const { width, height } = manifest.sizing;
      const ratio = height / width;
      const bannerHeight = (document.querySelector('header')?.clientHeight + 16) || 98;
      const maxHeight = window.visualViewport.height - bannerHeight;
      const ownWidth = this.clientWidth;
      let ownHeight = ratio * ownWidth;
      console.warn(`ratio=${ratio}, w=${ownWidth}, h=${ownHeight}`);
      if (ownHeight > maxHeight) ownHeight = maxHeight;
      if (ownHeight < 100) ownHeight = 100;
      dynHeight = ownHeight;
    }
    return until(
      (async () => {
        const url = await urlForTile(this.tile);
        let footer = nothing;
        if (isInstallable(this.tile)) {
          const error = this.#installerData.$installError.get();
          const loading = this.#installerData.$installLoading.get();
          footer = html`<div slot="footer">
            ${error ? html`<span class="error">${error}</span>` : nothing}
            ${html`<sl-button class="action" @click=${this.handleInstall} ?disabled=${loading}>Install</sl-button>`}
          </div>`;
        }
        return this.renderCardContainer(
          html`<iframe src=${url} style=${dynHeight ? `--dynamic-height: ${dynHeight}px` : ''}></iframe>`,
          footer
        );
      })()
    )
  }
}

customElements.define('pg-tile', PinkgillTile);

// {
//   "uri": "at://did:plc:izttpdp3l6vss5crelt5kcux/space.polypod.pinkgill.tile/3l4e5yozvmk2j",
//   "authorDid": "did:plc:izttpdp3l6vss5crelt5kcux",
//   "name": "First Tile",
//   "resources": [
//     {
//       "src": {
//         "$type": "blob",
//         "ref": {
//           "$link": "bafkreibozdtixnridlvzbgkg2hg2m53nytsa5hatuiwvrqruydvvy52whu"
//         },
//         "mimeType": "application/octet-stream",
//         "size": 686
//       },
//       "path": "/index.html"
//     },
//     {
//       "src": {
//         "$type": "blob",
//         "ref": {
//           "$link": "bafkreietyojvzptchejkoz5ir7kwwjn5joquzoyf7m5nnzhuk2v7ju63uy"
//         },
//         "mimeType": "image/jpeg",
//         "size": 139313
//       },
//       "path": "/img/noodle.jpg"
//     }
//   ],
//   "createdAt": "2024-09-17T13:51:42.862Z",
//   "indexedAt": "2024-09-17T13:57:17.752Z",
//   "handle": "robin.berjon.com"
// }
