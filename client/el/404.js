
import { LitElement, html, css } from 'lit';

class Pinkgill404 extends LitElement {
  static styles = css`
    :host {
      display: block;
      color: var(--sl-color-danger-500);
      text-align: center;
      padding: 1.5rem 1rem 1rem 1rem;
    }
  `;
  render () {
    return html`<p>Not all those who wander are lost, but it looks like <em>you</em> are.</p>`;
  }
}
customElements.define('pg-404', Pinkgill404);
