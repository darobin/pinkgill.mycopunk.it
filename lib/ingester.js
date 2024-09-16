
import pino from 'pino';
import { Firehose } from '@atproto/sync'
import { isRecord, validateRecord } from './lexicons/types/space/polypod/pinkgill/tile.js';
import { ids } from './lexicons/lexicons.js';

const tileCollection = ids.SpacePolypodPinkgillTile;

export function createIngester (db, idResolver) {
  const logger = pino({ name: 'firehose ingestion' });
  return new Firehose({
    idResolver,
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
        }
      } 
      else if (evt.event === 'delete' && evt.collection === tileCollection) {
        await db.deleteFrom('status').where({ uri: evt.uri.toString() });
      }
    },
    onError: (err) => {
      logger.error({ err }, 'error on firehose ingestion');
    },
    filterCollections: [tileCollection],
    excludeIdentity: true,
    excludeAccount: true,
  });
}
