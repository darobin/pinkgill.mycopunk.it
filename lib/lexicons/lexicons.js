
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
    tile: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          maxLength: 1000,
          maxGraphemes: 100,
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
            ref: '#wish',
          },
        },
        // The problem is that Lexicon cannot represent objects with arbitrary keys,
        // even if they have predictable values as is the case here.
        // Values are ing.dasl.masl#item.
        resources: {
          type: 'unknown',
        },
        prev: {
          type: 'string',
          format: 'cid',
        }
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
      required: ['can'],
    },
  },
};

export const tileDefs = {
  lexicon: 1,
  id: 'space.polypod.tile',
  defs: {
    // Tile as record and as view.
    main: {
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
            ref: 'ing.dasl.masl#tile',
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
          ref: '#main',
        },
      },
      required: ['cid', 'uri', 'author', 'record', 'indexedAt'],
    },
  }
};

export const instanceDefs = {
  lexicon: 1,
  id: 'space.polypod.instance',
  defs: {
    // Instance as record and as view.
    main: {
      type: 'record',
      key: 'cid',
      record: {
        type: 'object',
        properties: {
          cid: {
            type: 'string',
            format: 'cid',
          },
          tileRef: {
            type: 'string',
            ref: 'cid',
          },
          createdAt: {
            type: 'string',
            format: 'datetime',
          },
        },
        required: ['cid', 'tileRef'],
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
          ref: '#main',
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
// - space.polypod.instance
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
            type: 'ref',
            ref: "app.bsky.actor.defs#profileViewDetailed",
            // type: "object",
            // required: [],
            // properties: {
            //   handle: {
            //     type: 'string',
            //     format: 'handle',
            //   },
            //   did: {
            //     type: 'string',
            //     format: 'did',
            //   },
            //   profile: {
            //     type: 'ref',
            //     ref: "app.bsky.actor.defs#profileViewDetailed",
            //   }
            // },
          },
        },
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
  // We just POST the arrayBuffer.
  uploadBlob: {
    lexicon: 1,
    id: 'space.polypod.uploadBlob',
    defs: {
      main: {
        type: "procedure",
        description: "Upload a blob.",
        parameters: {
          type: "params",
          required: ["cid"],
          properties: {
            cid: {
              type: "string",
              format: "cid",
              description: "The CID of the blob. The server will recompute it and verify that it matches."
            },
          },
        },
        input: {},
        output: {
          encoding: "application/json",
          schema: {
            type: "object",
            required: ["cid"],
            properties: {
              cid: { type: "cid-link" },
            },
          },
        },
      },
    },
  },
  getBlob: {
    lexicon: 1,
    id: "space.polypod.getBlob",
    defs: {
      main: {
        type: "query",
        description: "Get a blob by CID.",
        parameters: {
          type: "params",
          required: ["cid"],
          properties: {
            cid: {
              type: "string",
              format: "cid",
              description: "The CID of the blob to fetch"
            },
          },
        },
        output: {
          encoding: 'application/octet-stream',
        },
      },
    },
  },
  hasBlob: {
    lexicon: 1,
    id: "space.polypod.hasBlob",
    defs: {
      main: {
        type: "query",
        description: "Check that a blob exists by CID.",
        parameters: {
          type: "params",
          required: ["cid"],
          properties: {
            cid: {
              type: "string",
              format: "cid",
              description: "The CID of the blob to check."
            },
          },
        },
        output: {
          encoding: 'application/json',
          schema: {
            type: "object",
            properties: {
              exists: {
                type: 'boolean',
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
              ref: 'ing.dasl.masl#tile',
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
            ref: 'ing.dasl.masl#tile',
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
  createInstance: {
    lexicon: 1,
    id: 'space.polypod.createInstance',
    defs: {
      main: {
        type: 'procedure',
        description: 'Instantiate a tile.',
        input: {
          type: 'ref',
          ref: 'space.polypod.instance'
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
  deleteInstance: {
    lexicon: 1,
    id: 'space.polypod.deleteInstance',
    defs: {
      main: {
        type: 'procedure',
        description: 'Delete an instance owned by the session actor.',
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

export const collections = {
  tiles: tileDefs.id,
  instance: instanceDefs.id,
};
