
// import { readFile, writeFile } from 'node:fs/promises';
import WebSocket from 'ws';
import pino from 'pino';
// import { Firehose, MemoryRunner } from '@atproto/sync';
// import { isRecord, validateRecord } from './lexicons/types/space/polypod/pinkgill/tile.js';
import { ids } from './lexicons/lexicons.js';
// import { CURSOR_PATH, IS_PROD } from './config.js';

const tileCollection = ids.SpacePolypodPinkgillTile;
const installCollection = ids.SpacePolypodPinkgillInstall;
const deleteCollection = ids.SpacePolypodPinkgillDelete;
const logger = pino({ name: 'firehose ingestion' });

// export async function createIngester (db, idResolver) {
//   let startCursor;
//   try {
//     startCursor = JSON.parse(await readFile(CURSOR_PATH)).cursor;
//   }
//   catch (err) {
//     // noop
//   }
//   const runner = IS_PROD
//     ? undefined
//     : new MemoryRunner({
//         startCursor,
//         setCursor: async (cursor) => (cursor % 1000) || await writeFile(CURSOR_PATH, JSON.stringify({ cursor })),
//       })
//   ;
//   return new Firehose({
//     idResolver,
//     runner,
//     handleEvent: async (evt) => {
//       if (evt.event === 'create' || evt.event === 'update') {
//         const { record } = evt;
//         if (isRecord(record) && validateRecord(record).success) {
//           if (evt.collection === tileCollection) await indexEvent(db, evt);
//           else if (evt.collection === installCollection) {
//             if (record.operation === 'install') await installTile(db, evt);
//             else if (record.operation === 'uninstall') await uninstallTile(db, evt);
//           }
//           else if (evt.collection === deleteCollection) {
//             if (record.operation === 'delete') await deleteTile(db, evt);
//             else if (record.operation === 'undelete') await undeleteTile(db, evt);
//           }
//           logger.info(`indexed event ${evt.uri.toString()}`);
//         }
//         else {
//           logger.error({ err: validateRecord(record).error }, 'failed to validate our data');
//         }
//       }
//       else if (evt.event === 'delete' && evt.collection === tileCollection) {
//         await deleteEvent(db, evt);
//       }
//     },
//     onError: () => {
//       if (!IS_PROD) logger.error('error on firehose ingestion');
//     },
//     filterCollections: [tileCollection, installCollection, deleteCollection],
//     excludeIdentity: true,
//     excludeAccount: true,
//   });
// }

class JetStreamIngester {
  constructor (db) {
    this.db = db;
    this.stopped = false;
  }
  async start () {
    this.connect(yesterday());
  }
  async destroy () {
    if (!this.ws) return;
    this.stopped = true;
    this.ws.terminate();
  }
  connect (since) {
    const params = new URLSearchParams();
    params.append('wantedCollections', 'space.polypod.pinkgill.*');
    if (since) params.append('cursor', since);
    const wsURL= `wss://jetstream2.us-east.bsky.network/subscribe?${params.toString()}`;
    logger.info(`Connecting to ${wsURL}…`);
    this.ws = new WebSocket(wsURL);

    this.ws.on('error', (err) => logger.error({ err }, 'web socket error'));
    this.ws.on('open', () => {
      logger.info(`jetstream open to ${wsURL}…`);
    });
    this.ws.on('close', () => {
      if (this.stopped) {
        logger.info('jetstream terminating');
        return;
      }
      logger.info('jetstream disconnected');
      setTimeout(() => this.connect(yesterday()), 1000);
    });
    this.ws.on('message', async (data) => {
      if (/,"kind":"(identity|account)",/.test(data)) return;
      console.log('received: %s', data);
      try {
        const event = JSON.parse(data);
        const { commit, did, type } = event;
        if (
          !commit ||
          !did ||
          type !== 'com' ||
          (
            commit.collection !== tileCollection &&
            commit.collection !== installCollection &&
            commit.collection !== deleteCollection
          )
        ) return;
        const uri = `at://${did}/${commit.collection}/${commit.rkey}`
        const evt = {
          did,
          uri,
          record: commit.record,
        };
        if (commit.type === 'c' || commit.type === 'u') {
          if (commit.collection === tileCollection) await this.db.indexEvent(evt);
          else if (commit.collection === installCollection) {
            logger.warn(`INGESTING ${JSON.stringify(commit.record)}`);
            // This was the old way, can probably remove that now
            if (commit.record.operation === 'install') await this.db.installTile(evt);
            else if (commit.record.operation === 'uninstall') await this.db.uninstallTile(evt);
          }
          else if (commit.collection === deleteCollection) {
            logger.warn(`DELETING tile`);
            if (commit.record.operation === 'delete') await this.db.deleteTile(evt);
            else if (commit.record.operation === 'undelete') await this.db.undeleteTile(evt);
          }
        }
        else if (commit.type === 'd') {
          if (commit.collection === tileCollection) await this.db.deleteEvent({ uri });
          else if (commit.collection === installCollection) {
            await this.db.uninstallTile(evt);
          }
        }
      }
      catch (err) {
        logger.error({ err }, 'failed to ingest message');
      }
    });
  }
}

export async function createJetStreamIngester (db) {
  return new JetStreamIngester(db);
}

function yesterday () {
  return (Date.now() - (24 * 60 * 60 * 1000)) * 1000;
}
