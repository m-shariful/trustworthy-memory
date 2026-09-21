import { JsonFileStore } from "../db/file-store";
import type { Memory } from "../domain/memory";
import path from "node:path";

export interface MemoryRepository {
  list(): Promise<Memory[]>;
  getById(id: string): Promise<Memory | undefined>;
  save(memory: Memory): Promise<void>;
  replace(memory: Memory): Promise<void>;
}

export class FileMemoryRepository implements MemoryRepository {
  constructor(private readonly store: JsonFileStore<Memory[]>) {}

  async list(): Promise<Memory[]> {
    return this.store.read();
  }

  async getById(id: string): Promise<Memory | undefined> {
    const memories = await this.store.read();

    return memories.find((memory) => memory.id === id);
  }

  async save(memory: Memory): Promise<void> {
    const memories = await this.store.read();

    if (memories.some((item) => item.id === memory.id)) {
      throw new Error(`Memory already exists: ${memory.id}`);
    }

    await this.store.write([...memories, memory]);
  }

  async replace(memory: Memory): Promise<void> {
    const memories = await this.store.read();

    const index = memories.findIndex((item) => item.id === memory.id);

    if (index === -1) {
      throw new Error(`Memory not found: ${memory.id}`);
    }

    const updated = [...memories];
    updated[index] = memory;

    await this.store.write(updated);
  }
}

export function createFileMemoryRepository(
  filePath = path.join(process.cwd(), "data", "memories.json"),
): MemoryRepository {
  return new FileMemoryRepository(new JsonFileStore<Memory[]>(filePath, []));
}

// For testing
export class InMemoryMemoryRepository implements MemoryRepository {
  private memories: Memory[];

  constructor(initialMemories: Memory[] = []) {
    this.memories = [...initialMemories];
  }

  async list(): Promise<Memory[]> {
    return [...this.memories];
  }

  async getById(id: string): Promise<Memory | undefined> {
    return this.memories.find((memory) => memory.id === id);
  }

  async save(memory: Memory): Promise<void> {
    if (this.memories.some((item) => item.id === memory.id)) {
      throw new Error(`Memory already exists: ${memory.id}`);
    }

    this.memories.push(memory);
  }

  async replace(memory: Memory): Promise<void> {
    const index = this.memories.findIndex((item) => item.id === memory.id);

    if (index === -1) {
      throw new Error(`Memory not found: ${memory.id}`);
    }

    this.memories[index] = memory;
  }
}
