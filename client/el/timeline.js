
import { LitElement, html, css } from 'lit';
import { StoreController } from "@nanostores/lit";
import { $timeline } from '../store/timeline.js';
import { errors } from './styles.js';

export class PinkgillTimeline extends LitElement {
  #timeline = new StoreController(this, $timeline);
  static styles = [
    css`
      :host {
        display: block;
        height: 100%;
        overflow-y: auto;
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
      pg-tile {
        margin-bottom: var(--sl-spacing-medium);
      }
    `,
    errors,
  ];
  render () {
    const { error, loading, data } = this.#timeline.value;
    if (error) return html`<div class="error">${error}</div>`;
    if (loading) return html`<div class="loading"><pg-loading></pg-loading></div>`;
    if (!data?.length) return html`<span class="empty-timeline">Nothing to show.</span>`;
    return data.map(tile => html`<pg-tile .tile=${tile}></pg-tile>`);
  }
}

customElements.define('pg-timeline', PinkgillTimeline);
