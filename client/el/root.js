
import { LitElement, html, css } from 'lit';
import { StoreController } from "@nanostores/lit";
import { profile, $router } from '../store.js';
import { getMatchingActiveTile } from '../store/tiles.js';
import { buttons } from './styles.js';

export class PinkgillRoot extends LitElement {
  #profile = new StoreController(this, profile.store);
  #router = new StoreController(this, $router);
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
        display: flex;
        flex-direction: column;
        width: 220px;
        overflow-y: auto;
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
        overflow-y: auto;
      }
      footer {
        padding: var(--sl-spacing-small) 0;
        flex-grow: 1;
        align-content: end;
        font-size: 0.8rem;
      }
      a {
        color: var(--electric-dark);
        text-decoration-thickness: 1px;
        text-decoration-color: var(--electric-bright);
        transition: text-decoration-thickness .2s;
      }
      a:hover {
        text-decoration-thickness: 3px;
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
    const route = this.#router.value.route;
    const loading = this.#profile.value.loading;
    if (loading) return html`<div class="loading"><pg-loading></pg-loading></div>`;
    if (route === 'login') return html`<div class="login"><pg-login></pg-login></div>`;
    if (route === 'profile' || route === 'tile') return html`<pg-profile></pg-profile>`;
    if (route === 'new' || route === 'edit') return html`<pg-tile-editor></pg-tile-editor>`;
    return html`<pg-404></pg-404>`;
  }
}

customElements.define('pg-root', PinkgillRoot);
