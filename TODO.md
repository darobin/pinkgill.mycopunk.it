
## Issues

- [x] upload form needs to reset on success
- [x] upload form sometimes disappears even though an error is coming in
- [x] data is wrong
- [x] add wildcards to polity2 server too
- [x] need to render tiles
- [x] need to serve tiles
- [x] need to detect correct media type
- [x] optimistic indexing
- [x] event source to signal stream refresh
- [x] tiles need an aspect ratio
- [x] switch to Jetstream
  - [ ] Test Jetstream
- [ ] ⚠️ obtain blobs when you don't have them, on indexing: agent.com.atproto.sync.getBlob({ cid, did })
- [ ] add support for manifests that can fill in the name
- [x] add installation support (a new record type)
- [ ] add wish handling, including posting back
- [ ] need a way to support feeds and the such
- [ ] ⚠️ tiles need way of rendering inert (with a template and tile data)
- [ ] need to check viewport resizing tile aspect support
- [x] refactor root to split components out
- [ ] several different palettes for installed wishes of different kinds
- [ ] paginate with endless scroll
- [ ] better URLs
- [ ] ⚠️ invitations
- [ ] Go through all `onMount` that add a listener on `sse` and make sure they clean up on unmount
- [x] finish refactoring of create-tile so that it uses the store properly (create and error)
- [x] do the same for installs and get back to do
- [ ] ⚠️ return to subdomain tiles, use certbot (or use Cloudflare DNS API (or similar) to make LE happy)

- [x] test `postMessage`
- [x] library in `/.well-known/tiles/wishing`
- [x] `window.wish.ready` as a promise that resolves when it is indeed ready (messaged up, got response)
- [x] ~~install API + lexicon + ingester~~ + fetch + store
- [x] fix tile URLs to hash instead
- [x] install / uninstall affordances + list
  - [x] install button should disappear on update
  - [x] pg-install + styling
  - [x] style install button better, smaller, more discreet
  - [x] Uninstall should just be delete
- [ ] ⚠️ an `instantiate` wish type (takes no `what`), shows with a (+) button
  - [x] render instance tile in a mode that doesn't include the card
  - [x] popup with the tile, ready with no data but in the correct mode
  - [x] popup has a Post affordance + API to talk to the tile on post (to get the data)
  - [ ] instance API + ~~lexicon~~ + ingester + fetch + render + ~~db~~
  - [ ] include in timeline, with enough data loaded
  - [ ] rendering an instance is the tile + ready with data (not supposed to show editable)
  - [ ] instantiate automatically creates the right wish structure in the manifest — it ONLY has instantiate and has a `what` matching the creator so we don't suggest install if installed
- [ ] test by copying the manifest & cheating
- [ ] remove leading @ in login

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
