
import { readFile, writeFile } from 'node:fs/promises';
import WebSocket from 'ws';
import pino from 'pino';
import { Firehose, MemoryRunner } from '@atproto/sync';
import { isRecord, validateRecord } from './lexicons/types/space/polypod/pinkgill/tile.js';
import { ids } from './lexicons/lexicons.js';
import { CURSOR_PATH, IS_PROD } from './config.js';
import { indexEvent, deleteEvent, installTile, uninstallTile } from './db.js';

const tileCollection = ids.SpacePolypodPinkgillTile;
const installCollection = ids.SpacePolypodPinkgillInstall;
const logger = pino({ name: 'firehose ingestion' });

export async function createIngester (db, idResolver) {
  let startCursor;
  try {
    startCursor = JSON.parse(await readFile(CURSOR_PATH)).cursor;
  }
  catch (err) {
    // noop
  }
  const runner = IS_PROD
    ? undefined
    : new MemoryRunner({
        startCursor,
        setCursor: async (cursor) => (cursor % 1000) || await writeFile(CURSOR_PATH, JSON.stringify({ cursor })),
      })
  ;
  return new Firehose({
    idResolver,
    runner,
    handleEvent: async (evt) => {
      if (evt.event === 'create' || evt.event === 'update') {
        const { record } = evt;
        if (isRecord(record) && validateRecord(record).success) {
          if (evt.collection === tileCollection) await indexEvent(db, evt);
          else if (evt.collection === installCollection) {
            if (record.operation === 'install') await installTile(db, evt);
            else if (record.operation === 'uninstall') await uninstallTile(db, evt);
          }
          logger.info(`indexed event ${evt.uri.toString()}`);
        }
        else {
          logger.error({ err: validateRecord(record).error }, 'failed to validate our data');
        }
      } 
      else if (evt.event === 'delete' && evt.collection === tileCollection) {
        await deleteEvent(db, evt);
      }
    },
    onError: () => {
      if (!IS_PROD) logger.error('error on firehose ingestion');
    },
    filterCollections: [tileCollection, installCollection],
    excludeIdentity: true,
    excludeAccount: true,
  });
}

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
    params.append('wantedCollections', tileCollection);
    params.append('wantedCollections', installCollection);
    if (since) params.append('cursor', since);
    const wsURL= `ws://jetstream.atproto.tools/subscribe?&${params.toString()}`;
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
      // console.log('received: %s', data);
      try {
        const event = JSON.parse(data);
        const { commit, did, type } = event;
        if (!commit || !did || type !== 'com' || (commit.collection !== tileCollection && commit.collection !== installCollection)) return;
        const uri = `at://${did}/${commit.collection}/${commit.rkey}`
        if (commit.type === 'c' || commit.type === 'u') {
          const evt = {
            did,
            uri,
            record: commit.record,
          };
          if (commit.collection === tileCollection) await indexEvent(this.db, evt);
          else if (commit.collection === installCollection) {
            if (commit.record.operation === 'install') await installTile(this.db, evt);
            else if (commit.record.operation === 'uninstall') await uninstallTile(this.db, evt);
          }
        }
        else if (commit.type === 'd') {
          await deleteEvent(this.db, { uri });
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
