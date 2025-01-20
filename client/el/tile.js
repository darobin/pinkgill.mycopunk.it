
import { LitElement, html, css, nothing } from 'lit';
import { until } from 'lit/directives/until.js';
import { StoreController } from '@nanostores/lit';
import { format } from 'timeago.js';
import { urlForTile } from '../store/tiles.js';
// import { isInstallable, makeInstaller, $installs } from '../store/installs.js';
import { $identity } from '../store/identity.js';
import { buttons, errors } from './styles.js';

export class PinkgillTile extends LitElement {
  #identity = new StoreController(this, $identity);
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
      .header {
        display: grid;
        grid-template-areas:
          "a b"
          "c b"
        ;
      }
      h3 {
        grid-area: a;
        font-family: var(--header-fam);
        margin: 0;
        padding-top: 0.5rem;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .menu {
        grid-area: b;
        text-align: right;
        align-content: center;
      }
      .meta {
        grid-area: c;
        padding: 0 0 4px 0;
        letter-spacing: 0;
        font-size: 15px;
        line-height: 20px;
        font-variant: no-contextual;
      }
      .name {
        text-decoration: none;
        font-weight: 600;
        color: inherit;
      }
      .handle {
        text-decoration: none;
        color: var(--sl-color-neutral-500);
      }
      time {
        color: var(--sl-color-neutral-500);
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
      section:last-of-type .avatar {
        background: none;
      }
      sl-icon-button {
        font-size: 1.4rem;
      }
      sl-dropdown > sl-button::part(base) {
        border: none;
      }
      iframe {
        width: 100%;
        height: var(--dynamic-height, 500px);
        border: 0;
      }
      .footer {
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
  async handleContextual (evt) {
    const item = evt?.detail?.item?.value;
    if (item === 'delete') {
      // XXX
      // note that we don't delete anything, we just mark as deleted
      // otherwise, you could uninstall an original tile and kill all its instances
      alert('Delete!');
    }
  }
  renderContainer (content, footer) {
    console.warn(this.tile, this.wish);
    // XXX Not sure why this branch
    if (this.wish?.can === 'instantiate') return html`<div>${content}</div>`
    const manifest = this.tile?.manifest;
    const profile = this.tile?.profile;
    const canDelete = (this.#identity.value.did === profile?.did);
    let menu = nothing;
    if (canDelete) {
      menu = html`<sl-dropdown placement="bottom-end">
        <sl-button slot="trigger" caret></sl-button>
        <sl-menu @sl-select=${this.handleContextual}>
          <sl-menu-item value="delete">Delete Tile</sl-menu-item>
        </sl-menu>
      </sl-dropdown>`;
    }
    return html`<section>
    <div class="avatar">
      <a href=${`/user/${profile?.handle}`}><img src=${profile?.avatar} alt=${profile?.displayName || profile?.handle}></a>
    </div>
    <div class="post">
      <div class="header">
        <h3>${manifest.name}</h3>
        <div class="meta">
          <a href=${`/user/${profile?.handle}`} class="name">${profile?.displayName || profile?.handle}</a>
          <a href=${`/user/${profile?.handle}`} class="handle">@${profile?.handle}</a>
          ·
          <time datetime=${this.tile?.createdAt}>${format(this.tile?.createdAt)}</time></a>
        </div>
        <div class="menu">${menu}</div>
      </div>
      <div class="content">${content || nothing}</div>
      ${footer ? html`<div class="footer">${footer}</div>` : nothing}
    </div>
  </section>`;
  }
  getWindow () {
    return this.shadowRoot.querySelector('pg-tile-loader')?.getWindow();
  }
  render () {
    if (!this.tile) return nothing;
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
      dynHeight = Math.ceil(ownHeight);
    }
    return until(
      (async () => {
        const url = await urlForTile(this.tile);
        let footer = nothing;
        // XXX need to reconnect installation
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
