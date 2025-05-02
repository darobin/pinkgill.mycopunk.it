
import { EventEmitter } from 'node:events';
// import crypto from 'node:crypto';
import SqliteDb from 'better-sqlite3';
import { Kysely, Migrator, SqliteDialect } from 'kysely';
// import { ensureBlob } from './blobs.js';
// import makeTileHasher from '../shared/tile-hash.js';
// import parseATURI from '../shared/at-uri.js';
// import { collections } from './lexicons/lexicons.js';

// const tileHash = makeTileHasher(crypto);
// const instanceCollection = collections.instance;

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
  async down (db) {
    await db.schema.dropTable('auth_state').execute();
    await db.schema.dropTable('auth_session').execute();
  },
};
migrations['002'] = {
  async up (db) {
    // We key off the CID because that's what's determinative of the tile's content.
    // If a tile is updated, a new CID is generated and points to the other CID with prev.
    // The tid is just the record ID, it maps to the PDS but we don't really key on it.
    await db.schema
      .createTable('tiles')
      .addColumn('cid', 'varchar', (col) => col.primaryKey())
      .addColumn('tid', 'varchar', (col) => col.notNull())
      .addColumn('prev', 'varchar')
      .addColumn('authorDid', 'varchar', (col) => col.notNull())
      .addColumn('name', 'varchar', (col) => col.notNull())
      .addColumn('description', 'varchar')
      .addColumn('createdAt', 'varchar', (col) => col.notNull())
      .addColumn('indexedAt', 'varchar', (col) => col.notNull())
      .execute()
    ;
    await db.schema
      .createTable('cid2wishes')
      .addColumn('cid', 'varchar', (col) => col.primaryKey())
      .addColumn('can', 'varchar', (col) => col.notNull())
      .execute()
    ;
  },
  async down (db) {
    await db.schema.dropTable('tiles').execute();
    await db.schema.dropTable('cid2wishes').execute();
  },
};
// migrations['004'] = {
//   async up (db) {
//     await db.schema
//       .alterTable('tiles')
//       .addColumn('hash', 'varchar')
//       .execute()
//     ;
//     const tiles =  await db
//       .selectFrom('tiles')
//       .select('uri')
//       .execute()
//     ;
//     for (const t of tiles) {
//       const { uri } = t;
//       const { did, tid } = parseATURI(uri);
//       const hash = await tileHash(did, tid);
//       await db
//         .updateTable('tiles')
//         .set({ hash })
//         .where('uri', '=', uri)
//         .executeTakeFirst()
//       ;
//     }
//   },
//   async down (db) {
//     await db.schema.alterTable('tiles').dropColumn('hash').execute();
//   },
// };

export class PinkgillDatabase {
  #db;
  constructor (db) {
    this.#db = db;
  }
  // TODO
  // When we support prev, we'll want to also include a next column.
  // Upon inserting a value that has a prev, update its prev to have a next pointing to the new one.
  // Note that this forces version histories into a line, which means there can be orphan tile version.
  // We can live with that.
  // When searching for a wish, this means that we can filter by CIDs that don't have a
  // next defined. This is more efficient.
  async indexTile ({ repo: authorDid, rkey: tid, record: { cid, createdAt, tile: { name, description, wishes } } }) {
    const hasCID = await this.#db
      .selectFrom('tiles')
      .selectAll()
      .where('cid', '=', cid)
      .executeTakeFirst()
    ;
    // we're already indexed
    if (hasCID) return;
    await this.#db.transaction().execute(async (trx) => {
      const indexedAt = new Date().toISOString();
      await trx
        .insertInto('tiles')
        .values({
          cid,
          tid,
          authorDid,
          name,
          description,
          createdAt,
          indexedAt,
        })
      ;
      if (wishes?.length) {
        await trx
          .insertInto('cid2wishes')
          .values(wishes.map(w => ({ cid, can: w.can })))
          .execute()
        ;
      }
    });
  }
  // async indexEvent (evt) {
  //   await indexEvent(this.#db, evt);
  // }
  // async installTile (evt) {
  //   await installTile(this.#db, evt);
  // }
  // async uninstallTile (evt) {
  //   await uninstallTile(this.#db, evt)
  // }
  // async deleteTile (evt) {
  //   await deleteTile(this.#db, evt);
  // }
  // async undeleteTile (evt) {
  //   await undeleteTile(this.#db, evt)
  // }
  // async deleteEvent (evt) {
  //   await deleteEvent(this.#db, evt);
  // }
}

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

// export async function getTimeline (db) {
//   const tiles =  await db
//     .selectFrom('tiles')
//     .selectAll()
//     .where('deleted', 'is', null)
//     .orderBy('indexedAt', 'desc')
//     .limit(20)
//     .execute()
//   ;
//   tiles.forEach(hydrateTile);
//   return tiles;
// }

// export async function getTile (db, hash) {
//   const tile = await db
//     .selectFrom('tiles')
//     .selectAll()
//     .where('hash', '=', hash)
//     .executeTakeFirst()
//   ;
//   if (!tile) return;
//   hydrateTile(tile);
//   return tile;
// }

// export async function getTiles (db, uris) {
//   const tiles =  await db
//     .selectFrom('tiles')
//     .selectAll()
//     .where('uri', 'in', uris)
//     .orderBy('name', 'desc')
//     .execute()
//   ;
//   tiles.forEach(hydrateTile);
//   return tiles;
// }

// function hydrateTile (tile) {
//   tile.resources = JSON.parse(tile.resources);
//   tile.data = tile.data && JSON.parse(tile.data);
// }

// export async function deleteTile (db, evt) {
//   const uri = evt.record.tile;
//   await db
//     .updateTable('tiles')
//     .set({ deleted: 1 })
//     .where('uri', '=', uri)
//     .executeTakeFirst()
//   ;
//   dbEvents.emit('deleted');
// }
// export async function undeleteTile (db, evt) {
//   const uri = evt.record.tile;
//   await db
//     .updateTable('tiles')
//     .set({ deleted: null })
//     .where('uri', '=', uri)
//     .executeTakeFirst()
//   ;
//   dbEvents.emit('deleted');
// }

// export async function indexEvent (db, evt) {
//   const { record } = evt;
//   const uri = evt.uri.toString();
//   const { did, tid } = parseATURI(uri);
//   const hash = await tileHash(did, tid);
//   let type = 'bare';
//   let data = '';
//   let instanceRef = '';
//   if (record.$type === instanceCollection) {
//     type = 'instance';
//     data = JSON.stringify(record.data || {});
//     instanceRef = record.tile;
//   }
//   const cids = record.resources
//     ?.map(r => r?.ref?.$link)
//     ?.filter(Boolean)
//     || []
//   ;
//   for (const cid of cids) {
//     await ensureBlob(cid, did)
//   }
//   await db
//     .insertInto('tiles')
//     .values({
//       uri,
//       hash,
//       authorDid: evt.did,
//       name: record.name,
//       resources: JSON.stringify(record.resources),
//       type,
//       data,
//       instanceRef,
//       createdAt: record.createdAt,
//       indexedAt: new Date().toISOString(),
//     })
//     .onConflict((oc) =>
//       oc.column('uri').doUpdateSet({
//         name: record.name,
//         resources: JSON.stringify(record.resources),
//         type,
//         data,
//         instanceRef,
//         indexedAt: new Date().toISOString(),
//       })
//     )
//     .execute()
//   ;
//   dbEvents.emit('indexed');
// }

// export async function deleteEvent (db, evt) {
//   // We don't delete resources because they could have multiple referrents. We could keep
//   // track of this.
//   await db.deleteFrom('tiles').where('uri', '=', evt.uri.toString()).where('authorDid', '=', evt.did);
//   dbEvents.emit('indexed');
// }

// export async function installTile (db, evt) {
//   const seen = await checkSeenEvent(db, evt);
//   if (seen) return;
//   const { record } = evt;
//   await db
//     .insertInto('installs')
//     .values({
//       tile: record.tile,
//       authorDid: evt.did,
//       createdAt: record.createdAt,
//       indexedAt: new Date().toISOString(),
//     })
//     .onConflict((oc) =>
//       oc.column('tile').doUpdateSet({
//         indexedAt: new Date().toISOString(),
//       })
//     )
//     .execute()
//   ;
//   dbEvents.emit('installed');
//   await markEventAsSeen(db, evt);
// }

// export async function uninstallTile (db, evt) {
//   const seen = await checkSeenEvent(db, evt);
//   if (seen) return;
//   await db
//     .deleteFrom('installs')
//     .where('tile', '=', evt.record.tile)
//     .where('authorDid', '=', evt.did)
//     .execute()
//   ;
//   dbEvents.emit('installed');
//   await markEventAsSeen(db, evt);
// }

// export async function getInstalls (db, did) {
//   return await db
//     .selectFrom('installs')
//     .selectAll()
//     .where('authorDid', '=', did)
//     .orderBy('indexedAt', 'desc')
//     .execute()
//   ;
// }

// async function checkSeenEvent (db, evt) {
//   const seen = await db
//     .selectFrom('seen')
//     .selectAll()
//     .where('uri', '=', evt.uri.toString())
//     .executeTakeFirst()
//   ;
//   return !!seen;
// }

// async function markEventAsSeen (db, evt) {
//   const seen = await checkSeenEvent(db, evt);
//   if (seen) return;
//   await db
//   .insertInto('seen')
//   .values({
//     uri: evt.uri.toString(),
//   })
//   .execute()
// ;
// }
