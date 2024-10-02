
import { LitElement, html, css, nothing } from 'lit';
import { MultiStoreController } from '@nanostores/lit';
import { makeTileStores } from '../store/tiles.js';
import { makeInstaller } from '../store/installs.js';

export class PinkgillInstall extends LitElement {
  static properties = {
    tile: { attribute: false },
  };
  static styles = [
    css`
      :host {
        display: block;
        width: 100%;
      }
      sl-details::part(base) {
        border: 0;
      }
      sl-details::part(summary) {
        font-weight: bold;
      }
      sl-details::part(content) {
        padding: 0;
      }
      sl-menu {
        border-radius: 0;
        padding: 0;
        border-left: none;
        border-right: none;
      }
    `,
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
    console.warn(`tile`, this.tile);
    await this.#storeData.loadManifest(this.tile.tile);
  }
  handleWishMenu (ev) {
    console.warn(ev);
  }
  render () {
    if (!this.tile) return nothing;
    // did.plc.izttpdp3l6vss5crelt5kcux.3l4e5yozvmk2j.tile.pinkgill.bast
    const loading = this.#storeData.$manifestLoading.get();
    let content = nothing;
    if (loading) content = html`<pg-loading></pg-loading>`;
    const manifest = this.#storeData.$manifest.get();
    if (!manifest?.wishes) return nothing;
    content = html`<sl-details summary=${manifest.name}>
      <sl-menu @sl-select=${this.handleWishMenu}>
        ${
          manifest.wishes.map((w, idx) => {
            let label = "Wish";
            let icon = "magic";
            if (w.can === 'instantiate') {
              label = w.name || 'New';
              icon = 'plus-square';
            }
            return html`<sl-menu-item value=${idx}>
              ${label}
              ${icon ? html`<sl-icon slot="suffix" name=${icon}></sl-icon>` : nothing}
            </sl-menu-item>`;
          })
        }
        <sl-menu-item value="uninstall">
          Uninstall
          <sl-icon slot="suffix" name="x-lg"></sl-icon>
        </sl-menu-item>
      </sl-menu>
    </sl-details>`;
    // XXX
    // if no wish, generate one that's just view
    // if wishes, summary/details with all wishes listed under (named or generic name)
    // always list name
    return html`<div class="container">${content}</div>`;

    // return until(
    //   (async () => {
    //     const url = await urlForTile(this.tile);
    //     let footer = nothing;
    //     if (isInstallable(this.tile)) {
    //       const error = this.#installerData.$installError.get();
    //       const loading = this.#installerData.$installLoading.get();
    //       footer = html`<div slot="footer">
    //         ${error ? html`<span class="error">${error}</span>` : nothing}
    //         ${html`<sl-button class="action" @click=${this.handleInstall} ?disabled=${loading}>Install</sl-button>`}
    //       </div>`;
    //     }
    //     return this.renderCardContainer(
    //       html`<iframe src=${url} style=${dynHeight ? `--dynamic-height: ${dynHeight}px` : ''}></iframe>`,
    //       footer
    //     );
    //   })()
    // )
  }
}

customElements.define('pg-install', PinkgillInstall);
