
import { LitElement, html, css, nothing } from 'lit';
import { withStores } from "@nanostores/lit";
import { $timeline, $timelineError, $timelineLoading } from '../store/timeline.js';

export class PinkgillTimeline extends withStores(LitElement, [$timeline, $timelineError, $timelineLoading]) {
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
      .error {
        color: var(--sl-color-danger-500);
      }
      .empty-timeline {
        color: var(--sl-color-neutral-500);
      }
    `,
  ];
  render () {
    const error = $timelineError.get();
    if (error) return html`<div class="error">${error}</div>`;
    if ($timelineLoading.get()) return html`<div class="loading"><pg-loading></pg-loading></div>`;
    const tiles = $timeline.get();
    if (!tiles?.length) return html`<span class="empty-timeline">Nothing to show.</span>`;
    return tiles.map((tile, idx) => {
      const div = idx ? html`<sl-divider></sl-divider>` : nothing;
      return html`
        ${div}
        <pg-tile tile=${tile}></pg-tile>
      `;
    });
  }
}

customElements.define('pg-timeline', PinkgillTimeline);
