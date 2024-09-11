
import { LitElement, html, css } from 'lit';
import { withStores } from "@nanostores/lit";
import { $computedRoute } from '../store/router.js';

export class PinkgillRoot extends withStores(LitElement, [$computedRoute]) {
  static styles = [
    css`
      :host {
        display: block;
      }
      .loading, .login {
        position: absolute;
        top: 0;
        bottom: 0;
        left: 0;
        right: 0;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .login h2 {
        font-family: var(--header-fam);
        font-size: 1rem;
        font-weight: 900;
        text-decoration: underline;
        text-decoration-color: var(--electric-bright);
        text-decoration-thickness: 2px;
        margin: 0;
      }
      .login form {
        display: flex;
        gap: var(--sl-spacing-small);
      }
      .login sl-input {
        min-width: 400px;
      }
    `
  ];
  render () {
    const route = $computedRoute.get();
    switch (route) {
      case 'loading':
        return html`<div class="loading"><pg-loading></pg-loading></div>`;
      case 'login':
          return html`<div class="login">
            <sl-card>
              <h2 slot="header">login</h2>
              <form action="/api/login">
                <sl-input name="handle" placeholder="Enter your handle (e.g. alice.bsky.social)" required></sl-input>
                <sl-button type="submit" variant="primary">Log in</sl-button>
              </form>
            </sl-card>
          </div>`;
      case 'home':
        return html`home`;
      case '404':
      default:
        return html`<pg-404></pg-404>`;
    }
  }
}

customElements.define('pg-root', PinkgillRoot);
