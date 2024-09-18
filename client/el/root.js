
import { LitElement, html, css } from 'lit';
import { withStores } from "@nanostores/lit";
import { $computedRoute } from '../store/router.js';
import { $identity } from '../store/identity.js';
import { $uiTileOverlayOpen, openTileOverlay, closeTileOverlay } from '../store/ui.js';
import { refreshTimeline } from '../store/timeline.js';
import { header2, buttons } from './styles.js';

export class PinkgillRoot extends withStores(LitElement, [$computedRoute, $identity, $uiTileOverlayOpen]) {
  static properties = {
    uploadError: { state: true },
  };
  static styles = [
    css`
      :host {
        display: block;
      }
      .loading, .login {
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .login form {
        display: flex;
        gap: var(--sl-spacing-small);
      }
      .login sl-input {
        min-width: 400px;
      }
      .login sl-alert {
        min-width: 400px;
        margin-bottom: var(--sl-spacing-small);
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
      .sidebar sl-card {
        width: 100%;
        margin-bottom: var(--sl-spacing-medium);
      }
      .sidebar sl-button {
        width: 100%;
      }
      .timeline {
        flex-grow: 1;
      }
      sl-dialog {
        --width: 600px;
      }
      sl-dialog sl-input {
        margin-bottom: var(--sl-spacing-small);
      } 
    `,
    header2,
    buttons,
  ];
  constructor () {
    super();
    this.uploadError = '';
  }
  handleOverlayClose (ev) {
    if (ev.detail.source === 'overlay') ev.preventDefault();
  }
  async handleCreateTile (ev) {
    this.uploadError = '';
    ev.preventDefault();
    const body = new FormData(ev.target);
    ev.target.querySelector('pg-upload')?.reset();
    const res = await fetch('/api/tile', {
      method: 'post',
      body,
    });
    if (res.ok && res.status < 400) {
      closeTileOverlay();
      ev.target.reset();
      await refreshTimeline();
    }
    else {
      console.warn(res);
      const err = await res.json();
      this.uploadError = err.error;
    }
  }
  render () {
    const route = $computedRoute.get();
    const overlayOpen = $uiTileOverlayOpen.get();
    if (route === 'loading') return html`<div class="loading"><pg-loading></pg-loading></div>`;
    if (route === 'login') {
      const errMsg = new URL(window.location).searchParams.get('error');
      return html`<div class="login">
        <sl-card>
          <h2 slot="header">login</h2>
          <sl-alert variant="danger" ?open=${!!errMsg} closable>
            <sl-icon slot="icon" name="exclamation-triangle"></sl-icon>
            <strong>${errMsg}</strong><br>
            Please try logging in again to continue.
          </sl-alert>
          <form action="/api/login" method="post">
            <sl-input name="handle" placeholder="Enter your handle (e.g. alice.bsky.social)" required></sl-input>
            <sl-button type="submit" class="action">Log in</sl-button>
          </form>
        </sl-card>
      </div>`;
    }
    if (route === 'home') return html`<div class="home">
      <div class="sidebar">
        <sl-card>
          <h2 slot="header">installed tiles</h2>
          <ul>
            <li class="no-results">No installed tiles.</li>
          </ul>
        </sl-card>
        <sl-button @click=${openTileOverlay} class="action" ?disabled=${overlayOpen}>
          <sl-icon slot="prefix" name="pencil-square"></sl-icon>
          Create tile
        </sl-button>
      </div>

      <div class="timeline">
        <pg-timeline></pg-timeline>
      </div>

      <sl-dialog label="Create tile" @sl-request-close=${this.handleOverlayClose} ?open=${overlayOpen} @sl-after-hide=${closeTileOverlay}>
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
      </sl-dialog>
    </div>`;

    return html`<pg-404></pg-404>`;
  }
}

customElements.define('pg-root', PinkgillRoot);
