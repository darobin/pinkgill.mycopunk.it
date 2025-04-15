
import { LitElement, html, css } from 'lit';
import { StoreController } from "@nanostores/lit";
import { currentTile, $router, updateCurrentTile, addWishToCurrentTile, removeWishfromCurrentTile } from '../store.js';

const tileFormStyles = css`
  :host {
    display: block;
  }
  sl-input, sl-textarea, sl-select, fieldset {
    margin-bottom: 1rem;
  }
  sl-input[type="color"]::part(form-control-input) {
    width: fit-content;
  }
  sl-input::part(form-control-label), sl-textarea::part(form-control-label), sl-select::part(form-control-label) {
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
  static styles = [
    tileFormStyles,
    css`
      .wish-line {
        display: flex;
        background: var(--sl-color-neutral-100);
        padding: var(--sl-spacing-medium);
        margin-bottom: var(--sl-spacing-medium);
      }
      .wish-line pg-wish-editor {
        flex-grow: 1;
      }
      .wish-line sl-icon-button {
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
  handleAddWish () {
    addWishToCurrentTile();
  }
  handleRemoveWish (ev) {
    const idx = parseInt(ev.target.dataset.idx, 10);
    removeWishfromCurrentTile(idx);
  }
  render () {
    // XXX
    // If not logged in, just show a link to login.
    // Use a cookie to remember where to redirect to upon returning.
    // And make sure to wipe it.
    // XXX
    // NOTE: loading should be handled differently (form disabled, progress show in there)
    const mode = (this.#router.value?.route === 'edit') ? 'edit' : 'new';
    // const loading = this.#actorProfile.value.loading;
    const { name, description, background_color, icons, sizing, wishes, resources } = this.#tile.value?.data || {};
    const selectedIcon = icons?.length ? icons[0].src : null;
    // XXX
    // - automatically update currentTile
    // - have that maintain dirty state and validation
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
      <sl-input
        type="color"
        name="background_color"
        value=${background_color}
        label="Background Colour"
        helpText="Pick a colour to show when listing your tile."
        @sl-input=${this.handleFormUpdate}
      ></sl-input>
      <!-- note that we can use multiple below, when that becomes desirable -->
      <sl-select
        name="icons"
        value=${selectedIcon}
        label="Icon"
        helpText="Pick an icon from the resources."
        clearable
        @sl-input=${this.handleFormUpdate}
      >${filterImages(resources).map(k => html`<s-option value=${k}>${k}</s-option>`)}</sl-select>
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
        <!--
        - path
        - drop zone
        - automatically extract and show CID
        - automatically upload but check first if CID already exists
        - must have one default path mapping to / (radio? autodetect index.html if so)
        - minimum one
        - plus to add, minus to remove
        -->
      </fieldset>
      <fieldset>
        <legend>Wishes</legend>
        ${(wishes || []).map((w, idx) => html`<div class="wish-line">
          <pg-wish-editor name=${`wishes[${idx}]`} .value=${w} @sl-input=${this.handleFormUpdate}></pg-wish-editor>
          <sl-icon-button name="x-square" label="Remove wish" data-idx=${idx} @click=${this.handleRemoveWish}></sl-icon-button>
        </div>`)}
        <div class="action">
          <sl-button @click=${this.handleAddWish}>
            <sl-icon slot="prefix" name="plus-square"></sl-icon>
            Add Wish
          </sl-button>
        </div>
        <!--
        - can dropdown (all the supported verbs)
        - rest depends on what can has been picked
        - plus to add, minus to remove
        -->
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
  return Object.entries(res)
    .filter(([, v]) => /^image\//.test(v.mediaType))
    .map(([k]) => k)
  ;
}

// required: ['name', 'resources'],
// wishes: { list many, different types
//   type: 'array',
//   items: {
//     type: 'ref',
//     ref: 'space.polypod.manifest#wish',
//   },
// },
// resources: { autopopulate from drop, but can also add one, drop updates
//   type: 'unknown',
// },

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
