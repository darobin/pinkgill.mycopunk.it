
import { LitElement, html, css, nothing } from 'lit';
import { withStores } from "@nanostores/lit";
import { $identity } from '../store/identity.js';

export class PinkgillAvatar extends withStores(LitElement, [$identity]) {
  static styles = [
    css`
      :host {
        display: block;
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
    const identity = $identity.get();
    const img = `https://cdn.bsky.app/img/avatar/plain/${identity.did}/${identity.avatar?.ref?.$link}@jpeg`;
    if (!identity) return nothing;
    return html`<div class="avatar">
      <sl-avatar image=${img} label=${identity.displayName}></sl-avatar>
      <div class="names">
        <div class="displayName">${identity.displayName}</div>
        <div class="handle">${identity.handle}</div>
      </div>
    </div>`;
  }
}

customElements.define('pg-avatar', PinkgillAvatar);
