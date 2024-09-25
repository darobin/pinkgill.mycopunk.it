
import events from 'node:events';
import process from 'node:process';
import { mkdir } from 'node:fs/promises';
import { basename } from 'node:path';
import express from 'express';
import { HOST, PORT, DB_PATH, UPLOAD_PATH, BLOB_PATH } from './lib/config.js';
import { pino } from 'pino'

import createRouter from './lib/router.js';
import { createDB, migrateToLatest, dbEvents } from './lib/db.js';
import { createJetStreamIngester } from './lib/ingester.js';
import { createClient } from './lib/auth-client.js';
import { createBidirectionalResolver, createIdResolver } from './lib/id-resolver.js';

export class Server {
  constructor(app, server, ctx) {
    this.app = app;
    this.server = server;
    this.ctx = ctx;
  }

  static async create () {
    const logger = pino({ name: 'pinkgill start' });
    await Promise.all(
      [basename(DB_PATH), UPLOAD_PATH, BLOB_PATH].map(pth => mkdir(pth, { recursive: true }))
    );
    const db = createDB(DB_PATH);
    await migrateToLatest(db);

    // Create the atproto utilities
    const oauthClient = await createClient(db);
    const baseIdResolver = createIdResolver();
    const resolver = createBidirectionalResolver(baseIdResolver);
    // const ingester = await createIngester(db, baseIdResolver);
    const ingester = await createJetStreamIngester(db);
    const ctx = {
      db,
      dbEvents,
      ingester,
      logger,
      oauthClient,
      resolver,
    };

    ingester.start();

    const app = express();
    app.set('trust proxy', true);
    const router = await createRouter(ctx);
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    app.use(router);
    app.use((req, res) => res.status(404).json({ ok: false, error: 'Not found' }));
    const server = app.listen(PORT);
    await events.once(server, 'listening');
    logger.info(`Pinkgill running at http://${HOST}/.`);

    return new Server(app, server, ctx);
  }

  async close () {
    this.ctx.logger.info('sigint received, shutting down');
    await this.ctx.ingester.destroy();
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
