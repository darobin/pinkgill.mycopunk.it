
import { LitElement, html, css } from 'lit';
import { ifDefined } from 'lit/directives/if-defined.js';
import { header2, buttons } from './styles.js';

class PinkgillLogin extends LitElement {
  static styles = [
    css`
      :host {
        display: block;
      }
      form {
        display: flex;
        gap: var(--sl-spacing-small);
      }
      sl-input {
        min-width: 400px;
      }
      sl-alert {
        min-width: 400px;
        margin-bottom: var(--sl-spacing-small);
      }
    `,
    header2,
    buttons,
  ];
  render () {
    const errMsg = new URL(window.location).searchParams.get('error');
    const match = (document.cookie || '').match(/\bhandle=([\w.-]+)\b/);
    let handle;
    if (match) handle = match[1];
    return html`<sl-card>
      <h2 slot="header">login</h2>
      <sl-alert variant="danger" ?open=${!!errMsg} closable>
        <sl-icon slot="icon" name="exclamation-triangle"></sl-icon>
        <strong>${errMsg}</strong><br>
        Please try logging in again to continue.
      </sl-alert>
      <form action="/api/login" method="post">
        <sl-input name="handle" placeholder="Enter your handle (e.g. alice.bsky.social)" value=${ifDefined(handle)} required></sl-input>
        <sl-button type="submit" class="action">Log in</sl-button>
      </form>
    </sl-card>`;
  }
}
customElements.define('pg-login', PinkgillLogin);
