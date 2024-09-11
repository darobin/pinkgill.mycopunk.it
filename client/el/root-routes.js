
import { LitElement, html, css } from 'lit';
import { withStores } from "@nanostores/lit";
import { $computedRoute } from '../store/router.js';

export class PinkgillRoot extends withStores(LitElement, [$computedRoute]) {
  static styles = [
    css`
      :host {
        display: block;
      }
      .loading {
        position: absolute;
        top: 0;
        bottom: 0;
        left: 0;
        right: 0;
        display: flex;
        align-items: center;
        justify-content: center;
      }
    `
  ];
  render () {
    const route = $computedRoute.get();
    switch (route) {
      case 'loading':
        return html`<div class="loading"><pg-loading></pg-loading></div>`;
      case 'login':
          return html`login`;
      case 'home':
        return html`home`;
      case '404':
      default:
        return html`<pg-404></pg-404>`;
    }
  }
}

customElements.define('pg-root', PinkgillRoot);
