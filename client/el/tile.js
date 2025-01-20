
import { LitElement, html, css, nothing } from 'lit';
import { until } from 'lit/directives/until.js';
import { MultiStoreController } from '@nanostores/lit';
import { format } from 'timeago.js';
import { urlForTile } from '../store/tiles.js';
// import { isInstallable, makeInstaller, $installs } from '../store/installs.js';
import { buttons, errors } from './styles.js';

export class PinkgillTile extends LitElement {
  static properties = {
    tile: { attribute: false },
    wish: { attribute: false },
  };
  static styles = [
    css`
      :host {
        display: block;
        width: 100%;
      }
      section {
        display: flex;
      }
      .avatar {
        padding: 1rem 0;
        width: 42px;
        min-width: 42px;
        background: linear-gradient(to right, #fff, #fff 19px, #cad2da 20px, #cad2da 21px, #fff 22px);
      }
      .avatar img {
        width: 100%;
        border-radius: 50%;
      }
      .avatar a {
        display: inline-flex;
        border-bottom: #fff solid 5px;
        border-top: #fff solid 5px;
      }
      .post {
        flex-grow: 1;
        margin-left: 12px;
      }
      .meta {
        padding:calc(1rem + 5px) 0 4px 0;
        letter-spacing: 0;
        font-size: 15px;
        line-height: 20px;
        font-variant: no-contextual;
      }
      .meta a:nth-child(1) {
        text-decoration: none;
        font-weight: 600;
        color: inherit;
      }
      .meta a:nth-child(2) {
        text-decoration: none;
        color: var(--slight-shade);
      }
      .meta a:nth-child(3) {
        text-decoration: none;
        color: var(--slight-shade);
      }
      .meta a:hover {
        text-decoration: underline;
      }
      .content {
        box-sizing: border-box;
        border: 1px solid var(--sl-color-gray-300);
      }
      section:first-of-type .avatar {
        padding: 0;
      }
      section:first-of-type .meta {
        padding-top: 5px;
      }
      section:last-of-type .avatar {
        background: none;
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
      sl-card::part(footer) {
        padding: var(--sl-spacing-x-small);
      }
      sl-icon-button {
        font-size: 1.4rem;
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
  // #installerData = makeInstaller();
  // #controller = new MultiStoreController(this, [
  //   $installs,
  //   this.#storeData.$manifest,
  //   this.#storeData.$manifestLoading,
  //   this.#storeData.$manifestError,
  //   this.#installerData.$installDone,
  //   this.#installerData.$installLoading,
  //   this.#installerData.$installError,
  // ]);
  #dataResolver = null;
  async connectedCallback () {
    super.connectedCallback();
    if (!this.tile) return;
    // await this.#storeData.loadManifest(this.tile);
  }
  async handleMessage (ev) {
    if (ev.source !== this.getWindow()) return;
    const { data } = ev;
    if (data?.action === 'wish-receiving') {
      let mode = 'bare';
      if (this.wish?.can === 'instantiate') mode = 'instantiate';
      ev.source.postMessage({
        action: 'make-wish-ready',
        payload: {
          mode,
        },
      }, ev.origin);
    }
    else if (data?.action === 'got-data' && this.#dataResolver) {
      this.#dataResolver(data.data);
    }
  }
  postMessage (data) {
    return this.shadowRoot.querySelector('pg-tile-loader')?.postMessage(data);
  }
  async getInstanceData () {
    if (this.wish?.can !== 'instantiate') return;
    const { promise, resolve } = Promise.withResolvers();
    this.#dataResolver = resolve;
    setTimeout(() => this.postMessage({ action: 'get-data' }), 0);
    return await promise;
  }
  async handleInstall () {
    if (!this.tile) return;
    alert('Installation has been disconnected');
    // await this.#installerData.installTile(this.tile);
  }
  renderContainer (content, footer) {
    console.warn(this.tile, this.wish);
    // Not sure why this branch
    if (this.wish?.can === 'instantiate') return html`<div>${content}</div>`
    // using .get is wrong
    // const manifest = this.tile?.manifest;
    const profile = this.tile?.profile;
    return html`<section>
    <div class="avatar">
      <a href=${`/user/${profile?.handle}`}><img src=${profile?.avatar} alt=${profile?.displayName || profile?.handle}></a>
    </div>
    <div class="post">
      <div class="meta">
        <a href=${`/user/${profile?.handle}`}>${profile?.displayName || profile?.handle}</a>
        <a href=${`/user/${profile?.handle}`}>@${profile?.handle}</a>
        ·
        <time datetime=${this.tile?.createdAt}>${format(this.tile?.createdAt)}</time></a>
      </div>
      <div class="content">${content || nothing}</div>
      ${footer ? html`<div class="footer">${footer}</div>` : nothing}

    </div>
  </section>`;
    // const manifest = this.#storeData.$manifest.get();
    // return html`<sl-card>
    //   <div slot="header">
    //     <h3>${manifest.name}</h3>
    //     <span class="handle">@${manifest.handle}</span>
    //     <time datetime=${manifest.createdAt}>${manifest.createdAt}</time>
    //   </div>
    //   ${content || nothing}
    //   ${footer || nothing}
    // </sl-card>`;
  }
  getWindow () {
    return this.shadowRoot.querySelector('pg-tile-loader')?.getWindow();
  }
  render () {
    if (!this.tile) return nothing;
    // did.plc.izttpdp3l6vss5crelt5kcux.3l4e5yozvmk2j.tile.pinkgill.bast
    let dynHeight;
    const manifest = this.tile?.manifest;
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
        // if (isInstallable(this.tile)) {
        //   const error = this.#installerData.$installError.get();
        //   const loading = this.#installerData.$installLoading.get();
        //   footer = html`<div slot="footer">
        //     ${error ? html`<span class="error">${error}</span>` : nothing}
        //     ${html`<sl-icon-button name="bookmark-plus" @click=${this.handleInstall} ?disabled=${loading} label="Install"></sl-icon-button>`}
        //   </div>`;
        // }
        return this.renderContainer(
          html`<pg-tile-loader .parent=${this} .dynHeight=${dynHeight} .url=${url}></pg-tile-loader>`,
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
