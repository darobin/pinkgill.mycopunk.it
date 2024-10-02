
import { LitElement, html, css, nothing } from 'lit';
import { withStores } from "@nanostores/lit";
import { $activeWish, stopWishing } from '../store/wishes.js';
import { buttons } from './styles.js';

class PinkgillWishDialog extends withStores(LitElement, [$activeWish]) {
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
  handleGrantWish () {
    const { wish } = $activeWish.get();
    if (wish?.can == 'instantiate') {
      // XXX
      // - talk to the tile to get the data
      // - post it as an instance type
    }
  }
  render () {
    const { wish, tileURI, manifest } = $activeWish.get();
    // we only know the one type for now
    if (wish?.can !== 'instantiate') return nothing;
    const label = "Post";
    return html`<sl-dialog label=${manifest.name} ?open=${!!wish} @sl-after-hide=${stopWishing}>
      <pg-tile .tile=${tileURI} .wish=${wish}></pg-tile>
      <div slot="footer">
        <sl-button @click=${stopWishing}>Cancel</sl-button>
        <sl-button class="action" @click=${this.handleGrantWish}>${label}</sl-button>
      </div>
    </sl-dialog>`;
  }
}
customElements.define('pg-wish-dialog', PinkgillWishDialog);
