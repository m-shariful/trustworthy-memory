import type { Memory, MemorySource, MemoryType } from "../domain/memory";

import type { MemoryRepository } from "../repositories/memory-repository";
import { randomUUID } from "node:crypto";

export interface MemoryServiceDependencies {
  repository: MemoryRepository;
  now?: () => string;
  createId?: () => string;
}

export interface CreateMemoryInput {
  content: string;
  type: MemoryType;
  source: MemorySource;
  normalizedContent?: string;
  conflictStatus?: "none" | "ambiguous";
}

export interface CorrectMemoryInput {
  replacementContent: string;
  replacementType?: MemoryType;
  replacementSource: MemorySource;
  replacementNormalizedContent?: string;
}

export class MemoryService {
  private readonly now: () => string;
  private readonly createId: () => string;

  constructor(
    private readonly repository: MemoryRepository,
    dependencies: Omit<MemoryServiceDependencies, "repository"> = {},
  ) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
    this.createId = dependencies.createId ?? randomUUID;
  }

  async createMemory(input: CreateMemoryInput): Promise<Memory> {
    const timestamp = this.now();

    const memory: Memory = {
      id: this.createId(),
      content: input.content.trim(),
      normalizedContent:
        input.normalizedContent?.trim() ?? this.normalizeContent(input.content),
      type: input.type,
      lifecycle: "active",
      source: input.source,
      createdAt: timestamp,
      updatedAt: timestamp,
      supersedesMemoryId: null,
      supersededByMemoryId: null,
      conflictStatus: input.conflictStatus ?? "none",
    };

    await this.repository.save(memory);

    return memory;
  }

  async inspectMemory(id: string): Promise<Memory> {
    const memory = await this.repository.getById(id);

    if (!memory) {
      throw new Error(`Memory not found: ${id}`);
    }

    return memory;
  }

  async correctMemory(
    memoryId: string,
    input: CorrectMemoryInput,
  ): Promise<{
    previousMemory: Memory;
    replacementMemory: Memory;
  }> {
    const previousMemory = await this.inspectMemory(memoryId);

    if (previousMemory.lifecycle !== "active") {
      throw new Error(`Only active memories can be corrected: ${memoryId}`);
    }

    const timestamp = this.now();

    const supersededMemory: Memory = {
      ...previousMemory,
      lifecycle: "superseded",
      updatedAt: timestamp,
      supersededByMemoryId: this.createId(),
    };

    const replacementId = supersededMemory.supersededByMemoryId;

    if (!replacementId) {
      throw new Error("Replacement ID could not be generated");
    }

    const replacementMemory: Memory = {
      id: replacementId,
      content: input.replacementContent.trim(),
      normalizedContent:
        input.replacementNormalizedContent?.trim() ??
        this.normalizeContent(input.replacementContent),
      type: input.replacementType ?? previousMemory.type,
      lifecycle: "active",
      source: input.replacementSource,
      createdAt: timestamp,
      updatedAt: timestamp,
      supersedesMemoryId: previousMemory.id,
      supersededByMemoryId: null,
      conflictStatus: "none",
    };

    await this.repository.supersede(supersededMemory, replacementMemory);

    return {
      previousMemory: supersededMemory,
      replacementMemory,
    };
  }

  async deleteMemory(id: string): Promise<Memory> {
    const memory = await this.inspectMemory(id);

    if (memory.lifecycle === "deleted") {
      return memory;
    }

    const deletedMemory: Memory = {
      ...memory,
      lifecycle: "deleted",
      updatedAt: this.now(),
    };

    await this.repository.replace(deletedMemory);

    return deletedMemory;
  }

  private normalizeContent(content: string): string {
    return content
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s]/gu, " ")
      .replace(/\s+/g, " ")
      .trim();
  }
}
