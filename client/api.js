
class PolypodAPI {
  constructor () {}
  async query (what, params) {
    try {
      const r = await fetch(`/xrpc/space.polypod.${what}${this.queryString(params)}`);
      if (!r.ok) return { ok: false, error: r.statusText, status: r.status };
      return { ok: true, status: r.status, data: await r.json() };
    }
    catch (err) {
      return { ok: false, error: err.message, status: 417 };
    }
  }
  async procedure (what, params, body) {
    try {
      const headers = {};
      if (body instanceof Blob || Object.prototype.toString.call(body) === '[object Blob]') {
        headers['content-type'] = 'application/object-stream';
      }
      else if (typeof body === 'object') {
        headers['content-type'] = 'application/json';
        body = JSON.stringify(body);
        if (!r.ok) return { ok: false, error: r.statusText, status: r.status };
        return { ok: true, status: r.status, data: await r.json() };
      }
      const r = await fetch(`/xrpc/space.polypod.${what}${this.queryString(params)}`, {
        method: 'post',
        headers,
        body,
      });
    }
    catch (err) {
      return { ok: false, error: err.message, status: 417 };
    }
  }
  queryString (params) {
    let q = '';
    if (params && typeof params === 'object') {
      const u = new URLSearchParams();
      Object.entries(params).forEach(([k, v]) => {
        if (Array.isArray(v)) v.forEach(val => u.append(k, val));
        else u.append(k, v);
      });
      q = `?${u.toString()}`;
    }
    return q;
  }
  async getCurrentProfile () {
    return this.query('getCurrentProfile');
  }
  async getActorProfile (prm) {
    return this.query('getActorProfile', prm);
  }
  async hasBlob (prm) {
    return this.query('hasBlob', prm);
  }
}

// - [ ] space.polypod.getActorTiles()
// - [ ] space.polypod.getInstalledTiles()
// - [ ] space.polypod.searchTiles()
// - [ ] space.polypod.uploadBlob()
// - [ ] space.polypod.getBlob()
// - [ ] space.polypod.uploadTile() — if it's an update, just include a prev field with the CID
// - [ ] space.polypod.getTile()
// - [ ] space.polypod.deleteTile()
// - [ ] space.polypod.installTile()
// - [ ] space.polypod.uninstallTile()
// - [ ] space.polypod.createInstance()
// - [ ] space.polypod.deleteInstance()

const client = new PolypodAPI();
export default client;
