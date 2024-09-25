
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
- [ ] switch to Jetstream
- [ ] obtain blobs when you don't have them, on indexing: agent.com.atproto.sync.getBlob({ cid, did })
- [ ] add support for manifests that can fill in the name but also wishes
- [ ] add installation support (a new record type)
- [ ] add wish handling, including posting back
- [ ] need a way to support feeds and the such
- [ ] tiles need way of rendering inert (with a template and tile data)
- [ ] need to check viewport resizing tile aspect support


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
