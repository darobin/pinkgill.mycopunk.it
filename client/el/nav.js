
import { LitElement, html, css } from 'lit';
import { classMap } from 'lit/directives/class-map.js';
import { StoreController } from "@nanostores/lit";
import { profile, $router } from '../store.js';
import navigationalClickHandler from '../lib/nav-click.js';

export class PinkgillNav extends LitElement {
  #profile = new StoreController(this, profile.store);
  #router = new StoreController(this, $router);
  static styles = [
    css`
      :host {
        display: block;
        min-height: var(--min-nav-height);
      }
      nav {
        display: flex;
        align-items: center;
        min-height: var(--min-nav-height);
        padding-right: 0.8rem;
      }
      sl-icon-button {
        font-size: 1.6rem;
      }
      sl-icon-button::part(base) {
        font-size: 1.6rem;
        color: var(--deeper-bright);
      }
      sl-icon-button::part(base):hover {
        font-size: 1.6rem;
        color: var(--electric-bright);
      }
      /* sl-tooltip[disabled] {
        cursor: not-allowed;
      } */
      sl-icon-button[disabled]::part(base), sl-icon-button[disabled]::part(base):hover {
        color: var(--sl-color-neutral-300);
        cursor: not-allowed;
      }
    `
  ];
  render () {
    const p = this.#profile.value;
    // Maybe make this a store, since it's fiddly
    const loggedIn = !!p?.data && !p.loading;
    const { route } = this.#router.value;

    return html`<nav>
      <sl-tooltip content="Home">
        <sl-icon-button
          name="house-fill"
          label="Home"
          href="/"
          class=${classMap({ current: (route === 'home') })}
          @click=${navigationalClickHandler}
          data-route="home"></sl-icon-button>
      </sl-tooltip>
      <sl-tooltip content="New Tile" ?disabled=${!loggedIn}>
        <sl-icon-button
          name="plus-square-fill"
          label="New Tile"
          href="/new"
          class=${classMap({ current: (route === 'new') })}
          ?disabled=${!loggedIn}
          @click=${navigationalClickHandler}
          data-route="new"></sl-icon-button>
      </sl-tooltip>
    </nav>`;
  }
}

customElements.define('pg-nav', PinkgillNav);
