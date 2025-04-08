
import { LitElement, html, css, nothing } from 'lit';
import { StoreController } from "@nanostores/lit";
import { profile, goto } from '../store.js';

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
  handleSelect (evt) {
    console.warn(`handle select ${evt?.detail?.item?.value}`);
    const item = evt?.detail?.item?.value;
    if (item === 'profile') return goto('profile', { handle: this.#profile.value.data.handle });
    if (item === 'logout') window.location = '/logout';
  }
  render () {
    const p = this.#profile.value;
    if (!p || !p.available) return nothing;
    const { loading, error, data } = p;
    if (loading) return html`<div class="avatar"><pg-loading></pg-loading></div>`;
    if (error) return html`<div class="avatar"><sl-button href="/login">login</sl-button></div>`;
    return html`<sl-dropdown placement="bottom-end">
      <div slot="trigger" class="avatar">
        <sl-avatar image=${data.avatar} label=${data.displayName || data.handle}></sl-avatar>
        <div class="names">
          <div class="displayName">${data.displayName || data.handle}</div>
          <div class="handle">${data.handle}</div>
        </div>
      </div>
      <sl-menu @sl-select=${this.handleSelect}>
        <sl-menu-item value="profile">Profile</sl-menu-item>
        <sl-menu-item value="logout">Logout</sl-menu-item>
      </sl-menu>
    </sl-dropdown>`;
  }
}

customElements.define('pg-avatar', PinkgillAvatar);
