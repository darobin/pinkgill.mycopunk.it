
import { LitElement, html, css } from 'lit';
import { withStores } from "@nanostores/lit";
import { $computedRoute } from '../store/router.js';
import { $identity } from '../store/identity.js';
import { header2, buttons } from './styles.js';

export class PinkgillRoot extends withStores(LitElement, [$computedRoute, $identity]) {
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
      .empty-timeline {
        color: var(--sl-color-neutral-500);
      }
    `,
    header2,
    buttons,
  ];
  render () {
    const route = $computedRoute.get();
    if (route === 'loading') return html`<div class="loading"><pg-loading></pg-loading></div>`;
    if (route === 'login') {
      const errMsg = new URL(window.location).searchParams.get('error');
      return html`<div class="login">
        <sl-card>
          <h2 slot="header">login</h2>
          <sl-alert variant="danger" ?open=${!!errMsg} closable>
            <sl-icon slot="icon" name="exclamation-triangle"></sl-icon>
            <strong>${errMsg}</strong><br>
            Please trying logging in again to continue.
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
        <sl-button @click=${this.handleCreateTile} class="action">
          <sl-icon slot="prefix" name="pencil-square"></sl-icon>
          Create tile
        </sl-button>
      </div>
      <div class="timeline">
        <span class="empty-timeline">Nothing to show.</span>
      </div>
    </div>`;
    return html`<pg-404></pg-404>`;
  }
}

customElements.define('pg-root', PinkgillRoot);
