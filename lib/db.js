
import { EventEmitter } from 'node:events';
import SqliteDb from 'better-sqlite3';
import { Kysely, Migrator, SqliteDialect } from 'kysely';

// Events
class DBEvents extends EventEmitter {}
export const dbEvents = new DBEvents();

// Migrations
const migrations = {};
const migrationProvider = {
  async getMigrations () {
    return migrations;
  },
};

migrations['001'] = {
  async up (db) {
    // await db.schema
    //   .createTable('status')
    //   .addColumn('uri', 'varchar', (col) => col.primaryKey())
    //   .addColumn('authorDid', 'varchar', (col) => col.notNull())
    //   .addColumn('status', 'varchar', (col) => col.notNull())
    //   .addColumn('createdAt', 'varchar', (col) => col.notNull())
    //   .addColumn('indexedAt', 'varchar', (col) => col.notNull())
    //   .execute()
    await db.schema
      .createTable('auth_session')
      .addColumn('key', 'varchar', (col) => col.primaryKey())
      .addColumn('session', 'varchar', (col) => col.notNull())
      .execute();
    await db.schema
      .createTable('auth_state')
      .addColumn('key', 'varchar', (col) => col.primaryKey())
      .addColumn('state', 'varchar', (col) => col.notNull())
      .execute();
  },
  async down(db) {
    await db.schema.dropTable('auth_state').execute();
    await db.schema.dropTable('auth_session').execute();
    // await db.schema.dropTable('status').execute()
  },
};
migrations['002'] = {
  async up (db) {
    await db.schema
      .createTable('tiles')
      .addColumn('uri', 'varchar', (col) => col.primaryKey())
      .addColumn('authorDid', 'varchar', (col) => col.notNull())
      .addColumn('name', 'varchar', (col) => col.notNull())
      .addColumn('resources', 'varchar', (col) => col.notNull())
      .addColumn('createdAt', 'varchar', (col) => col.notNull())
      .addColumn('indexedAt', 'varchar', (col) => col.notNull())
      .execute()
  },
  async down(db) {
    await db.schema.dropTable('tiles').execute()
  },
};

export const createDB = (location) => {
  return new Kysely({
    dialect: new SqliteDialect({
      database: new SqliteDb(location),
    }),
  });
}

export const migrateToLatest = async (db) => {
  const migrator = new Migrator({ db, provider: migrationProvider });
  const { error } = await migrator.migrateToLatest();
  if (error) throw error;
}

export async function getTimeline (db) {
  const tiles =  await db
    .selectFrom('tiles')
    .selectAll()
    .orderBy('indexedAt', 'desc')
    .limit(20)
    .execute()
  ;
  tiles.forEach(t => {
    t.resources = JSON.parse(t.resources);
  });
  return tiles;
}

export async function getTile (db, uri) {
  const tile =  await db
    .selectFrom('tiles')
    .selectAll()
    .where('uri', '=', uri)
    .executeTakeFirst()
  ;
  if (!tile) return;
  tile.resources = JSON.parse(tile.resources);
  return tile;
}

export async function indexEvent (db, evt) {
  const { record } = evt;
  dbEvents.emit('indexed');
  return await db
    .insertInto('tiles')
    .values({
      uri: evt.uri.toString(),
      authorDid: evt.did,
      name: record.name,
      resources: JSON.stringify(record.resources),
      createdAt: record.createdAt,
      indexedAt: new Date().toISOString(),
    })
    .onConflict((oc) =>
      oc.column('uri').doUpdateSet({
          name: record.name,
          resources: JSON.stringify(record.resources),
          indexedAt: new Date().toISOString(),
      })
    )
    .execute()
  ;
}

export async function deleteEvent (db, evt) {
  await db.deleteFrom('status').where({ uri: evt.uri.toString() });
}
