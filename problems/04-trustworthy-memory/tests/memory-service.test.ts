import { describe, expect, it } from "vitest";

import { InMemoryMemoryRepository } from "../src/repositories/memory-repository";
import { MemoryService } from "../src/services/memory-service";

describe("MemoryService", () => {
  it("stores a memory with provenance and inspectable source", async () => {
    const repository = new InMemoryMemoryRepository();

    const service = new MemoryService(repository, {
      now: () => "2026-09-21T12:00:00.000Z",
      createId: () => "memory-1",
    });

    const memory = await service.createMemory({
      content: "I live in Pune.",
      type: "profile",
      source: {
        sourceId: "message-1",
        sourceType: "message",
        excerpt: "I live in Pune.",
      },
    });

    expect(memory.id).toBe("memory-1");
    expect(memory.lifecycle).toBe("active");
    expect(memory.source.sourceId).toBe("message-1");
    expect(memory.source.excerpt).toBe("I live in Pune.");

    const inspected = await service.inspectMemory("memory-1");

    expect(inspected).toEqual(memory);
  });

  it("explicitly supersedes an old memory when corrected", async () => {
    const repository = new InMemoryMemoryRepository();

    let idCounter = 0;

    const service = new MemoryService(repository, {
      now: () => "2026-09-21T12:00:00.000Z",
      createId: () => {
        idCounter += 1;
        return `memory-${idCounter}`;
      },
    });

    const original = await service.createMemory({
      content: "I live in Pune.",
      type: "profile",
      source: {
        sourceId: "message-1",
        sourceType: "message",
        excerpt: "I live in Pune.",
      },
    });

    const result = await service.correctMemory(original.id, {
      replacementContent: "I live in Mumbai.",
      replacementSource: {
        sourceId: "message-2",
        sourceType: "message",
        excerpt: "I moved to Mumbai.",
      },
    });

    expect(result.previousMemory.lifecycle).toBe("superseded");
    expect(result.replacementMemory.lifecycle).toBe("active");

    expect(result.previousMemory.supersededByMemoryId).toBe(
      result.replacementMemory.id,
    );

    expect(result.replacementMemory.supersedesMemoryId).toBe(
      result.previousMemory.id,
    );
  });

  it("keeps the superseded memory available for historical inspection", async () => {
    const repository = new InMemoryMemoryRepository();

    let idCounter = 0;

    const service = new MemoryService(repository, {
      now: () => "2026-09-21T12:00:00.000Z",
      createId: () => {
        idCounter += 1;
        return `memory-${idCounter}`;
      },
    });

    const original = await service.createMemory({
      content: "I live in Pune.",
      type: "profile",
      source: {
        sourceId: "message-1",
        sourceType: "message",
        excerpt: "I live in Pune.",
      },
    });

    await service.correctMemory(original.id, {
      replacementContent: "I live in Mumbai.",
      replacementSource: {
        sourceId: "message-2",
        sourceType: "message",
        excerpt: "I moved to Mumbai.",
      },
    });

    const historical = await service.inspectMemory(original.id);

    expect(historical.content).toBe("I live in Pune.");
    expect(historical.lifecycle).toBe("superseded");
    expect(historical.source.sourceId).toBe("message-1");
  });

  it("deletes a memory without destroying its provenance", async () => {
    const repository = new InMemoryMemoryRepository();

    const service = new MemoryService(repository, {
      now: () => "2026-09-21T12:00:00.000Z",
      createId: () => "memory-1",
    });

    await service.createMemory({
      content: "I prefer dark mode.",
      type: "preference",
      source: {
        sourceId: "message-3",
        sourceType: "message",
        excerpt: "I prefer dark mode.",
      },
    });

    const deleted = await service.deleteMemory("memory-1");

    expect(deleted.lifecycle).toBe("deleted");
    expect(deleted.source.sourceId).toBe("message-3");

    const inspected = await service.inspectMemory("memory-1");

    expect(inspected.lifecycle).toBe("deleted");
  });

  it("does not allow correction of a superseded memory", async () => {
    const repository = new InMemoryMemoryRepository();

    let idCounter = 0;

    const service = new MemoryService(repository, {
      now: () => "2026-09-21T12:00:00.000Z",
      createId: () => {
        idCounter += 1;
        return `memory-${idCounter}`;
      },
    });

    const original = await service.createMemory({
      content: "I live in Pune.",
      type: "profile",
      source: {
        sourceId: "message-1",
        sourceType: "message",
        excerpt: "I live in Pune.",
      },
    });

    await service.correctMemory(original.id, {
      replacementContent: "I live in Mumbai.",
      replacementSource: {
        sourceId: "message-2",
        sourceType: "message",
        excerpt: "I moved to Mumbai.",
      },
    });

    await expect(
      service.correctMemory(original.id, {
        replacementContent: "I live in Dhaka.",
        replacementSource: {
          sourceId: "message-3",
          sourceType: "message",
          excerpt: "I moved to Dhaka.",
        },
      }),
    ).rejects.toThrow("Only active memories can be corrected");
  });
});
