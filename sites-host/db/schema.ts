import { sqliteTable, text, integer, primaryKey } from 'drizzle-orm/sqlite-core';
export const rooms = sqliteTable('race_rooms', {
  code: text('code').primaryKey(),
  version: integer('version').notNull(),
  snapshot: text('snapshot').notNull(),
  expiresAt: integer('expires_at').notNull(),
});
export const limits = sqliteTable('race_limits', {
  key: text('key').notNull(),
  bucket: integer('bucket').notNull(),
  count: integer('count').notNull(),
}, table => [primaryKey({ columns: [table.key, table.bucket] })]);
