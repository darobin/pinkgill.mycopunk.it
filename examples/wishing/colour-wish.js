
(async () => {
  const readyState = await window.wish.ready;
  const c = new Colourful(readyState.mode, readyState.data);
  c.render();
  
  window.wish.registerPostHandler(() => c.data);
  window.wish.registerCancelHandler(() => c.dirty);

  // DEBUG
  const but = document.createElement('button');
  but.textContent = 'Reload';
  but.onclick = () => window.location.reload();
  but.style.position = 'absolute';
  but.style.top = 0;
  but.style.right = 0;
  document.body.append(but);
})();


class Colourful {
  #colours = ['#000000'];
  #mode;
  static #maxLength = 6;
  constructor (mode, data) {
    if (Colourful.validateColours(data?.colours)) this.#colours = data.colours;
    this.#mode = mode;
  }
  static validateColours (c) {
    return c && Array.isArray(c) && c.length > 0 && c.length <= this.#maxLength && !c.find(col => !/^#[a-f0-9]{6}$/.test(col));
  }
  get data () {
    return this.#colours;
  }
  get dirty () {
    return this.#colours.length > 1 || this.#colours[0] !== '#000000';
  }
  renderConfusion (readyState) {
    const main = document.querySelector('main');
    el('p', {}, ['Whoa, I have no idea what is going on here.'], main);
    el('pre', {}, [JSON.stringify(readyState, null, 2)], main);
  }
  setColour (idx, val) {
    if (idx >= this.#colours.length) return;
    this.#colours[idx] = val;
    this.render();
  }
  removeColour (idx) {
    if (idx >= this.#colours.length) return;
    this.#colours.splice(idx, 1);
    this.render();
  }
  addColour () {
    if (this.#colours.length >= Colourful.#maxLength) return;
    this.#colours.push('#000000');
    this.render();
  }
  render () {
    const main = document.querySelector('main');
    main.textContent = null;
    if (this.#mode === 'bare') {
      el('p', { style: 'padding: 1rem'}, ['Colourful is a great way to create and share colour palettes. Install it and take it for a spin!'], main);
      return;
    }
    if (this.#mode !== 'instance' && this.#mode !== 'instantiate') {
      el('p', {}, ['Whoa, I have no idea what is going on here.'], main);
      el('pre', {}, [JSON.stringify({ mode: this.#mode, colours: this.#colours }, null, 2)], main);
      return;
    }
    const editMode = (this.#mode === 'instantiate');
    const colDiv = el('div', { class: 'colours' }, [], main);
    this.#colours.forEach((col, idx) => el(
      'div',
      {
        class: 'colour', 
        style: `background-color: ${col}`, 
        'data-idx': idx, 
        '@input': (ev) => {
          const input = ev.target;
          const div = ev.currentTarget;
          if (input.type !== 'color') return;
          const index = parseInt(div.dataset.idx, 10);
          this.setColour(index, input.value);
        },
        '@click': (ev) => {
          const but = ev.target;
          if (but.dataset.action !== 'delete') return;
          const index = parseInt(ev.currentTarget.dataset.idx, 10);
          this.removeColour(index);
        },
      },
      editMode
        ? [colourEdit(col, this.#colours.length > 1)]
        : []
      ,
      colDiv
    ));
    if (editMode) {
      el(
        'div',
        { class: 'colour-actions' },
        [
          el('input', { type: 'button', value: '➕ Add Colour', disabled: this.#colours.length < Colourful.#maxLength ? undefined : 'disabled', '@click': () => this.addColour() }),
        ],
        main
      );
    }
  }
}

function el (n, attr, kids, parent) {
  const e = document.createElement(n);
  if (attr) {
    Object.keys(attr).forEach(k => {
      if (typeof attr[k] === 'undefined') return;
      if (/^@/.test(k)) e.addEventListener(k.replace('@', ''), attr[k]);
      else e.setAttribute(k, attr[k]);
    });
  }
  if (kids) {
    if (!Array.isArray(kids)) kids = [kids];
    e.append(...
      kids.map(k => {
        if (typeof k === 'string') return document.createTextNode(k);
        if (k && k.nodeType) return k;
        return el(k);
      })
    );
  }
  if (parent) parent.append(e);
  return e;
}

function colourEdit (c, canDelete) {
  return el(
    'div',
    { class: 'colour-edit' },
    [
      el('input', { type: 'color', value: c }),
      el('input', { type: 'button', value: '✖️', disabled: canDelete ? undefined : 'disabled', 'data-action': 'delete' }),
    ]
  );
}
