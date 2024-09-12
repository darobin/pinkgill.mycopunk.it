
import { LitElement, html, css } from 'lit';

const supportsFileSystemAccessAPI = 'getAsFileSystemHandle' in DataTransferItem.prototype;
const supportsWebkitGetAsEntry = 'webkitGetAsEntry' in DataTransferItem.prototype;

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
  };
  constructor () {
    super();
    this.name = '';
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
      .drop > span.label {
        user-select: none;
        pointer-events: none;
      }
    `
  ];
  // XXX
  // - default rendering
  // - label & help text
  // - handle file drops
  // - find containing form and listen to formdata
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
    // XXX
    // - if required, cancel this (possible?) and set invalid
    // - if data, attach it to the FormData
  }

  hover () {
    this.shadowRoot.querySelector('.drop')?.classList.add('dropping');
  }
  unhover () {
    this.shadowRoot.querySelector('.drop')?.classList.remove('dropping');
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
    // NOTE: should probably error earlier since that's unfixable
    if (!supportsFileSystemAccessAPI && !supportsWebkitGetAsEntry) return;
    this.unhover();
    const handles = await Promise.all([...ev.dataTransfer.items]
      .filter((item) => item.kind === 'file')
      .map((item) => supportsFileSystemAccessAPI ? item.getAsFileSystemHandle() : item.webkitGetAsEntry())
    );
    handles.forEach(h => console.warn(`[${(h.kind === 'directory' || h.isDirectory) ? 'D' : 'F'}] ${h.name}`));
  }
  render () {
    return html`<div class="drop"
        @dragover=${this.handleDragOver} 
        @dragenter=${this.handleDragEnter}
        @dragleave=${this.handleDragLeave}
        @drop=${this.handleDrop}
      >
      <span class="label">Drop tile directory here.</span>
    </div>`;
  }
}

customElements.define('pg-upload', PinkgillUpload);
