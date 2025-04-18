
import { LitElement, html, css, nothing } from 'lit';
import { classMap } from 'lit/directives/class-map.js';
import { StoreController } from "@nanostores/lit";
import * as CID from '@atcute/cid';
import mime from 'mime';
import {
  currentTile,
  $router,
  updateCurrentTile,
  addResourceToCurrentTile,
  removeResourceFromCurrentTile,
  addWishToCurrentTile,
  removeWishfromCurrentTile
} from '../store.js';
import client from '../api.js';

const tileFormStyles = css`
  :host {
    display: block;
  }
  sl-input, sl-textarea, sl-select, fieldset, .input-line {
    margin-bottom: 1rem;
  }
  sl-input[type="color"]::part(form-control-input) {
    width: fit-content;
  }
  .input-line label,
  sl-input::part(form-control-label),
  sl-textarea::part(form-control-label),
  sl-select::part(form-control-label) {
    display: block;
    font-weight: bold;
  }
  fieldset {
    border-radius: var(--sl-input-border-radius-medium);
    border: solid var(--sl-input-border-width) var(--sl-input-border-color);
  }
  fieldset legend {
    display: block;
    font-weight: bold;
  }
  .sizes {
    display: flex;
  }
  .action {
    text-align: right;
  }
`;

export class PinkgillTileEditor extends LitElement {
  #tile = new StoreController(this, currentTile.store);
  #router = new StoreController(this, $router);
  static properties = {
    defaultResource: { attribute: false, state: true },
    prevResourceArray: { attribute: false, state: true },
  };
  static styles = [
    tileFormStyles,
    css`
      .wish-line,
      .resource-line {
        display: flex;
        background: var(--sl-color-neutral-100);
        padding: var(--sl-spacing-medium);
        margin-bottom: var(--sl-spacing-medium);
      }
      .wish-line pg-wish-editor,
      .resource-line pg-resource-editor {
        flex-grow: 1;
      }
      .wish-line sl-icon-button,
      .resource-line sl-icon-button {
        font-size: 1.6rem;
        margin: -0.5rem -0.5rem 0.5rem 0.5rem;
      }
    `,
  ];
  handleFormUpdate (ev) {
    const inp = ev.target;
    let name = inp.name;
    let value = inp.value;
    let type = inp.type;
    if (type === 'number' && /^\d+$/.test(value)) value = parseInt(value, 10);
    if (name === 'icons') {
      if (value) {
        name = 'icons[0]';
        value = { src: value };
      }
      else {
        value = [];
      }
    }
    else if (name === 'do-sizing') {
      name = 'sizing';
      const width = document.querySelector('sl-input[name="sizing.width"]')?.value || 1;
      const height = document.querySelector('sl-input[name="sizing.height"]')?.value || 1;
      value = inp.checked ? { width, height } : null;
    }
    else if (/resources\.\w+/.test(name)) {
      name = `resources.${value.name}`; // because it can change
      value = { src: value.src, mediaType: value.mediaType };
    }
    updateCurrentTile(name, value);
  }
  handleDefaultResourceUpdate (ev) {
    this.defaultResource = ev.target.value;
  }
  handleAddResource () {
    addResourceToCurrentTile();
  }
  handleRemoveResource (ev) {
    removeResourceFromCurrentTile(parseInt(ev.target.dataset.idx, 10));
  }
  handleAddWish () {
    addWishToCurrentTile();
  }
  handleRemoveWish (ev) {
    removeWishfromCurrentTile(parseInt(ev.target.dataset.idx, 10));
  }
  willUpdate () {
    const res = this.#tile.value?.data?.resources;
    if (this.prevResourceArray && this.prevResourceArray === res) return;
    console.warn(`res changed`, res?.find(r => r.path === '/'), res?.find(r => r.path === '/index.html'));
    this.prevResourceArray = res;
    if (res?.find(r => r.path === '/')) this.defaultResource = res?.findIndex(r => r.path === '/');
    else if (this.defaultResource != null && res?.find(r => r.path === '/index.html')) {
      this.defaultResource = res?.findIndex(r => r.path === '/index.html');
    }
    console.warn(`dr`, this.defaultResource);
  }
  render () {
    // XXX
    // If not logged in, just show a link to login.
    // Use a cookie to remember where to redirect to upon returning.
    // And make sure to wipe it.
    // XXX
    // NOTE: loading should be handled differently (form disabled, progress show in there)
    // ALSO NOTE: when in edit mode, set a hidden prev
    const mode = (this.#router.value?.route === 'edit') ? 'edit' : 'new';
    // const loading = this.#actorProfile.value.loading;
    const { name, description, background_color, icons, sizing, wishes, resources } = this.#tile.value?.data || {};
    const selectedIcon = icons?.length ? icons[0].src : null;
    // XXX
    // - automatically update currentTile
    // - have that maintain dirty state
    // - validate on save
    return html`<form>
      <h2>${mode === 'edit' ? 'Edit Tile' : 'Create Tile'}</h2>
      <sl-input
        type="text"
        name="name"
        value=${name}
        label="Name"
        helpText="Enter a name for your tile."
        required
        maxlength="300"
        autocomplete="off"
        @sl-input=${this.handleFormUpdate}
      ></sl-input>
      <sl-textarea
        name="description"
        value=${description}
        label="Description"
        helpText="Describe your tile."
        maxlength="300"
        autocomplete="off"
        resize="auto"
        @sl-input=${this.handleFormUpdate}
      ></sl-textarea>
      <div class="input-line">
        <label for="background_color">Background Colour</label>
        <sl-color-picker
          type="color"
          name="background_color"
          value=${background_color}
          label="Pick colour"
          @sl-input=${this.handleFormUpdate}
        ></sl-color-picker>
      </div>
      <!-- note that we can use multiple below, when that becomes desirable -->
      <sl-select
        name="icons"
        value=${selectedIcon}
        label="Icon"
        helpText="Pick an icon from the resources."
        clearable
        @sl-input=${this.handleFormUpdate}
      >${filterImages(resources).map(k => html`<sl-option value=${k.path}>${k.path}</sl-option>`)}</sl-select>
      <fieldset>
        <legend>Sizing</legend>
        <div class="sizes">
          <sl-input
            type="number"
            name="sizing.width"
            value=${sizing?.width}
            label="Width"
            required
            ?disabled=${!sizing}
            min="1"
            autocomplete="off"
            @sl-input=${this.handleFormUpdate}
          ></sl-input>
          <sl-input
            type="number"
            name="sizing.height"
            value=${sizing?.height}
            label="Height"
            required
            ?disabled=${!sizing}
            min="1"
            autocomplete="off"
            @sl-input=${this.handleFormUpdate}
          ></sl-input>
        </div>
        <sl-checkbox
          name="do-sizing"
          ?checked=${!!sizing}
          @sl-input=${this.handleFormUpdate}
          >Include tile sizing</sl-checkbox>
      </fieldset>
      <fieldset>
        <legend>Resources</legend>
        <sl-select
          name="default_resource"
          value=${this.defaultResource}
          label="Default resource"
          helpText="Pick a default resource if none is already '/'."
          required
          @sl-input=${this.handleDefaultResourceUpdate}
        >${resources.filter(r => /^\/[^/]*$/.test(r.path)).map((k, idx) => html`<sl-option value=${idx}>${k.path}</sl-option>`)}</sl-select>
        <!--
        - must have one default path mapping to / (radio? autodetect index.html if so)
        - minimum one
        - plus to add, minus to remove
        -->
        ${(resources || []).map((r, idx) => html`<div class="resource-line">
          <pg-resource-editor name=${`resources[${idx}]`} .value=${r} @input=${this.handleFormUpdate}></pg-resource-editor>
          <sl-icon-button name="x-square" label="Remove resource" data-idx=${idx} @click=${this.handleRemoveResource}></sl-icon-button>
        </div>`)}
        <div class="action">
          <sl-button @click=${this.handleAddResource}>
            <sl-icon slot="prefix" name="plus-square"></sl-icon>
            Add Resource
          </sl-button>
        </div>
      </fieldset>
      <fieldset>
        <legend>Wishes</legend>
        ${(wishes || []).map((w, idx) => html`<div class="wish-line">
          <pg-wish-editor name=${`wishes[${idx}]`} .value=${w} @input=${this.handleFormUpdate}></pg-wish-editor>
          <sl-icon-button name="x-square" label="Remove wish" data-idx=${idx} @click=${this.handleRemoveWish}></sl-icon-button>
        </div>`)}
        <div class="action">
          <sl-button @click=${this.handleAddWish}>
            <sl-icon slot="prefix" name="plus-square"></sl-icon>
            Add Wish
          </sl-button>
        </div>
      </fieldset>

      <hr>
      <pre>${JSON.stringify(this.#tile.value?.data, null, 2)}</pre>
    </form>`;
    // XXX the whole thing is a dropzone and if there's a manifest it just updates the fields from it
  }
}
customElements.define('pg-tile-editor', PinkgillTileEditor);

function filterImages (res) {
  if (!res) return [];
  return res.filter(r => /^image\//.test(r.mediaType));
}

const canVerbs = ['instantiate'];
customElements.define('pg-wish-editor', class extends LitElement {
  static properties = {
    name: { type: String },
    value: { attribute: false, state: true },
  };
  static styles = [tileFormStyles];
  handleWishUpdate (ev) {
    const inp = ev.target;
    if (!this.value) this.value = {};
    let name = inp.name;
    let value = inp.value;
    if (name === 'can' && value === '') value = null;
    this.value = { ...this.value, [name]: value };
    const iev = new InputEvent('input');
    this.dispatchEvent(iev);
  }
  render () {
    return html`<div>
      <sl-select
        name="can"
        value=${this.value?.can}
        label="Can"
        helpText="The wish's verb."
        clearable
        @sl-input=${this.handleWishUpdate}
      >${canVerbs.map(k => html`<sl-option value=${k}>${k}</sl-option>`)}</sl-select>
    </div>`;
  }
});

customElements.define('pg-resource-editor', class extends LitElement {
  static properties = {
    name: { type: String },
    value: { attribute: false, state: true },
  };
  static styles = [
    tileFormStyles,
    css`
      .resource {
        display: flex;
        gap: var(--sl-spacing-medium);
      }
    `,
  ];
  // value is { path, src, mediaType }
  handleResourceUpdate (ev) {
    const inp = ev.target;
    if (!this.value) this.value = {};
    let name = inp.name;
    let value = inp.value;
    this.value = { ...this.value, [name]: value };
    this.dispatchInput();
  }
  handleMimeDetection (ev) {
    const mediaType = ev.detail;
    this.value = { ...this.value, mediaType };
    this.dispatchInput();
  }
  dispatchInput () {
    this.dispatchEvent(new InputEvent('input'));
  }
  render () {
    return html`<div class="resource">
      <sl-input
        type="text"
        name="path"
        value=${this.value.path}
        label="Path"
        helpText="Pick a unique path, starting with /."
        required
        pattern="^/.*"
        maxlength="1024"
        autocomplete="off"
        @sl-input=${this.handleResourceUpdate}
      ></sl-input>
      <sl-input
        type="text"
        name="mediaType"
        value=${this.value.mediaType}
        label="Media type"
        helpText="The MIME type."
        maxlength="300"
        autocomplete="off"
        @sl-input=${this.handleResourceUpdate}
      ></sl-input>
      <pg-cid-uploader
        name="src"
        .value=${this.value.src}
        label="Content"
        @input=${this.handleResourceUpdate}
        @mime-detected=${this.handleMimeDetection}
      ></pg-cid-uploader>
    </div>`;
  }
});

customElements.define('pg-cid-uploader', class extends LitElement {
  static properties = {
    name: { type: String },
    value: { attribute: false, state: true },
    hovering: { type: Boolean, state: true },
    spinning: { type: Boolean, state: true },
    uploading: { type: Boolean, state: true },
    error: { attribute: false, state: true },
  };
  static styles = [
    tileFormStyles,
    css`
      :host {
        width: 100%;
      }
      * {
        box-sizing: border-box;
      }
      label {
        display: block;
        font-weight: bold;
        margin-bottom: var(--sl-spacing-3x-small);
      }
      .drop {
        background-color: var(--sl-color-primary-100);
        color: var(--sl-color-primary-600);
        border-radius: var(--sl-spacing-x-small);
        border: 1px solid var(--sl-color-primary-600);
        padding: 0 var(--sl-spacing-x-large);
        height: var(--sl-input-height-medium);
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .drop.dropping {
        background-color: var(--sl-color-primary-600);
        color: white;
      }
      .drop > span {
        user-select: none;
        pointer-events: none;
      }
      input[type="file"] {
        display: none;
      }
      .cid {
        display: flex;
        border: 1px solid var(--sl-color-neutral-300);
        border-radius: var(--sl-border-radius-small);
        background: white;
        /* padding: var(--sl-spacing-x-small); */
        height: calc(var(--sl-input-height-medium) - var(--sl-input-border-width) * 2);
      }
      .cid > span {
        /* font-size: var(--sl-font-size-small); */
        flex-grow: 1;
        padding: var(--sl-spacing-x-small);
      }
      .ok {
        color: var(--sl-color-success-500);
      }
      .cid sl-icon-button {
        padding: var(--sl-spacing-small);
      }
      .cid sl-icon-button::part(base) {
        padding: 0 var(--sl-spacing-x-small);
      }
      .error {
        display: flex;
        border: 1px solid var(--sl-color-danger-600);
        border-radius: var(--sl-border-radius-small);
        color: var(--sl-color-danger-600);
        background: var(--sl-color-danger-300);
        padding: var(--sl-spacing-medium);
      }
      .error > div {
        flex-grow: 1;
      }
      .error sl-icon-button {
        margin: -0.5rem -0.5rem 0.5rem 0.5rem;
        color: var(--sl-color-danger-600);
      }
    `,
  ];
  hover () {
    this.hovering = true;
  }
  unhover () {
    this.hovering = false;
  }
  handleDragOver (ev) {
    ev.preventDefault();
  }
  handleDragEnter () {
    this.hover();
  }
  handleDragLeave () {
    this.unhover();
  }
  handleClick () {
    this.shadowRoot.getElementById('file').click();
  }
  async handleDrop (ev) {
    ev.preventDefault();
    this.unhover();
    if (ev.dataTransfer.items.length > 1 || ev.dataTransfer.items[0].kind !== 'file') {
      this.error = 'You can only drop one file on a resource.'
      return;
    }
    await this.setFile(ev.dataTransfer.items[0].getAsFile());
  }
  async handleFilePick (ev) {
    const files = ev.target.files;
    if (files.length !== 1) {
      this.error = 'You can only pick one file for a resource.'
      return;
    }
    await this.setFile(files[0]);
  }
  async setFile (file) {
    this.spinning = true;
    const buffer = await file.arrayBuffer();
    const cid = CID.toString(await CID.create(CID.CODEC_RAW, buffer));
    const doneReq = await client.hasBlob({ cid });
    this.spinning = false;
    if (!doneReq.ok) {
      this.error = doneReq.error;
      return;
    }
    const alreadyDone = doneReq.data?.exists;
    if (!alreadyDone) {
      this.uploading = true;
      const res = await client.uploadBlob({ cid }, buffer);
      console.warn(`res`, res);
      this.uploading = false;
      if (!res.ok) {
        this.error = res.error;
        return;
      }
    }
    const mediaType = fileToMediaType(file);
    console.warn(`MT`,mediaType);
    const mimeDetect = new CustomEvent('mime-detected', { detail: mediaType });
    this.dispatchEvent(mimeDetect);
    this.value = { $link: cid };
    this.dispatchInput();
  }
  // value is either null or { $link: cid }
  handleClearCID () {
    this.value = null;
    this.dispatchInput();
  }
  handleClearError () {
    this.error = null;
  }
  dispatchInput () {
    this.dispatchEvent(new InputEvent('input'));
  }
  render () {
    let forValue = nothing;
    let body;
    if (this.error) {
      body = html`<div class="error">
        <div><strong>Error</strong>: ${this.error}</div>
        <sl-icon-button name="x-circle-fill" label="Clear error" @click=${this.handleClearError}></sl-icon-button>
      </div>`
    }
    else if (!this.value?.$link) {
      if (this.spinning) {
        // TODO: we should have a cancel affordance on this
        body = html`
          <div class="drop">
            <pg-loading></pg-loading>
          </div>
        `;
      }
      else if (this.uploading) {
        // TODO: we should have a cancel affordance on this too
        body = html`
          <div class="drop">
            <sl-progress-bar indeterminate></sl-progress-bar>
          </div>
        `;
      }
      else {
        forValue = 'file';
        body = html`
          <div class=${classMap({ drop: true, dropping: this.hovering })}
            @dragover=${this.handleDragOver}
            @dragenter=${this.handleDragEnter}
            @dragleave=${this.handleDragLeave}
            @drop=${this.handleDrop}
            @click=${this.handleClick}
          >
            <span>Drop file or click</span>
          </div>
          <input type="file" name="file" id="file" @change=${this.handleFilePick}>
        `;
      }
    }
    else {
      const cid = this.value.$link.replace(/^(\w{8}).*(\w{16})$/, '$1…$2');
      body = html`
        <div class="cid">
          <span>${cid} <span class="ok">✔︎</span></span>
          <sl-icon-button name="trash-fill" label="Remove content" @click=${this.handleClearCID}></sl-icon-button>
        </div>
      `;
    }
    return html`<div class="cid-uploader">
       <label for=${forValue}>Content</label>
       ${body}
    </div>`;
  }
});

const typeFixes = {
  'application/x-javascript': 'application/javascript',
  'text/javascript': 'application/javascript',
};
function fileToMediaType (file) {
  let type = mime.getType(file.name) || file.type;
  type = typeFixes[type] || type;
  return type || 'application/octet-stream';
}
