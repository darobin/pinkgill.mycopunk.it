
import { LitElement, html, css } from 'lit';
import { withStores } from "@nanostores/lit";
import { $installs, $installsError, $installsLoading } from '../store/installs.js';
import { header2, buttons } from './styles.js';

export class PinkgillInstalledPalette extends withStores(LitElement, [$installs, $installsError, $installsLoading]) {
  static styles = [
    css`
      :host {
        display: block;
      }
      sl-card {
        width: 100%;
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
    `,
    header2,
    buttons,
  ];
  render () {
    let content = html`<li class="no-results">No installed tiles.</li>`;
    if ($installsLoading.get()) content = html`<pg-loading></pg-loading>`;
    else if ($installsError.get()) content = html`<span class="error">${$installsError.get()}</span>`;
    else if ($installs.get().length) content = html`<ul>${$installs.get().map(it => html`<li><pg-install .tile=${it}></pg-install></li>`)}</ul>`;
    return html`<sl-card>
      <h2 slot="header">installed tiles</h2>
      ${content}
    </sl-card>`;
  }
}

customElements.define('pg-installed-palette', PinkgillInstalledPalette);
