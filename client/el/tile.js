
import { LitElement, html, css } from 'lit';

export class PinkgillTile extends LitElement {
  static properties = {
    tile: { attribute: false },
  };
  static styles = [
    css`
      :host {
        display: block;
      }
    `,
  ];
  render () {
    return html`<pre>${this.tile}</pre>`;
  }
}

customElements.define('pg-tile', PinkgillTile);
