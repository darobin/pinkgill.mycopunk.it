
import { LitElement, html, css } from 'lit';
import { StoreController } from "@nanostores/lit";
import { $curTile } from '../store/tiles.js';
import { errors } from './styles.js';

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
    `,
    errors,
  ];
  render () {
    const { error, loading, data } = this.#tile.value;
    if (error) return html`<div class="error">${error}</div>`;
    if (loading) return html`<div class="loading"><pg-loading></pg-loading></div>`;
    if (!data) return html`<span class="empty-timeline">Nothing to show.</span>`;
    // XXX want to include some kind of navigation back to timeline or profile I think
    return html`<pg-tile .tile=${data}></pg-tile>`;
  }
}

customElements.define('pg-tile-viewer', PinkgillTileViewer);
