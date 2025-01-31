
## Issues

- [x] switch to Jetstream
  - [ ] Test Jetstream
- [ ] add support for manifests that can fill in the name
- [ ] need a way to support feeds and the such
- [ ] need to check viewport resizing tile aspect support
- [ ] several different palettes for installed wishes of different kinds
- [ ] paginate with endless scroll
- [x] better URLs
- [x] Go through all `onMount` that add a listener on `sse` and make sure they clean up on unmount
- [x] add proper routing, including viewing user and single post
- [x] add route-based store data instead of requesting it more manually
- [ ] UI https://alexanderobenauer.com/
- [ ] https://notes.andymatuschak.org/About_these_notes
- [ ] https://en.wikipedia.org/wiki/Promise_theory

- [x] delete tile
- [ ] ⚠️ CLI
- [x] render name differently: use person name on post but title must also appear (for install)
- [x] 🧪 obtain blobs when you don't have them, on indexing: agent.com.atproto.sync.getBlob({ cid, did })
- [ ] ⚠️ tiles need way of rendering inert (with a template and tile data)
- [x] invitations (can't let this be open access yet)
- [ ] ⚠️ return to subdomain tiles, use certbot (or use Cloudflare DNS API (or similar) to make LE happy)
  - [ ] ⚠️ maybe CBORify the manifest to get a unique CID
- [ ] ⚠️ an `instantiate` wish type (takes no `what`), shows with a (+) button
  - [x] render instance tile in a mode that doesn't include the card
  - [x] popup with the tile, ready with no data but in the correct mode
  - [x] popup has a Post affordance + API to talk to the tile on post (to get the data)
  - [x] instance API + ~~lexicon + ingester + fetch + render + db~~
  - [x] include in timeline, with enough data loaded
  - [x] rendering an instance is the tile + ready with data (not supposed to show editable)
  - [ ] instantiate automatically creates the right wish structure in the manifest — it ONLY has instantiate and has a `what` matching the creator so we don't suggest install if installed
  - [ ] if tile has an icon, show it right under the account icon on the left
  - [ ] instance should expose option to have different name
  - [ ] installing a tile doesn't remove its install button
  - [ ] put tile reload in the bar below
- [ ] shell shouldn't scroll with content
- [x] real router not hash, including Caddy
- [ ] prevent alerts and other bad stuff with sandboxes
- [x] remove leading @ in login
- [ ] refactor DB to be OO and to return failure/success consistently
- [ ] refactor server to manage record creation, etc. with less code repetition
- [ ] remove all old firehose code
- [ ] make deletion work nicely
  - [ ] timeline refresh shouldn't lose position (in general)
  - [ ] deleted tile should have loading
  - [ ] refactor how individual tiles get stores from timeline
  - [ ] confirm deletion

REFACTOR
- update install store
- fix inclusion of install data
- update wish flow (with URL?)
- tile footer render
- return to install problem

- [ ] ATChain:
    - [ ] Put WASM "contracts" (defined self-certifying input & output ports + self-certifying WASM) on AT
    - [ ] Use them to implement shared governance or collective game systems

```json
{
  "repo": "did:plc:izttpdp3l6vss5crelt5kcux",
  "collection": "space.polypod.pinkgill.tile",
  "rkey": "3l4e4ylt6dk26",
  "record": {
    "$type": "space.polypod.pinkgill.tile",
    "name": "First Tile",
    "resources": [
      {
        "path": "/index.html",
        "src": {
          "ref": "bafkreibozdtixnridlvzbgkg2hg2m53nytsa5hatuiwvrqruydvvy52whu",
          "mimeType": "application/octet-stream",
          "size": 686
        }
      },
      {
        "path": "/img/noodle.jpg",
        "src": {
          "ref": "bafkreietyojvzptchejkoz5ir7kwwjn5joquzoyf7m5nnzhuk2v7ju63uy",
          "mimeType": "image/jpeg",
          "size": 139313
        }
      }
    ],
    "createdAt": "2024-09-17T13:33:45.757Z"
  }
}
```
