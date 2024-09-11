
export class StateStore {
  constructor(db) {
    this.db = db;
  }
  async get (key) {
    const result = await this.db.selectFrom('auth_state').selectAll().where('key', '=', key).executeTakeFirst();
    if (!result) return;
    return JSON.parse(result.state);
  }
  async set (key, val) {
    const state = JSON.stringify(val);
    await this.db
      .insertInto('auth_state')
      .values({ key, state })
      .onConflict((oc) => oc.doUpdateSet({ state }))
      .execute();
  }
  async del (key) {
    await this.db.deleteFrom('auth_state').where('key', '=', key).execute();
  }
}

export class SessionStore {
  constructor(db) {
    this.db = db;
  }
  async get (key) {
    const result = await this.db.selectFrom('auth_session').selectAll().where('key', '=', key).executeTakeFirst();
    if (!result) return;
    return JSON.parse(result.session);
  }
  async set(key, val) {
    const session = JSON.stringify(val)
    await this.db
      .insertInto('auth_session')
      .values({ key, session })
      .onConflict((oc) => oc.doUpdateSet({ session }))
      .execute();
  }
  async del (key) {
    await this.db.deleteFrom('auth_session').where('key', '=', key).execute();
  }
}
