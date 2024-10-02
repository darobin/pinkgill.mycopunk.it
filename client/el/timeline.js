
import { LitElement, html, css } from 'lit';
import { withStores } from "@nanostores/lit";
import { $timeline, $timelineError, $timelineLoading } from '../store/timeline.js';
import { errors } from './styles.js';

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
      .empty-timeline {
        color: var(--sl-color-neutral-500);
      }
      pg-tile {
        margin-bottom: var(--sl-spacing-medium);
      }
    `,
    errors,
  ];
  constructor () {
    super();
    this.handleMessageDispatching = this.handleMessageDispatching.bind(this);
  }
  connectedCallback () {
    super.connectedCallback();
    window.addEventListener('message', this.handleMessageDispatching);
  }
  disconnectedCallback () {
    super.disconnectedCallback();
    window.removeEventListener('message', this.handleMessageDispatching);
  }
  async handleMessageDispatching (ev) {
    const tile = [...this.shadowRoot.querySelectorAll('pg-tile')].find(t => t.getWindow() === ev.source);
    if (!tile) return;
    await tile.handleMessage(ev);
  }
  render () {
    const error = $timelineError.get();
    if (error) return html`<div class="error">${error}</div>`;
    if ($timelineLoading.get()) return html`<div class="loading"><pg-loading></pg-loading></div>`;
    const tiles = $timeline.get();
    if (!tiles?.length) return html`<span class="empty-timeline">Nothing to show.</span>`;
    return tiles.map(tile => html`<pg-tile .tile=${tile}></pg-tile>`);
  }
}

customElements.define('pg-timeline', PinkgillTimeline);
