
import { LitElement, html, css, nothing } from 'lit';
import { StoreController } from '@nanostores/lit';
import { makeInstallStore, uninstallTile } from '../store/installs.js';
import { grantWish } from '../store/wishes.js';

export class PinkgillInstall extends LitElement {
  #installStore = makeInstallStore();
  #install = new StoreController(this, this.#installStore);
  static properties = {
    tile: { attribute: false },
    confirmUninstall: { type: Boolean, attribute: false, state: true },
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
  constructor () {
    super();
    this.confirmUninstall = false;
  }
  async handleWishMenu (ev) {
    const value = ev.detail?.item?.value;
    if (!value) return;
    if (value === 'uninstall') {
      this.confirmUninstall = true;
      return;
    }
    if (/^\d+$/.test(value)) {
      const wish = this.tile?.manifest?.wishes?.[parseInt(value, 10)];
      if (!wish) return;
      await grantWish(wish, this.tile);
      console.warn(`wishing`, wish);
    }
  }
  async handleConfirmUninstall (ev) {
    ev.stopPropagation();
    this.confirmUninstall = false;
    if (!this.tile) return;
    await uninstallTile(this.#installStore, this.tile);
  }
  handleCancelUninstall (ev) {
    ev.stopPropagation();
    this.confirmUninstall = false;
  }
  render () {
    if (!this.tile) return nothing;
    // did.plc.izttpdp3l6vss5crelt5kcux.3l4e5yozvmk2j.tile.pinkgill.bast
    // const loading = this.#storeData.$manifestLoading.get();
    const loading = false;
    let content = nothing;
    if (loading) content = html`<pg-loading></pg-loading>`;
    if (!this.tile.manifest?.wishes) return nothing;
    content = html`<sl-details summary=${this.tile.manifest.name}>
      <sl-menu @sl-select=${this.handleWishMenu}>
        ${
          this.tile.manifest.wishes.map((w, idx) => {
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
          ${
            this.confirmUninstall
              ? html`
                  <sl-button size="small" variant="primary" @click=${this.handleConfirmUninstall}>Ok</sl-button>
                  <sl-button size="small" variant="danger" @click=${this.handleCancelUninstall}>Cancel</sl-button>`
              : 'Uninstall'

          }
          <sl-icon slot="suffix" name="x-lg"></sl-icon>
        </sl-menu-item>
      </sl-menu>
    </sl-details>`;
    return html`<div class="container">${content}</div>`;
  }
}

customElements.define('pg-install', PinkgillInstall);
