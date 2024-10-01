
import { LitElement, html, css } from 'lit';
import { MultiStoreController } from "@nanostores/lit";
import { refreshTimeline } from '../store/timeline.js';
import { $uiTileOverlayOpen, closeTileOverlay } from '../store/ui.js';
import { makeTileUploaderStores } from '../store/tiles.js';
import { buttons } from './styles.js';

class PinkgillCreateTileDialog extends LitElement {
  static styles = [css`
      sl-dialog {
        --width: 600px;
      }
      sl-dialog sl-input {
        margin-bottom: var(--sl-spacing-small);
      } 
    `,
    buttons
  ];
  #uploaderData = makeTileUploaderStores();
  #controller = new MultiStoreController(this, [this.#uploaderData.$uploadDone, this.#uploaderData.$uploadLoading, this.#uploaderData.$uploadError, $uiTileOverlayOpen]);
  handleOverlayClose (ev) {
    if (ev.detail.source === 'overlay') ev.preventDefault();
  }
  async handleCreateTile (ev) {
    const form = ev.target;
    ev.preventDefault();
    const body = new FormData(form);
    await this.#uploaderData.uploadTile(body);
    if (this.#uploaderData.$uploadDone.get() && !this.#uploaderData.$uploadError.get()) {
      closeTileOverlay();
      form.reset();
      form.querySelector('pg-upload')?.reset();
      await refreshTimeline();
    }
  }
  render () {
    const overlayOpen = $uiTileOverlayOpen.get();
    const err = this.#uploaderData.$uploadError.get();
    return html`<sl-dialog label="Create tile" @sl-request-close=${this.handleOverlayClose} ?open=${overlayOpen} @sl-after-hide=${closeTileOverlay}>
      <form @submit=${this.handleCreateTile} id="tile-maker">
        <sl-alert variant="danger" ?open=${!!err} closable>
          <sl-icon slot="icon" name="exclamation-triangle"></sl-icon>
          <strong>${err}</strong><br>
          Please try again.
        </sl-alert>
        <sl-input label="Name" name="name" required></sl-input>
        <pg-upload name="tile"></pg-upload>
      </form>
      <div slot="footer">
        <sl-button @click=${closeTileOverlay}>Close</sl-button>
        <sl-button class="action" type="submit" form="tile-maker">Post</sl-button>
      </div>
    </sl-dialog>`;
  }
}
customElements.define('pg-create-tile-dialog', PinkgillCreateTileDialog);
