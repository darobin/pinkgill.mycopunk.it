
import { LitElement, html, css, nothing } from 'lit';
import { MultiStoreController } from "@nanostores/lit";
import { $activeWish, stopWishing } from '../store/wishes.js';
import { makeInstantiationStores } from '../store/tiles.js';
import { refreshTimeline } from '../store/timeline.js';
import { buttons } from './styles.js';

class PinkgillWishDialog extends LitElement {
  static styles = [css`
      sl-dialog {
        --width: 600px;
      }
      sl-dialog::part(body) {
        padding: 0;
      }
    `,
    buttons
  ];
  // XXX this is wrong
  #instantiationData = makeInstantiationStores();
  #controller = new MultiStoreController(this, [this.#instantiationData.$instanceDone, this.#instantiationData.$instanceLoading, this.#instantiationData.$instanceError, $activeWish]);
  async handleGrantWish () {
    const { wish, tile } = $activeWish.get();
    if (wish?.can == 'instantiate') {
      const data = await this.shadowRoot.querySelector('pg-tile')?.getInstanceData();
      if (!data) return; // XXX need to handle errors here
      console.warn(`we have instance data`, data);
      // XXX FIX THIS
      // XXX we just use the name from the manifest (all tiles need names), maybe this can be editable or optional
      await this.#instantiationData.createInstance({ data, tile: tile.uri, name: tile.manifest.name });
      if (this.#instantiationData.$instanceDone.get() && !this.#instantiationData.$instanceError.get()) {
        stopWishing();
        await refreshTimeline();
      }
    }
  }
  render () {
    const { wish, tile } = $activeWish.get();
    // we only know the one type for now
    if (wish?.can !== 'instantiate') return nothing;
    const err = this.#instantiationData.$instanceError.get();
    const label = "Post";
    return html`<sl-dialog label=${tile.manifest.name} ?open=${!!wish} @sl-after-hide=${stopWishing}>
      <pg-tile .tile=${tile.uri} .wish=${wish}></pg-tile>
      <sl-alert variant="danger" ?open=${!!err}>
        <sl-icon slot="icon" name="exclamation-triangle"></sl-icon>
        <strong>${err}</strong><br>
        Please try again.
      </sl-alert>
      <div slot="footer">
        <sl-button @click=${stopWishing}>Cancel</sl-button>
        <sl-button class="action" @click=${this.handleGrantWish}>${label}</sl-button>
      </div>
    </sl-dialog>`;
  }
}
customElements.define('pg-wish-dialog', PinkgillWishDialog);
