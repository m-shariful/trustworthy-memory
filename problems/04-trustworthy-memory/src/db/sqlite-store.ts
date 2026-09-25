import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import path from "node:path";

export class SqliteStore {
  private readonly db: Database.Database;

  constructor(databasePath: string) {
    const directory = path.dirname(databasePath);

    mkdirSync(directory, { recursive: true });

    this.db = new Database(databasePath);

    this.db.pragma("journal_mode = WAL");

    this.initialize();
  }

  private initialize(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS memories (
        id TEXT PRIMARY KEY,
        content TEXT NOT NULL,
        normalized_content TEXT NOT NULL,
        type TEXT NOT NULL,
        lifecycle TEXT NOT NULL,
        source_id TEXT NOT NULL,
        source_type TEXT NOT NULL,
        source_excerpt TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        supersedes_memory_id TEXT,
        superseded_by_memory_id TEXT,
        conflict_status TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_memories_lifecycle
        ON memories(lifecycle);

      CREATE INDEX IF NOT EXISTS idx_memories_conflict_status
        ON memories(conflict_status);
    `);
  }

  get database(): Database.Database {
    return this.db;
  }

  close(): void {
    this.db.close();
  }
}
