import type { Store, StoredRoom } from './rooms';

interface Result {
  meta: { changes: number };
}
interface Statement {
  bind(...values: (string | number)[]): Statement;
  first<T>(): Promise<T | null>;
  run(): Promise<Result>;
}
export interface Database {
  prepare(sql: string): Statement;
}

export class D1Store implements Store {
  constructor(private db: Database) {}
  async get(code: string): Promise<StoredRoom | null> {
    const row = await this.db
      .prepare('SELECT snapshot FROM race_rooms WHERE code = ?')
      .bind(code)
      .first<{ snapshot: string }>();
    return row ? (JSON.parse(row.snapshot) as StoredRoom) : null;
  }
  async put(room: StoredRoom, previous: number | null): Promise<boolean> {
    const snapshot = JSON.stringify(room);
    const statement =
      previous === null
        ? this.db
            .prepare(
              'INSERT INTO race_rooms (code, version, snapshot, expires_at) VALUES (?, ?, ?, ?) ON CONFLICT(code) DO NOTHING',
            )
            .bind(room.code, room.version, snapshot, room.ttl)
        : this.db
            .prepare(
              'UPDATE race_rooms SET version = ?, snapshot = ?, expires_at = ? WHERE code = ? AND version = ?',
            )
            .bind(room.version, snapshot, room.ttl, room.code, previous);
    return (await statement.run()).meta.changes === 1;
  }
  async rate(key: string, bucket: number, maximum: number): Promise<boolean> {
    await this.db
      .prepare('DELETE FROM race_limits WHERE bucket < ?')
      .bind(bucket - 1)
      .run();
    await this.db
      .prepare('DELETE FROM race_rooms WHERE expires_at < ?')
      .bind(bucket * 60000)
      .run();
    const row = await this.db
      .prepare(
        'INSERT INTO race_limits (key, bucket, count) VALUES (?, ?, 1) ON CONFLICT(key, bucket) DO UPDATE SET count = count + 1 RETURNING count',
      )
      .bind(key, bucket)
      .first<{ count: number }>();
    return !!row && row.count <= maximum;
  }
}
