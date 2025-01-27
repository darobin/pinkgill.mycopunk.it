
import { LitElement, html, css } from 'lit';
import { StoreController } from "@nanostores/lit";
import { refreshTimeline } from '../store/timeline.js';
import { $uiTileOverlayOpen, closeTileOverlay } from '../store/ui.js';
import { $tileUploader, uploadTile, resetTileUploader } from '../store/tile-uploader.js';
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
  #uiTileOverlay = new StoreController(this, $uiTileOverlayOpen);
  #tileUploader = new StoreController(this, $tileUploader);
  handleOverlayClose (ev) {
    if (ev.detail.source === 'overlay') ev.preventDefault();
  }
  async handleCreateTile (ev) {
    const form = ev.target;
    ev.preventDefault();
    const body = new FormData(form);
    await uploadTile(body);
    if (this.#tileUploader.value.done && !this.#tileUploader.value.error) {
      closeTileOverlay();
      form.reset();
      form.querySelector('pg-upload')?.reset();
      await refreshTimeline();
      resetTileUploader();
    }
  }
  render () {
    const overlayOpen = this.#uiTileOverlay.value;
    const err = this.#tileUploader.value.error;
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
