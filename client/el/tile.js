
import { LitElement, html, css, nothing } from 'lit';

export class PinkgillTile extends LitElement {
  static properties = {
    tile: { attribute: false },
  };
  static styles = [
    css`
      :host {
        display: block;
      }
    `,
  ];
  render () {
    if (!this.tile) return nothing;
    // did.plc.izttpdp3l6vss5crelt5kcux.3l4e5yozvmk2j.tile.pinkgill.bast
    const [did, , tid] = this.tile.uri.replace(/^at:\/\//, '').split('/');
    const url = `https://${did.replace(/:/g, '.')}.${tid}.tile.${window.location.hostname}/`;
    return html`<sl-card>
      <div slot="header">
        <h3>${this.tile.name}</h3>
        <strong>@${this.tile.handle}</strong>
        <time datetime=${this.tile.createdAt}>${this.tile.createdAt}</time>
      </div>
      <iframe src=${url}></iframe>
    </sl-card>`;
  }
}

customElements.define('pg-tile', PinkgillTile);

// {
//   "uri": "at://did:plc:izttpdp3l6vss5crelt5kcux/space.polypod.pinkgill.tile/3l4e5yozvmk2j",
//   "authorDid": "did:plc:izttpdp3l6vss5crelt5kcux",
//   "name": "First Tile",
//   "resources": [
//     {
//       "src": {
//         "$type": "blob",
//         "ref": {
//           "$link": "bafkreibozdtixnridlvzbgkg2hg2m53nytsa5hatuiwvrqruydvvy52whu"
//         },
//         "mimeType": "application/octet-stream",
//         "size": 686
//       },
//       "path": "/index.html"
//     },
//     {
//       "src": {
//         "$type": "blob",
//         "ref": {
//           "$link": "bafkreietyojvzptchejkoz5ir7kwwjn5joquzoyf7m5nnzhuk2v7ju63uy"
//         },
//         "mimeType": "image/jpeg",
//         "size": 139313
//       },
//       "path": "/img/noodle.jpg"
//     }
//   ],
//   "createdAt": "2024-09-17T13:51:42.862Z",
//   "indexedAt": "2024-09-17T13:57:17.752Z",
//   "handle": "robin.berjon.com"
// }
