
import { LitElement, html, css } from 'lit';
import { StoreController } from "@nanostores/lit";
import { $installs } from '../store/installs.js';
import { header2, buttons } from './styles.js';

export class PinkgillInstalledPalette extends LitElement {
  #installs = new StoreController(this, $installs);
  static styles = [
    css`
      :host {
        display: block;
      }
      sl-card {
        width: 100%;
      }
      sl-card::part(body) {
        padding: 0;
      }
      ul {
        padding: 0;
        margin: 0;
        list-style-type: none;
      }
      li.no-results {
        list-style-type: none;
        padding: var(--sl-spacing-medium);
        color: var(--sl-color-neutral-500);
      }
    `,
    header2,
    buttons,
  ];
  render () {
    let content = html`<li class="no-results">No installed tiles.</li>`;
    const { loading, error, data } = this.#installs.value;
    if (loading) content = html`<pg-loading></pg-loading>`;
    else if (error) content = html`<span class="error">${error}</span>`;
    else if (data?.length) content = html`<ul>${data.map(it => html`<li><pg-install .tile=${it}></pg-install></li>`)}</ul>`;
    return html`<sl-card>
      <h2 slot="header">installed tiles</h2>
      ${content}
    </sl-card>`;
  }
}

customElements.define('pg-installed-palette', PinkgillInstalledPalette);
