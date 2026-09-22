import { describe, expect, it } from "vitest";

import { InMemoryMemoryRepository } from "../src/repositories/memory-repository";
import { MemoryRetriever } from "../src/retrieval/memory-retriever";
import { MemoryService } from "../src/services/memory-service";

describe("MemoryRetriever", () => {
  it("returns relevant active memories with selection evidence", async () => {
    const repository = new InMemoryMemoryRepository();

    let idCounter = 0;

    const service = new MemoryService(repository, {
      now: () => "2026-09-21T12:00:00.000Z",
      createId: () => {
        idCounter += 1;
        return `memory-${idCounter}`;
      },
    });

    await service.createMemory({
      content: "I live in Mumbai.",
      type: "profile",
      source: {
        sourceId: "message-1",
        sourceType: "message",
        excerpt: "I live in Mumbai.",
      },
    });

    await service.createMemory({
      content: "I prefer dark mode.",
      type: "preference",
      source: {
        sourceId: "message-2",
        sourceType: "message",
        excerpt: "I prefer dark mode.",
      },
    });

    const retriever = new MemoryRetriever(repository);

    const results = await retriever.retrieve("What city do I live in?");

    expect(results).toHaveLength(1);
    expect(results[0].memory.content).toBe("I live in Mumbai.");

    expect(results[0].evidence.score).toBeGreaterThan(0);
    expect(results[0].evidence.matchedTokens.length).toBeGreaterThan(0);
  });

  it("excludes superseded memories from current retrieval", async () => {
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

    const retriever = new MemoryRetriever(repository);

    const results = await retriever.retrieve("Where do I live?");

    expect(
      results.some((result) => result.memory.content === "I live in Pune."),
    ).toBe(false);

    expect(
      results.some((result) => result.memory.content === "I live in Mumbai."),
    ).toBe(true);
  });

  it("excludes deleted memories from current retrieval", async () => {
    const repository = new InMemoryMemoryRepository();

    const service = new MemoryService(repository, {
      now: () => "2026-09-21T12:00:00.000Z",
      createId: () => "memory-1",
    });

    await service.createMemory({
      content: "I prefer dark mode.",
      type: "preference",
      source: {
        sourceId: "message-1",
        sourceType: "message",
        excerpt: "I prefer dark mode.",
      },
    });

    await service.deleteMemory("memory-1");

    const retriever = new MemoryRetriever(repository);

    const results = await retriever.retrieve(
      "What interface preference do I have?",
    );

    expect(results).toHaveLength(0);
  });

  it("respects the retrieval limit", async () => {
    const repository = new InMemoryMemoryRepository();

    const service = new MemoryService(repository, {
      now: () => "2026-09-21T12:00:00.000Z",
      createId: (() => {
        let counter = 0;

        return () => {
          counter += 1;
          return `memory-${counter}`;
        };
      })(),
    });

    for (const city of [
      "Mumbai",
      "Pune",
      "Dhaka",
      "Delhi",
      "Rajshahi",
      "Chittagong",
    ]) {
      await service.createMemory({
        content: `I visited ${city}.`,
        type: "profile",
        source: {
          sourceId: `message-${city}`,
          sourceType: "message",
          excerpt: `I visited ${city}.`,
        },
      });
    }

    const retriever = new MemoryRetriever(repository);

    const results = await retriever.retrieve("I visited city", { limit: 3 });

    expect(results).toHaveLength(3);
  });

  it("returns deterministic ordering for equal scores", async () => {
    const repository = new InMemoryMemoryRepository();

    const service = new MemoryService(repository, {
      now: () => "2026-09-21T12:00:00.000Z",
      createId: (() => {
        let counter = 0;

        return () => {
          counter += 1;
          return `memory-${counter}`;
        };
      })(),
    });

    await service.createMemory({
      content: "I enjoy hiking.",
      type: "preference",
      source: {
        sourceId: "message-1",
        sourceType: "message",
        excerpt: "I enjoy hiking.",
      },
    });

    await service.createMemory({
      content: "I enjoy cooking.",
      type: "preference",
      source: {
        sourceId: "message-2",
        sourceType: "message",
        excerpt: "I enjoy cooking.",
      },
    });

    const retriever = new MemoryRetriever(repository);

    const first = await retriever.retrieve("I enjoy");
    const second = await retriever.retrieve("I enjoy");

    expect(first.map((result) => result.memory.id)).toEqual(
      second.map((result) => result.memory.id),
    );
  });

  it("preserves ambiguous memories but excludes them from current retrieval", async () => {
    const repository = new InMemoryMemoryRepository();

    let idCounter = 0;

    const service = new MemoryService(repository, {
      now: () => "2026-09-21T12:00:00.000Z",
      createId: () => {
        idCounter += 1;
        return `memory-${idCounter}`;
      },
    });

    const currentMemory = await service.createMemory({
      content: "I live in Mumbai.",
      type: "profile",
      source: {
        sourceId: "message-current",
        sourceType: "message",
        excerpt: "I live in Mumbai.",
      },
    });

    const ambiguousMemory = await service.createMemory({
      content: "I may move to Pune next year.",
      type: "profile",
      conflictStatus: "ambiguous",
      source: {
        sourceId: "message-ambiguous",
        sourceType: "message",
        excerpt: "I may move to Pune next year.",
      },
    });

    const retriever = new MemoryRetriever(repository);

    const results = await retriever.retrieve("Where do I live?");

    // The current memory remains active.
    expect((await service.inspectMemory(currentMemory.id)).lifecycle).toBe(
      "active",
    );

    // The ambiguous candidate is preserved, not deleted or superseded.
    expect((await service.inspectMemory(ambiguousMemory.id)).lifecycle).toBe(
      "active",
    );

    expect(
      (await service.inspectMemory(ambiguousMemory.id)).conflictStatus,
    ).toBe("ambiguous");

    // Current retrieval excludes the ambiguous candidate.
    expect(
      results.some((result) => result.memory.id === currentMemory.id),
    ).toBe(true);

    expect(
      results.some((result) => result.memory.id === ambiguousMemory.id),
    ).toBe(false);
  });
});
