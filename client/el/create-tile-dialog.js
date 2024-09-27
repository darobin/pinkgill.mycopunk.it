
import { LitElement, html, css } from 'lit';
import { withStores } from "@nanostores/lit";
import { refreshTimeline } from '../store/timeline.js';
import { $uiTileOverlayOpen, closeTileOverlay } from '../store/ui.js';

class PinkgillCreateTileDialog extends withStores(LitElement, [$uiTileOverlayOpen]) {
  static properties = {
    uploadError: { state: true },
  };
  static styles = css`
    sl-dialog {
      --width: 600px;
    }
    sl-dialog sl-input {
      margin-bottom: var(--sl-spacing-small);
    } 
  `;
  constructor () {
    super();
    this.uploadError = '';
  }
  handleOverlayClose (ev) {
    if (ev.detail.source === 'overlay') ev.preventDefault();
  }
  // XXX REFACTOR this should really be mostly in the store
  async handleCreateTile (ev) {
    const form = ev.target;
    this.uploadError = '';
    ev.preventDefault();
    const body = new FormData(form);
    const res = await fetch('/api/tile', {
      method: 'post',
      body,
    });
    if (res.ok && res.status < 400) {
      closeTileOverlay();
      form.reset();
      form.querySelector('pg-upload')?.reset();
      await refreshTimeline();
    }
    else {
      console.warn(res);
      const err = await res.json();
      this.uploadError = err.error;
    }
  }
  render () {
    const overlayOpen = $uiTileOverlayOpen.get();
    return html`<sl-dialog label="Create tile" @sl-request-close=${this.handleOverlayClose} ?open=${overlayOpen} @sl-after-hide=${closeTileOverlay}>
      <form @submit=${this.handleCreateTile} id="tile-maker">
        <sl-alert variant="danger" ?open=${!!this.uploadError} closable>
          <sl-icon slot="icon" name="exclamation-triangle"></sl-icon>
          <strong>${this.uploadError}</strong><br>
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
