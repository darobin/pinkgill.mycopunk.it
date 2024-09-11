
import events from 'node:events';
import process from 'node:process';
import express from 'express';
import { HOST, PORT } from './lib/config.js';
import { pino } from 'pino'
// import type { OAuthClient } from '@atproto/oauth-client-node'
// import { Firehose } from '@atproto/sync'

// import { createDb, migrateToLatest } from '#/db'
// import { env } from '#/lib/env'
// import { createIngester } from '#/ingester'
// import { createRouter } from '#/routes'
// import { createClient } from '#/auth/client'
// import { createBidirectionalResolver, createIdResolver, BidirectionalResolver } from '#/id-resolver'
// import type { Database } from '#/db'
// import { IdResolver, MemoryCache } from '@atproto/identity'

export class Server {
  constructor(app, server, ctx) {
    this.app = app;
    this.server = server;
    this.ctx = ctx;
  }

  static async create () {
    const logger = pino({ name: 'pinkgill start' });

    // Set up the SQLite database
    // const db = createDb(DB_PATH)
    // await migrateToLatest(db)

    // Create the atproto utilities
    // const oauthClient = await createClient(db)
    // const baseIdResolver = createIdResolver()
    // const ingester = createIngester(db, baseIdResolver)
    // const resolver = createBidirectionalResolver(baseIdResolver)
    const ctx = {
      // db,
      // ingester,
      logger,
      // oauthClient,
      // resolver,
    };

    // Subscribe to events on the firehose
    // ingester.start()

    const app = express();
    app.set('trust proxy', true);
    // const router = createRouter(ctx)
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    // app.use(router)
    app.use((_req, res) => res.sendStatus(404).json({ ok: false, error: 'Not found' }));
    const server = app.listen(PORT);
    await events.once(server, 'listening');
    logger.info(`Pinkgill running at http://${HOST}/.`);

    return new Server(app, server, ctx);
  }

  async close () {
    this.ctx.logger.info('sigint received, shutting down');
    // await this.ctx.ingester.destroy()
    return new Promise((resolve) => {
      this.server.close(() => {
        this.ctx.logger.info('server terminated');
        resolve();
      });
    });
  }
}

const run = async () => {
  const server = await Server.create();
  const onCloseSignal = async () => {
    setTimeout(() => process.exit(1), 10000).unref();
    await server.close();
    process.exit();
  }
  process.on('SIGINT', onCloseSignal);
  process.on('SIGTERM', onCloseSignal);
}
run();
