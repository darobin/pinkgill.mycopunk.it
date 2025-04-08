
class PolypodAPI {
  constructor () {}
  async query (what, params) {
    try {
      let q = '';
      if (params) {
        const u = new URLSearchParams();
        Object.entries(params).forEach(([k, v]) => {
          if (Array.isArray(v)) v.forEach(val => u.append(k, val));
          else u.append(k, v);
        });
        q = `?${u.toString()}`;
      }
      const r = await fetch(`/xrpc/space.polypod.${what}${q}`);
      if (!r.ok) return { ok: false, error: r.statusText, status: r.status };
      return { ok: true, status: r.status, data: await r.json() };
    }
    catch (err) {
      return { ok: false, error: err.message, status: 417 };
    }
  }
  // async procedure (what) {
  //   // XXX
  // }
  async getCurrentProfile () {
    return this.query('getCurrentProfile');
  }
  async getActorProfile (actor) {
    return this.query('getActorProfile', { actor });
  }
}

// - [ ] space.polypod.getActorTiles()
// - [ ] space.polypod.getInstalledTiles()
// - [ ] space.polypod.searchTiles()
// - [ ] space.polypod.uploadTile() — if it's an update, just include a prev field with the CID
// - [ ] space.polypod.getTile()
// - [ ] space.polypod.deleteTile()
// - [ ] space.polypod.installTile()
// - [ ] space.polypod.uninstallTile()
// - [ ] space.polypod.createInstance()
// - [ ] space.polypod.deleteInstance()

const client = new PolypodAPI();
export default client;
