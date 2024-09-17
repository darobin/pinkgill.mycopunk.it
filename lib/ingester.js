
import { readFile, writeFile } from 'fs/promises';
import pino from 'pino';
import { Firehose, MemoryRunner } from '@atproto/sync';
import { isRecord, validateRecord } from './lexicons/types/space/polypod/pinkgill/tile.js';
import { ids } from './lexicons/lexicons.js';
import { CURSOR_PATH } from './config.js';

const tileCollection = ids.SpacePolypodPinkgillTile;

export async function createIngester (db, idResolver) {
  const logger = pino({ name: 'firehose ingestion' });
  let startCursor;
  try {
    startCursor = JSON.parse(await readFile(CURSOR_PATH)).cursor;
  }
  catch (err) {
    // noop
  }
  const runner = new MemoryRunner({
    startCursor,
    setCursor: async (cursor) => await writeFile(CURSOR_PATH, JSON.stringify({ cursor })),
  });
  return new Firehose({
    idResolver,
    runner,
    handleEvent: async (evt) => {
      if (evt.event === 'create' || evt.event === 'update') {
        const { record } = evt;
        if (evt.collection === tileCollection && isRecord(record) && validateRecord(record).success) {
          await db
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
          logger.info(`indexed event ${evt.uri.toString()}`);
        }
        else {
          logger.error({ err: validateRecord(record).error }, 'failed to validate our data');
        }
      } 
      else if (evt.event === 'delete' && evt.collection === tileCollection) {
        await db.deleteFrom('status').where({ uri: evt.uri.toString() });
      }
    },
    onError: () => {
      logger.error('error on firehose ingestion');
    },
    filterCollections: [tileCollection],
    excludeIdentity: true,
    excludeAccount: true,
  });
}
