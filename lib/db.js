
import SqliteDb from 'better-sqlite3';
import { Kysely, Migrator, SqliteDialect } from 'kysely';

// Migrations
const migrations = {};
const migrationProvider = {
  async getMigrations () {
    return migrations;
  },
};

migrations['001'] = {
  async up (db) {
    // await db.schema
    //   .createTable('status')
    //   .addColumn('uri', 'varchar', (col) => col.primaryKey())
    //   .addColumn('authorDid', 'varchar', (col) => col.notNull())
    //   .addColumn('status', 'varchar', (col) => col.notNull())
    //   .addColumn('createdAt', 'varchar', (col) => col.notNull())
    //   .addColumn('indexedAt', 'varchar', (col) => col.notNull())
    //   .execute()
    await db.schema
      .createTable('auth_session')
      .addColumn('key', 'varchar', (col) => col.primaryKey())
      .addColumn('session', 'varchar', (col) => col.notNull())
      .execute();
    await db.schema
      .createTable('auth_state')
      .addColumn('key', 'varchar', (col) => col.primaryKey())
      .addColumn('state', 'varchar', (col) => col.notNull())
      .execute();
  },
  async down(db) {
    await db.schema.dropTable('auth_state').execute();
    await db.schema.dropTable('auth_session').execute();
    // await db.schema.dropTable('status').execute()
  },
};

export const createDB = (location) => {
  return new Kysely({
    dialect: new SqliteDialect({
      database: new SqliteDb(location),
    }),
  });
}

export const migrateToLatest = async (db) => {
  const migrator = new Migrator({ db, provider: migrationProvider });
  const { error } = await migrator.migrateToLatest();
  if (error) throw error;
}
