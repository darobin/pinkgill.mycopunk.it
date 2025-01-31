
import { LitElement, html, css } from 'lit';
import { StoreController } from "@nanostores/lit";
import { $curTile } from '../store/tiles.js';
import { errors } from './styles.js';
import { goto } from '../store/router.js';

export class PinkgillTileViewer extends LitElement {
  #tile = new StoreController(this, $curTile);
  static styles = [
    css`
      :host {
        display: block;
      }
      .loading {
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .empty-timeline {
        color: var(--sl-color-neutral-500);
      }
      .back-nav {
        display: flex;
        align-items: center;
        margin-bottom: 1rem;
      }
      h2 {
        margin: 0;
      }
      sl-icon {
        font-size: 2rem;
      }
      sl-button::part(base) {
        padding-inline-start: 0;
      }
    `,
    errors,
  ];
  handleBack () {
    if (history.length > 1) return history.back();
    goto('home');
  }
  render () {
    const { error, loading, data } = this.#tile.value;
    if (error) return html`<div class="error">${error}</div>`;
    if (loading) return html`<div class="loading"><pg-loading></pg-loading></div>`;
    // Can this actually happen?
    if (!data) return html`<span class="empty-timeline">Nothing to show.</span>`;
    return html`<div>
      <div class="back-nav">
        <sl-button @click=${this.handleBack} variant="text">
          <sl-icon slot="prefix" name="arrow-left-square-fill"></sl-icon>
        </sl-button>
        <h2>Post</h2>
      </div>
      <pg-tile .tile=${data}></pg-tile>
    </div>`;
  }
}

customElements.define('pg-tile-viewer', PinkgillTileViewer);
