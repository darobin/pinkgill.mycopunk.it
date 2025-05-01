
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
  removeWishfromCurrentTile,
  validateCurrentTile,
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

const droppableStyles = css`
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
  .drop.larger {
    flex-direction: column;
    padding: 3rem;
    margin-bottom: 1rem;
  }
  .drop.dropping {
    background-color: var(--sl-color-primary-600);
    color: white;
  }
  .drop > div {
    user-select: none;
    pointer-events: none;
  }
  .drop > div.help {
    font-size: 0.9rem;
  }
  input[type="file"] {
    display: none;
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
`;

// ~~~ The Overall Tile Editor
export class PinkgillTileEditor extends LitElement {
  #tile = new StoreController(this, currentTile.store);
  #router = new StoreController(this, $router);
  static properties = {
    defaultResource: { attribute: false, state: true },
    prevResourceArray: { attribute: false, state: true },
    validationReport: { attribute: false, state: true },
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
    this.prevResourceArray = res;
    if (res?.find(r => r.path === '/')) this.defaultResource = res.findIndex(r => r.path === '/');
    else if (this.defaultResource == null && res?.find(r => r.path === '/index.html')) {
      this.defaultResource = res.findIndex(r => r.path === '/index.html');
    }
  }
  handleSave () {
    this.validationReport = validateCurrentTile(this.defaultResource)?.errors;
    if (this.validationReport.count) return;
    // XXX
    // - submit, report errors from submission if any
    // - once that clears, use the returned CID to navigate to the tile
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
    const dirty = this.#tile.value?.dirty;
    const selectedIcon = icons?.length ? icons[0].src : null;
    return html`<form>
      <h2>${mode === 'edit' ? 'Edit Tile' : 'Create Tile'}</h2>
      <pg-tile-source-uploader></pg-tile-source-uploader>
      <sl-input
        type="text"
        name="name"
        value=${name}
        label="Name"
        helpText="Enter a name for your tile."
        required
        maxlength="100"
        autocomplete="off"
        @sl-input=${this.handleFormUpdate}
      ></sl-input>
      <pg-render-errors .errors=${this.validationReport?.name}></pg-render-errors>
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
      <pg-render-errors .errors=${this.validationReport?.description}></pg-render-errors>
      <div class="input-line">
        <label for="background_color">Background Colour</label>
        <sl-color-picker
          type="color"
          name="background_color"
          value=${background_color}
          label="Pick colour"
          @sl-input=${this.handleFormUpdate}
        ></sl-color-picker>
        <pg-render-errors .errors=${this.validationReport?.background_color}></pg-render-errors>
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
      <pg-render-errors .errors=${this.validationReport?.['icons[0]']}></pg-render-errors>
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
        <pg-render-errors .errors=${this.validationReport?.sizing}></pg-render-errors>
        <sl-checkbox
          name="do-sizing"
          ?checked=${!!sizing}
          @sl-input=${this.handleFormUpdate}
          >Include tile sizing</sl-checkbox>
      </fieldset>
      <fieldset>
        <legend>Resources</legend>
        <pg-render-errors .errors=${this.validationReport?.resources}></pg-render-errors>
        <sl-select
          name="default_resource"
          value=${this.defaultResource}
          label="Default resource"
          helpText="Pick a default resource if none is already '/'."
          required
          @sl-input=${this.handleDefaultResourceUpdate}
        >${resources.filter(r => /^\/[^/]*$/.test(r.path)).map((k, idx) => html`<sl-option value=${idx}>${k.path}</sl-option>`)}</sl-select>
        <pg-render-errors .errors=${this.validationReport?.default_resource}></pg-render-errors>
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
        </div><pg-render-errors .errors=${this.validationReport?.[`wishes[${idx}]`]}></pg-render-errors>`)}
        <div class="action">
          <sl-button @click=${this.handleAddWish}>
            <sl-icon slot="prefix" name="plus-square"></sl-icon>
            Add Wish
          </sl-button>
        </div>
      </fieldset>
      <div class="action">
        <sl-button variant="primary" @click=${this.handleSave} ?disabled=${!dirty}>
          <sl-icon slot="prefix" name="floppy2-fill"></sl-icon>
          ${mode === 'edit' ? 'Update' : 'Create'}
        </sl-button>
      </div>
      <hr>
      <pre>${JSON.stringify(this.#tile.value?.data, null, 2)}</pre>
    </form>`;
  }
}
customElements.define('pg-tile-editor', PinkgillTileEditor);

function filterImages (res) {
  if (!res) return [];
  return res.filter(r => /^image\//.test(r.mediaType));
}

// ~~~ The Editor for Individual Wishes
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

// ~~~ The Editor for Individual Resources
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
  async setFile (f) {
    return await this.shadowRoot.querySelector('pg-cid-uploader')?.setFile(f);
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

// ~~~ Show a CID or upload one, after checking
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
    droppableStyles,
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
      this.uploading = false;
      if (!res.ok) {
        this.error = res.error;
        return;
      }
    }
    const mediaType = fileToMediaType(file);
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
            <div>Drop file or click</div>
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

// ~~~ Upload a directory that is the tile's source
customElements.define('pg-tile-source-uploader', class extends LitElement {
  static properties = {
    // name: { type: String },
    // value: { attribute: false, state: true },
    hovering: { type: Boolean, state: true },
    spinning: { type: Boolean, state: true },
    // uploading: { type: Boolean, state: true },
    error: { attribute: false, state: true },
  };
  static styles = [
    tileFormStyles,
    droppableStyles,
    css`
      :host {
        width: 100%;
      }
      * {
        box-sizing: border-box;
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
    if (!('webkitGetAsEntry' in DataTransferItem.prototype)) {
      this.error = 'Your browser does not support dropping directories.'
      return;
    }
    if (ev.dataTransfer.items.length > 1 || ev.dataTransfer.items[0].kind !== 'file') {
      this.error = 'Only drop one directory.'
      return;
    }
    const entry = ev.dataTransfer.items[0].webkitGetAsEntry();
    if (!entry.isDirectory) {
      this.error = 'Drop must be a directory.'
      return;
    }
    const tree = {};
    await getResourceTree(entry, '/', tree);
    await this.processTileSource(tree);
  }
  // We get a list of files but webkitEntries is empty unless there's a drop
  // (in Firefox). So we convert the list of files to a resource map that we
  // pass on to central processing.
  // Even with directory picking, we only get files so we have to use their
  // paths to infer the directory.
  async handleFilePick (ev) {
    const files = [...ev.target.files];
    if (!files.length) {
      this.error = 'Empty directory selected.';
      return;
    }
    const dirPath = files[0].webkitRelativePath.replace(/\/.+$/, '');
    if (files.find(f => !f.webkitRelativePath.startsWith(`${dirPath}/`))) {
      this.error = 'Not all selected files are in the same directory.';
      return;
    }
    const tree = {};
    files.forEach(f => {
      const path = f.webkitRelativePath.replace(dirPath, '');
      if (ignoreFiles.find(fn => fn === f.name)) return;
      tree[path] = f;
    });
    await this.processTileSource(tree);
  }
  async processTileSource (tree) {
    if (!tree['/manifest.json']) {
      this.error = 'Cannot find a /manifest.json in the tile.';
      return;
    }
    let manifest;
    try {
      manifest = JSON.parse(await tree['/manifest.json'].text());
    }
    catch (err) {
      this.error = `Failed to parse manifest: ${err.message}`;
      return;
    }
    ['name', 'description', 'background_color', 'sizing', 'wishes'].forEach(k => {
      if (manifest[k]) updateCurrentTile(k, manifest[k]);
    });
    const resources = Object.keys(tree)
      .filter(k => k !== '/manifest.json')
      .map(path => ({ path, mediaType: null, src: null }))
    ;
    updateCurrentTile('resources', resources);
    // Find editor host.
    let ed = this;
    while (ed && ed.localName !== 'pg-tile-editor') {
      ed = ed.getRootNode()?.host;
    }
    if (!ed) throw new Error(`Element pg-tile-source-uploader is not inside a pg-tile-editor.`);
    await ed.updateComplete;
    await Promise.all(
      [...ed.shadowRoot.querySelectorAll('pg-resource-editor')].map(re => {
        const { path } = re.value;
        if (!tree[path]) return Promise.resolve();
        return re.setFile(tree[path]);
      })
    );
    await ed.updateComplete;
    // If there are icons, we only care about the first (for now).
    if (manifest.icons) {
      const { src } = manifest.icons[0] || {};
      if (src && tree[src]) updateCurrentTile('icons', [manifest.icons[0]]);
    }
  }
  handleClearError () {
    this.error = null;
  }
  dispatchInput () {
    this.dispatchEvent(new InputEvent('input'));
  }
  render () {
    let body;
    if (this.error) {
      body = html`<div class="error">
        <div><strong>Error</strong>: ${this.error}</div>
        <sl-icon-button name="x-circle-fill" label="Clear error" @click=${this.handleClearError}></sl-icon-button>
      </div>`
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
      body = html`
        <div class=${classMap({ drop: true, larger: true, dropping: this.hovering })}
          @dragover=${this.handleDragOver}
          @dragenter=${this.handleDragEnter}
          @dragleave=${this.handleDragLeave}
          @drop=${this.handleDrop}
          @click=${this.handleClick}
        >
          <div>You may drop a directory with the tile's source</div>
          <div class="help"><u>Caution</u>: this will override changes made in the form below</div>
        </div>
        <input type="file" name="file" id="file" @change=${this.handleFilePick} webkitdirectory>
      `;
    }
    return html`<div class="tile-uploader">${body}</div>`;
  }
});

const ignoreFiles = ['.DS_Store'];
async function getResourceTree (dir, parentPath, resources) {
  const dr = dir.createReader();
  const entries = await new Promise((resolve, reject) => dr.readEntries(resolve, reject));
  for (let entry of entries) {
    if (ignoreFiles.find(fn => fn === entry.name)) continue;
    const path = `${parentPath}${entry.name}${entry.isDirectory ? '/' : ''}`;
    if (entry.isFile) {
      const file = await new Promise((resolve, reject) => entry.file(resolve, reject));
      resources[path] = file;
    }
    else {
      await getResourceTree(entry, path, resources);
    }
  }
}

// ~~~ Show errors nicely
customElements.define('pg-render-errors', class extends LitElement {
  static properties = {
    errors: { attribute: false, state: true },
  };
  static styles = [
    css`
      :host {
        display: block;
      }
      * {
        box-sizing: border-box;
        color: var(--sl-color-danger-600);
      }
      ul {
        margin-top: -0.5rem;
      }
    `,
  ];
  render () {
    if (!this.errors?.length) return nothing;
    return html`<ul>${this.errors.map(err => html`<li>${err}.</li>`)}</ul>`;
  }
});
