
import { LitElement, html, css } from 'lit';
import { StoreController } from "@nanostores/lit";
import { $router, actorProfile, currentTile, goto, link } from '../store.js';

export class PinkgillProfile extends LitElement {
  #actorProfile = new StoreController(this, actorProfile.store);
  #currentTile = new StoreController(this, currentTile.store);
  #router = new StoreController(this, $router);
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
      .profile sl-avatar {
        --bs: 3px;
        --size: max(15%, 90px);
        /* max-width: max(15%, 90px);
        max-height: auto;
        border-radius: 50%; */
        margin-top: calc(-1 * max(45px, 7.5%) - var(--bs));
        /* border: var(--bs) solid white; */
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
      .tile-author sl-avatar {
        --size: 1rem;
      }
      .tile {
        padding-top: 2rem;
      }
      .tile-bar {
        display: flex;
        gap: var(--sl-spacing-small);
      }
      .tile-bar h3 {
        margin: 0;
      }
      .tile-meta {
        font-size: 0.9rem;
      }
      .tile-meta time {
        color: var(--sl-color-neutral-500);
      }
    `,
  ];
  render () {
    // XXX use this later when we also do tiles
    const loading = this.#actorProfile.value.loading || this.#currentTile.value.loading;
    if (loading) return html`<div class="loading"><pg-loading></pg-loading></div>`;
    const route = this.#router.value.route;
    // XXX
    // - if there's a tile
    //    - pg-tile component
    //    - loads iframe https://tile.<domain>/#cid
    //    - that's a static site, with a worker — it operates purely on the tile, no knowledge of the rest apart from loading blobs
    //    - is it possible to inject an API
    //    - right sandbox + CSP options
    // cid,
    // uri: tileURI(did, tid),
    // author,
    // tile,
    // createdAt,
    // indexedAt,
    // - if not
    //    - show tile list!
    //    - store to get that stuff
    //    - blob
    const { handle, displayName, avatar, description, banner } = this.#actorProfile.value?.data || {};
    if (route === 'profile') {
      return html`<div class="profile">
        <div style=${`--banner: url(${banner})`} class="banner"></div>
        <sl-avatar image=${avatar} label=${displayName || handle}></sl-avatar>
        <!-- <img src=${avatar} class="avatar"> -->
        <h2>${displayName}</h2>
        <span class="handle">@${handle}</span>
        <p class="description">${description}</p>
      </div>`;
    }
    else {
      const { cid, author, tile: { name, icons } = {}, createdAt } = this.#currentTile.value?.data || {};
      if (author && author?.handle !== handle) goto(route, { handle, cid });
      const icon = (icons?.[0]?.src?.$link) ? `/xrpc/space.polypod.getBlob?cid=${icons[0].src.$link}` : null;
      return html`<div class="tile">
        <div class="tile-bar">
          <div class="tile-icon">
            <sl-avatar image=${icon} label=${name}><sl-icon name="window" slot="icon"></sl-icon></sl-avatar>
          </div>
          <div class="tile-meta">
            <h3>${name}</h3>
            <div class="tile-author">
              <sl-avatar image=${avatar} label=${displayName || handle}></sl-avatar>
              <span class="displayName">${displayName}</span>
              (<a href=${link('profile', { handle })}>@${handle}</a>)
              •
              <time datetime=${createdAt}>${createdAt}</time>
            </div>
          </div>
        </div>
        <div class="tile-body">
          <pg-tile-loader cid=${cid}></pg-tile-loader>
        </div>
        <div class="tile-footer">
          <!-- (un)install -->
          <!-- edit -->
          <!-- reload -->
        </div>
      </div>`;
    }
  }
}

customElements.define('pg-profile', PinkgillProfile);
