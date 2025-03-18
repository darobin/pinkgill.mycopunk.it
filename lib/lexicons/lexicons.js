
import { Lexicons } from '@atproto/lexicon';
import { property } from 'lit/decorators.js';

export const daslDefs = {
  lexicon: 1,
  id: 'ing.dasl.masl',
  defs: {
    item: {
      type: 'object',
      properties: {
        src: {
          type: 'string',
          format: 'cid',
        },
        mediaType: {
          type: 'string',
        },
      },
      required: ['src'],
    },
  },
};

export const polypodManifestDefs = {
  lexicon: 1,
  id: 'space.polypod.tile',
  defs: {
    main: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          maxLength: 3000,
          maxGraphemes: 300,
        },
        description: {
          type: 'string',
          maxLength: 3000,
          maxGraphemes: 300,
        },
        background_color: {
          type: 'string',
        },
        icons: {
          type: 'array',
          items: {
            type: 'object',
            // There are more properties, but for now this is what we support.
            properties: {
              src: {
                type: 'string', // has to be in resources
              },
            },
            required: ['src'],
          },
        },
        sizing: {
          type: 'object',
          properties: {
            width: {
              type: 'integer',
              mininum: 1,
            },
            height: {
              type: 'integer',
              mininum: 1,
            },
          },
          required: ['width', 'height'],
        },
        wishes: {
          type: 'array',
          items: {
            type: 'ref',
            ref: 'space.polypod.manifest#wish',
          },
        },
        // The problem is that Lexicon cannot represent objects with arbitrary keys,
        // even if they have predictable values as is the case here.
        // Values are ing.dasl.masl#item.
        resources: {
          type: 'unknown',
        },
      },
      required: ['name', 'resources'],
    },
    // This needs expanding as functionality builds up.
    wish: {
      type: 'object',
      properties: {
        can: {
          type: 'string',
          enum: ['instantiate'],
        },
      },
      // required: ['can'],
    },
    // Tile as record and as view.
    record: {
      type: 'record',
      key: 'cid',
      record: {
        type: 'object',
        properties: {
          cid: {
            type: 'string',
            format: 'cid',
          },
          tile: {
            type: 'ref',
            ref: '#main',
          },
          createdAt: {
            type: 'string',
            format: 'datetime',
          },
        },
        required: ['cid', 'tile'],
      },
    },
    view: {
      type: 'object',
      properties: {
        uri: {
          type: 'string',
          format: 'at-uri',
        },
        cid: {
          type: 'string',
          format: 'cid',
        },
        author: {
          type: 'ref',
          ref: 'app.bsky.actor.defs#profileViewBasic',
        },
        record: {
          type: 'ref',
          ref: '#record',
        },
      },
      required: ['cid', 'uri', 'author', 'record', 'indexedAt'],
    },
  },
};


// Dependencies:
// - app.bsky.actor.defs#profileViewDetailed
// - app.bsky.actor.defs#profileViewBasic
// - space.polypod.tile
export const lexiconForXRPC = {
  getCurrentProfile: {
    lexicon: 1,
    id: 'space.polypod.getCurrentProfile',
    defs: {
      main: {
        type: 'query',
        description: 'Get profile for the actor who corresponds to the session this request is in',
        output: {
          encoding: "application/json",
          schema: {
            type: "ref",
            ref: "app.bsky.actor.defs#profileViewDetailed",
          },
        },
      },
    },
  },
  login: {
    lexicon: 1,
    id: 'space.polypod.login',
    defs: {
      main: {
        type: 'procedure',
        description: 'Trigger a login flow, will redirect into the OAuth flow.',
        input: {
          encoding: 'application/json',
          schema: {
            type: 'object',
            properties: {
              identifier: {
                type: 'string',
                format: 'at-identifier',
              },
            },
            required: ['identifier'],
          },
        },
      },
    },
  },
  logout: {
    lexicon: 1,
    id: 'space.polypod.logout',
    defs: {
      main: {
        type: 'procedure',
        description: 'Log out by wiping out the current session.',
      },
    },
  },
  getActorTiles: {
    lexicon: 1,
    id: 'space.polypod.getActorTiles',
    defs: {
      main: {
        type: 'query',
        description: 'Get a list of tiles created by a specific actor.',
        parameters: {
          type: 'params',
          required: ["actor"],
          properties: {
            actor: { type: "string", format: "at-identifier" },
            limit: {
              type: "integer",
              minimum: 1,
              maximum: 100,
              default: 50,
            },
            cursor: { type: "string" },
          },
        },
        output: {
          encoding: "application/json",
          schema: {
            type: "object",
            required: ["tiles"],
            properties: {
              cursor: { "type": "string" },
              tiles: {
                type: "array",
                items: {
                  type: "ref",
                  ref: "space.polypod.tile#view",
                },
              },
            },
          },
        },
      },
    },
  },
  getInstalledTiles: {
    lexicon: 1,
    id: 'space.polypod.getInstalledTiles',
    defs: {
      main: {
        type: 'query',
        description: 'Get the tiles that the current session actor has installed.',
        parameters: {
          type: 'params',
          properties: {
            limit: {
              type: "integer",
              minimum: 1,
              maximum: 100,
              default: 50,
            },
            cursor: { type: "string" },
          },
        },
        output: {
          encoding: "application/json",
          schema: {
            type: "object",
            required: ["tiles"],
            properties: {
              cursor: { "type": "string" },
              tiles: {
                type: "array",
                items: {
                  type: "ref",
                  ref: "space.polypod.tile#view",
                },
              },
            },
          },
        },
      },
    },
  },
  searchTiles: {
    lexicon: 1,
    id: 'space.polypod.searchTiles',
    defs: {
      main: {
        type: 'query',
        description: 'Search for tiles',
        parameters: {
          type: 'params',
          properties: {
            // XXX here we will add query params
            limit: {
              type: "integer",
              minimum: 1,
              maximum: 100,
              default: 50,
            },
            cursor: { type: "string" },
          },
        },
        output: {
          encoding: "application/json",
          schema: {
            type: "object",
            required: ["tiles"],
            properties: {
              cursor: { "type": "string" },
              tiles: {
                type: "array",
                items: {
                  type: "ref",
                  ref: "space.polypod.tile#view",
                },
              },
            },
          },
        },
      },
    },
  },
  uploadTile: {
    lexicon: 1,
    id: 'space.polypod.uploadTile',
    defs: {
      main: {
        type: 'procedure',
        description: 'Upload a tile (the blobs need to already have been uploaded).',
        input: {
          type: 'object',
          properties: {
            tile: {
              type: 'ref',
              ref: 'space.polypod.tile',
            },
          },
          required: ['tile'],
        },
        output: {
          type: 'object',
          properties: {
            cid: {
              type: 'string',
              format: 'cid',
            },
            uri: {
              type: 'string',
              format: 'at-uri',
            },
          },
          required: ['cid', 'uri'],
        },
      },
    },
  },
  getActorProfile: {
    lexicon: 1,
    id: 'space.polypod.getActorProfile',
    defs: {
      main: {
        type: 'query',
        description: 'Get the profile for a given actor.',
        parameters: {
          type: 'params',
          required: ["actor"],
          properties: {
            actor: { type: "string", format: "at-identifier" },
          },
        },
        output: {
          encoding: "application/json",
          schema: {
            type: "ref",
            ref: "app.bsky.actor.defs#profileViewDetailed",
          },
        },
      },
    },
  },
  getTile: {
    lexicon: 1,
    id: 'space.polypod.getTile',
    defs: {
      main: {
        type: 'query',
        description: 'Get the tile object.',
        parameters: {
          type: 'params',
          required: ['cid'],
          properties: {
            cid: { type: 'string', format: 'cid' },
          },
        },
        output: {
          encoding: "application/json",
          schema: {
            type: 'ref',
            ref: 'space.polypod.tile',
          },
        },
      },
    },
  },
  installTile: {
    lexicon: 1,
    id: 'space.polypod.installTile',
    defs: {
      main: {
        type: 'procedure',
        description: 'Install a tile for the session actor',
        input: {
          type: 'object',
          required: ['cid'],
          properties: {
            cid: { type: 'string', format: 'cid' },
          },
        },
      },
    },
  },
  uninstallTile: {
    lexicon: 1,
    id: 'space.polypod.uninstallTile',
    defs: {
      main: {
        type: 'procedure',
        description: 'Uninstall a tile for the session actor.',
        input: {
          type: 'object',
          required: ['cid'],
          properties: {
            cid: { type: 'string', format: 'cid' },
          },
        },
      },
    },
  },
  deleteTile: {
    lexicon: 1,
    id: 'space.polypod.deleteTile',
    defs: {
      main: {
        type: 'procedure',
        description: 'Delete a tile owned by the session actor.',
        input: {
          type: 'object',
          required: ['cid'],
          properties: {
            cid: { type: 'string', format: 'cid' },
          },
        },
      },
    },
  },
};

// XXX this is mostly deprecated stuff, remove when possible
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
  SpacePolypodPinkgillDelete: {
    lexicon: 1,
    id: 'space.polypod.pinkgill.delete',
    defs: {
      main: {
        type: 'record',
        description: 'Record deleting or undeleting a Tile.',
        key: 'tid',
        record: {
          type: 'object',
          required: ['operation', 'tile', 'createdAt'],
          properties: {
            operation: {
              type: 'string',
              enum: ['delete', 'undelete'],
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
  SpacePolypodPinkgillDelete: 'space.polypod.pinkgill.delete',
};
