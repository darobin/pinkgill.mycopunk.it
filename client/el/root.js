
import { LitElement, html, css } from 'lit';
import { withStores } from "@nanostores/lit";
import { $computedRoute } from '../store/router.js';
import { $uiTileOverlayOpen, openTileOverlay } from '../store/ui.js';
import { getMatchingActiveTile } from '../store/tiles.js';
import { buttons } from './styles.js';

export class PinkgillRoot extends withStores(LitElement, [$computedRoute, $uiTileOverlayOpen]) {
  static styles = [
    css`
      :host {
        display: block;
      }
      .login, .loading {
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      ul {
        padding: 0;
        margin: 0;
      }
      li.no-results {
        list-style-type: none;
        padding: 0;
        color: var(--sl-color-neutral-500);
      }
      .home {
        display: flex;
        margin-top: var(--sl-spacing-large);
        gap: var(--sl-spacing-medium);
        height: 100%;
      }
      .sidebar {
        width: 220px;
      }
      .sidebar sl-card, .sidebar pg-installed-palette {
        width: 100%;
        margin-bottom: var(--sl-spacing-medium);
      }
      .sidebar sl-button {
        width: 100%;
      }
      .primary {
        flex-grow: 1;
      }
    `,
    buttons,
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
    const tile = getMatchingActiveTile(ev.source);
    if (!tile) return;
    await tile.handleMessage(ev);
  }
  render () {
    const route = $computedRoute.get()?.route;
    const overlayOpen = $uiTileOverlayOpen.get();
    if (route === 'loading') return html`<div class="loading"><pg-loading></pg-loading></div>`;
    if (route === 'login') return html`<div class="login"><pg-login></pg-login></div>`;
    if (route === 'home' || route === 'tile') return html`<div class="home">
      <div class="sidebar">
        <pg-installed-palette></pg-installed-palette>
        <sl-button @click=${openTileOverlay} class="action" ?disabled=${overlayOpen}>
          <sl-icon slot="prefix" name="pencil-square"></sl-icon>
          Create tile
        </sl-button>
      </div>
      <div class="primary">
        ${
          {
            home: html`<pg-timeline></pg-timeline>`,
            tile: html`<pg-tile-viewer></pg-tile-viewer>`,
          }[route]
        }
      </div>
      <pg-create-tile-dialog></pg-create-tile-dialog>
      <pg-wish-dialog></pg-wish-dialog>
    </div>`;

    return html`<pg-404></pg-404>`;
  }
}

customElements.define('pg-root', PinkgillRoot);
