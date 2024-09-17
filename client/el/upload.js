
import { LitElement, html, css } from 'lit';

// NOTE
// Normally, this should be a proper form element based on ShoelaceElement, FormControlController, etc.
// But it looks like Shoelace doesn't properly export these or make them available. So we're hacking our
// way to it. Ideally, we'll fix this upstream.
// In the meantime, this is very minimalistic and does not support most correct form behaviours.
export class PinkgillUpload extends LitElement {
  static properties = {
    name: {},
    require: { type: Boolean },
    attachedForm: {},
    error: { type: String, state: true },
    hovering: { type: Boolean, state: true },
    resources: { state: true },
  };
  constructor () {
    super();
    this.name = 'files';
    this.resources = {};
    this.handleFormData = this.handleFormData.bind(this);
  }
  static styles = [
    css`
      :host {
        display: block;
      }
      .drop {
        background-color: var(--sl-color-neutral-100);
        color: var(--sl-color-neutral-500);
        border-radius: var(--sl-spacing-x-small);
        border: 1px solid var(--sl-color-neutral-100);
        padding: var(--sl-spacing-4x-large) var(--sl-spacing-x-large);
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .drop.dropping {
        background-color: var(--electric-bright);
        color: var(--electric-dark);
        border-color: var(--electric-dark);
      }
      .drop.error {
        background-color: var(--sl-color-danger-100);
        color: var(--sl-color-danger-500);
        border-color: var(--sl-color-danger-500);
      }
      .drop > span.label {
        user-select: none;
        pointer-events: none;
      }
    `
  ];
  connectedCallback () {
    super.connectedCallback();
    this.attachedForm = this.closest('form');
    if (!this.attachedForm) return;
    this.attachedForm.addEventListener('formdata', this.handleFormData);
  }
  disconnectedCallback () {
    super.disconnectedCallback();
    if (!this.attachedForm) return;
    this.attachedForm.removeEventListener('formdata', this.handleFormData);
    this.attachedForm = null;
  }
  handleFormData (ev) {
    Object.keys(this.resources).forEach(path => {
      ev.formData.append(this.name, this.resources[path].file, encodeURIComponent(path));
    });
  }
  hover () {
    this.hovering = true;
    this.error = '';
  }
  unhover () {
    this.hovering = false;
    this.error = '';
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
  async handleDrop (ev) {
    ev.preventDefault();
    this.error = '';
    if (!('webkitGetAsEntry' in DataTransferItem.prototype)) {
      this.error = 'Your browser does not support dropping directories.'
      return;
    }
    this.unhover();
    if (ev.dataTransfer.items.length > 1 || ev.dataTransfer.items[0].kind !== 'file') {
      this.error = 'Only drop one directory.'
      return;
    }
    const entry = ev.dataTransfer.items[0].webkitGetAsEntry();
    if (!entry.isDirectory) {
      this.error = 'Drop must be a directory.'
      return;
    }
    const resources = {};
    await getResourceTree(entry, '/', resources);
    if (!resources['/index.html']) {
      this.error = 'There must be a file called "index.html" at the root.'
      return;
    }
    this.resources = resources;
  }
  render () {
    const classes = ['drop'];
    if (this.error) classes.push('error');
    else if (this.hovering)  classes.push('dropping');
    const paths = Object.keys(this.resources || {});
    if (!paths.length) {
      return html`<div class=${classes.join(' ')}
          @dragover=${this.handleDragOver} 
          @dragenter=${this.handleDragEnter}
          @dragleave=${this.handleDragLeave}
          @drop=${this.handleDrop}
        >
        <span class="label">${this.error || `Drop tile directory here.`}</span>
      </div>`;
    }
    return html`<ul class="resources">
      ${ paths.sort().map(p => html`<li>${p}</li>` )}
    </ul>`;
  }
}

customElements.define('pg-upload', PinkgillUpload);

const ignoreFiles = ['.DS_Store'];
async function getResourceTree (dir, parentPath, resources) {
  const dr = dir.createReader();
  const entries = await new Promise((resolve, reject) => dr.readEntries(resolve, reject));
  for (let entry of entries) {
    if (ignoreFiles.find(fn => fn === entry.name)) continue;
    const path = `${parentPath}${entry.name}${entry.isDirectory ? '/' : ''}`;
    if (entry.isFile) {
      const file = await new Promise((resolve, reject) => entry.file(resolve, reject));
      resources[path] = { file, mediaType: file.type };
    }
    else {
      await getResourceTree(entry, path, resources);
    }
  }
}
