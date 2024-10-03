
import { Lexicons } from '@atproto/lexicon';

export const schemaDict = {
  SpacePolypodPinkgillTile: {
    lexicon: 1,
    id: 'space.polypod.pinkgill.tile',
    defs: {
      main: {
        type: 'record',
        description: 'Record containing a Tile.',
        key: 'tid',
        record: {
          type: 'object',
          required: ['name', 'resources', 'createdAt'],
          properties: {
            name: {
              type: 'string',
              maxLength: 1000,
              maxGraphemes: 100,
              description: 'The name of the tile.',
            },
            resources: {
              type: 'array',
              items: {
                type: 'ref',
                ref: 'lex:space.polypod.pinkgill.tile#resource',
              },
            },
            createdAt: {
              type: 'string',
              format: 'datetime',
              description:
                'Client-declared timestamp when this tile was originally created.',
            },
          },
        },
      },
      resource: {
        type: 'object',
        properties: {
          path: {
            type: 'string',
            maxLength: 3000,
            maxGraphemes: 300,
            description:
              'The /-anchored path of the resource in the tile tile.',
          },
          src: {
            type: 'blob',
            accept: ['*/*'],
          },
        },
      },
    },
  },
  SpacePolypodPinkgillInstall: {
    lexicon: 1,
    id: 'space.polypod.pinkgill.install',
    defs: {
      main: {
        type: 'record',
        description: 'Record installing or uninstalling a Tile.',
        key: 'tid',
        record: {
          type: 'object',
          required: ['operation', 'tile', 'createdAt'],
          properties: {
            operation: {
              type: 'string',
              enum: ['install', 'uninstall'],
              description: 'The operation that is performed.',
            },
            tile: {
              type: 'string',
              format: 'at-uri',
              description: 'AT URL pointing to the tile.',
            },
            createdAt: {
              type: 'string',
              format: 'datetime',
              description:
                'Client-declared timestamp when the operation was carried out.',
            },
          },
        },
      },
    },
  },
  SpacePolypodPinkgillInstance: {
    lexicon: 1,
    id: 'space.polypod.pinkgill.instance',
    defs: {
      main: {
        type: 'record',
        description: 'Record instance of a tile with data.',
        key: 'tid',
        record: {
          type: 'object',
          required: ['data', 'tile', 'createdAt'],
          properties: {
            data: {
              type: 'unknown',
              description: 'The data for the tile.',
            },
            tile: {
              type: 'string',
              format: 'at-uri',
              description: 'AT URL pointing to the tile.',
            },
            createdAt: {
              type: 'string',
              format: 'datetime',
              description:
                'Client-declared timestamp when the operation was carried out.',
            },
          },
        },
      },
    },
  },
}
export const schemas = Object.values(schemaDict);
export const lexicons = new Lexicons(schemas);
export const ids = { 
  SpacePolypodPinkgillTile: 'space.polypod.pinkgill.tile',
  SpacePolypodPinkgillInstall: 'space.polypod.pinkgill.install',
  SpacePolypodPinkgillInstance: 'space.polypod.pinkgill.instance',
};
