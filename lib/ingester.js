
import WebSocket from 'ws';
import pino from 'pino';
import { collections } from './lexicons/lexicons.js';

const tileCollection = collections.tiles;
const logger = pino({ name: 'firehose ingestion' });

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
    params.append('wantedCollections', 'space.polypod.*');
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
        const { commit, did, type } = JSON.parse(data);
        if (
          !commit ||
          !did ||
          type !== 'com' ||
          commit.collection !== tileCollection
        ) return;
        // { repo: authorDid, rkey: tid, record: { cid, createdAt, tile: { name, description, wishes } } }
        // I'm not sure that the commit has the `repo`.
        if (commit.type === 'c' || commit.type === 'u') {
          await this.db.indexTile(commit);
          logger.log(`Indexed tile ${commit?.record?.cid} ("${commit?.record?.tile?.name}")`);
        }
    //     else if (commit.type === 'd') {
    //       if (commit.collection === tileCollection) await this.db.deleteEvent({ uri });
    //       else if (commit.collection === installCollection) {
    //         await this.db.uninstallTile(evt);
    //       }
    //     }
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
