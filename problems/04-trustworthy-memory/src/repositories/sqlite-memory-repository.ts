import type { Memory, MemorySource, MemoryType } from "../domain/memory";

import type { Database } from "better-sqlite3";
import type { MemoryRepository } from "./memory-repository";

interface MemoryRow {
  id: string;
  content: string;
  normalized_content: string;
  type: string;
  lifecycle: string;
  source_id: string;
  source_type: string;
  source_excerpt: string;
  created_at: string;
  updated_at: string;
  supersedes_memory_id: string | null;
  superseded_by_memory_id: string | null;
  conflict_status: string;
}

export class SqliteMemoryRepository implements MemoryRepository {
  constructor(private readonly db: Database) {}

  async list(): Promise<Memory[]> {
    const rows = this.db
      .prepare(
        `
          SELECT *
          FROM memories
          ORDER BY created_at ASC, id ASC
        `,
      )
      .all() as MemoryRow[];

    return rows.map((row) => this.toMemory(row));
  }

  async getById(id: string): Promise<Memory | undefined> {
    const row = this.db
      .prepare(
        `
          SELECT *
          FROM memories
          WHERE id = ?
        `,
      )
      .get(id) as MemoryRow | undefined;

    return row ? this.toMemory(row) : undefined;
  }

  async save(memory: Memory): Promise<void> {
    const existing = this.db
      .prepare(
        `
          SELECT id
          FROM memories
          WHERE id = ?
        `,
      )
      .get(memory.id) as { id: string } | undefined;

    if (existing) {
      throw new Error(`Memory already exists: ${memory.id}`);
    }

    this.db
      .prepare(
        `
          INSERT INTO memories (
            id,
            content,
            normalized_content,
            type,
            lifecycle,
            source_id,
            source_type,
            source_excerpt,
            created_at,
            updated_at,
            supersedes_memory_id,
            superseded_by_memory_id,
            conflict_status
          )
          VALUES (
            @id,
            @content,
            @normalized_content,
            @type,
            @lifecycle,
            @source_id,
            @source_type,
            @source_excerpt,
            @created_at,
            @updated_at,
            @supersedes_memory_id,
            @superseded_by_memory_id,
            @conflict_status
          )
        `,
      )
      .run(this.toRow(memory));
  }

  async replace(memory: Memory): Promise<void> {
    const result = this.db
      .prepare(
        `
          UPDATE memories
          SET
            content = @content,
            normalized_content = @normalized_content,
            type = @type,
            lifecycle = @lifecycle,
            source_id = @source_id,
            source_type = @source_type,
            source_excerpt = @source_excerpt,
            created_at = @created_at,
            updated_at = @updated_at,
            supersedes_memory_id = @supersedes_memory_id,
            superseded_by_memory_id = @superseded_by_memory_id,
            conflict_status = @conflict_status
          WHERE id = @id
        `,
      )
      .run(this.toRow(memory));

    if (result.changes === 0) {
      throw new Error(`Memory not found: ${memory.id}`);
    }
  }

  async supersede(
    previousMemory: Memory,
    replacementMemory: Memory,
  ): Promise<void> {
    const transaction = this.db.transaction(() => {
      const previousExists = this.db
        .prepare(
          `
            SELECT id
            FROM memories
            WHERE id = ?
          `,
        )
        .get(previousMemory.id);

      if (!previousExists) {
        throw new Error(`Memory not found: ${previousMemory.id}`);
      }

      const replacementExists = this.db
        .prepare(
          `
            SELECT id
            FROM memories
            WHERE id = ?
          `,
        )
        .get(replacementMemory.id);

      if (replacementExists) {
        throw new Error(
          `Replacement memory already exists: ${replacementMemory.id}`,
        );
      }

      this.db
        .prepare(
          `
            UPDATE memories
            SET
              content = @content,
              normalized_content = @normalized_content,
              type = @type,
              lifecycle = @lifecycle,
              source_id = @source_id,
              source_type = @source_type,
              source_excerpt = @source_excerpt,
              created_at = @created_at,
              updated_at = @updated_at,
              supersedes_memory_id = @supersedes_memory_id,
              superseded_by_memory_id = @superseded_by_memory_id,
              conflict_status = @conflict_status
            WHERE id = @id
          `,
        )
        .run(this.toRow(previousMemory));

      this.db
        .prepare(
          `
            INSERT INTO memories (
              id,
              content,
              normalized_content,
              type,
              lifecycle,
              source_id,
              source_type,
              source_excerpt,
              created_at,
              updated_at,
              supersedes_memory_id,
              superseded_by_memory_id,
              conflict_status
            )
            VALUES (
              @id,
              @content,
              @normalized_content,
              @type,
              @lifecycle,
              @source_id,
              @source_type,
              @source_excerpt,
              @created_at,
              @updated_at,
              @supersedes_memory_id,
              @superseded_by_memory_id,
              @conflict_status
            )
          `,
        )
        .run(this.toRow(replacementMemory));
    });

    transaction();
  }

  private toRow(memory: Memory): MemoryRow {
    return {
      id: memory.id,
      content: memory.content,
      normalized_content: memory.normalizedContent,
      type: memory.type,
      lifecycle: memory.lifecycle,
      source_id: memory.source.sourceId,
      source_type: memory.source.sourceType,
      source_excerpt: memory.source.excerpt,
      created_at: memory.createdAt,
      updated_at: memory.updatedAt,
      supersedes_memory_id: memory.supersedesMemoryId,
      superseded_by_memory_id: memory.supersededByMemoryId,
      conflict_status: memory.conflictStatus,
    };
  }

  private toMemory(row: MemoryRow): Memory {
    const source: MemorySource = {
      sourceId: row.source_id,
      sourceType: row.source_type as MemorySource["sourceType"],
      excerpt: row.source_excerpt,
    };

    return {
      id: row.id,
      content: row.content,
      normalizedContent: row.normalized_content,
      type: row.type as MemoryType,
      lifecycle: row.lifecycle as Memory["lifecycle"],
      source,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      supersedesMemoryId: row.supersedes_memory_id,
      supersededByMemoryId: row.superseded_by_memory_id,
      conflictStatus: row.conflict_status as Memory["conflictStatus"],
    };
  }
}
