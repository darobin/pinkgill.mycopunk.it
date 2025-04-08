
import { LitElement, html, css, nothing } from 'lit';
import { StoreController } from "@nanostores/lit";
import { profile } from '../store.js';

export class PinkgillAvatar extends LitElement {
  #profile = new StoreController(this, profile.store);
  static styles = [
    css`
      :host {
        display: block;
        min-width: 48px;
        min-height: 48px;
      }
      .avatar {
        display: flex;
        gap: var(--sl-spacing-x-small);
        align-items: end;
      }
      .names {
        display: flex;
        flex-direction: column;
        border-bottom: 10px solid var(--electric-bright);
      }
      .displayName {
        font-weight: 500;
        font-family: var(--header-fam);
        font-size: 1.2rem;
      }
      .handle {
        margin-top: -4px;
      }
    `
  ];
  render () {
    const p = this.#profile.value;
    if (!p || !p.available) return nothing;
    const { loading, error, data } = p;
    if (loading) return html`<div class="avatar"><pg-loading></pg-loading></div>`;
    if (error) return html`<div class="avatar"><sl-button href="/login">login</sl-button></div>`;
    return html`<div class="avatar">
      <sl-avatar image=${data.avatar} label=${data.displayName || data.handle}></sl-avatar>
      <div class="names">
        <div class="displayName">${data.displayName || data.handle}</div>
        <div class="handle">${data.handle}</div>
      </div>
    </div>`;
  }
}

customElements.define('pg-avatar', PinkgillAvatar);
