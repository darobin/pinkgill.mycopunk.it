
import { LitElement, html, css } from 'lit';
import { StoreController } from "@nanostores/lit";
import { actorProfile } from '../store.js';

export class PinkgillProfile extends LitElement {
  #actorProfile = new StoreController(this, actorProfile.store);
  // #router = new StoreController(this, $router);
  static styles = [
    css`
      :host {
        display: block;
      }
      .loading {
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .profile {
        position: relative;
      }
      .banner {
        width: 100%;
        aspect-ratio: 4;
        background: var(--banner, var(--electric-bright));
        background-position: left 50% top 50%;
        background-size: cover;
      }
      .avatar {
        --bs: 3px;
        max-width: max(15%, 90px);
        max-height: auto;
        border-radius: 50%;
        margin-top: calc(-1 * max(45px, 7.5%) - var(--bs));
        border: var(--bs) solid white;
        margin-left: 1rem;
      }
      h2 {
        font-family: var(--header-fam);
        font-size: 1.8rem;
        margin: 0 0 0 1rem;
      }
      .handle {
        margin-left: 1rem;
        color: var(--sl-color-neutral-600);
      }
      p.description {
        white-space: pre-wrap;
        overflow-wrap: break-word;
        overflow: hidden;
        text-overflow: ellipsis;
        margin-left: 1rem;
      }
    `,
  ];
  render () {
    // XXX use this later when we also do tiles
    // const route = this.#router.value.route;
    // XXX
    // - if there's a tile
    //    - this doesn't render the full header
    //    - check that the CID really belongs to this person
    //    - pg-tile component
    //    - loads iframe https://tile.<domain>/#cid
    //    - that's a static site, with a worker — it operates purely on the tile, no knowledge of the rest
    const loading = this.#actorProfile.value.loading;
    if (loading) return html`<div class="loading"><pg-loading></pg-loading></div>`;
    const { handle, displayName, avatar, description, banner } = this.#actorProfile.value?.data || {};
    return html`<div class="profile">
      <div style=${`--banner: url(${banner})`} class="banner"></div>
      <img src=${avatar} class="avatar">
      <h2>${displayName}</h2>
      <span class="handle">@${handle}</span>
      <p class="description">${description}</p>
    </div>`;
  }
}

customElements.define('pg-profile', PinkgillProfile);
