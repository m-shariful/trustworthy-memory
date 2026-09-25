import { InMemoryMemoryRepository } from "./repositories/memory-repository";
import { MemoryRetriever } from "./retrieval/memory-retriever";
import { MemoryService } from "./services/memory-service";

async function main(): Promise<void> {
  const repository = new InMemoryMemoryRepository();

  let idCounter = 0;

  const service = new MemoryService(repository, {
    now: () => "2026-09-21T12:00:00.000Z",
    createId: () => {
      idCounter += 1;
      return `demo-memory-${idCounter}`;
    },
  });

  const retriever = new MemoryRetriever(repository);

  console.log("=== Trustworthy Long-Term Memory Demo ===\n");

  // 1. Store a memory with provenance.
  console.log("1. Store memory");

  const originalMemory = await service.createMemory({
    content: "I live in Pune.",
    type: "profile",
    source: {
      sourceId: "demo-message-1",
      sourceType: "message",
      excerpt: "I live in Pune.",
    },
  });

  console.log(`Stored: ${originalMemory.content}`);
  console.log(`ID: ${originalMemory.id}`);
  console.log(`Source: ${originalMemory.source.sourceId}`);
  console.log(`Excerpt: "${originalMemory.source.excerpt}"\n`);

  // 2. Retrieve relevant context.
  console.log("2. Retrieve relevant context");

  let results = await retriever.retrieve("Where do I live?");

  for (const result of results) {
    console.log(
      `- ${result.memory.content} ` +
        `(score=${result.evidence.score}, ` +
        `matched=${result.evidence.matchedTokens.join(", ")})`,
    );
  }

  console.log("");

  // 3. Explicitly correct the memory.
  console.log("3. Correct memory: Pune -> Mumbai");

  const correction = await service.correctMemory(originalMemory.id, {
    replacementContent: "I live in Mumbai.",
    replacementSource: {
      sourceId: "demo-message-2",
      sourceType: "message",
      excerpt: "I moved to Mumbai.",
    },
  });

  console.log(`Previous: ${correction.previousMemory.content}`);
  console.log(`Previous lifecycle: ${correction.previousMemory.lifecycle}`);
  console.log(
    `Superseded by: ${correction.previousMemory.supersededByMemoryId}`,
  );
  console.log(`Replacement: ${correction.replacementMemory.content}`);
  console.log(
    `Replacement supersedes: ${correction.replacementMemory.supersedesMemoryId}\n`,
  );

  // 4. Verify current retrieval only returns the replacement.
  console.log("4. Retrieve current context after correction");

  results = await retriever.retrieve("Where do I live?");

  for (const result of results) {
    console.log(
      `- ${result.memory.content} ` +
        `(score=${result.evidence.score}, ` +
        `matched=${result.evidence.matchedTokens.join(", ")})`,
    );
  }

  const oldMemoryReturned = results.some(
    (result) => result.memory.id === originalMemory.id,
  );

  console.log(`Old Pune memory returned: ${oldMemoryReturned}`);
  console.log("");

  // 5. Store ambiguous statement.
  console.log("5. Store ambiguous statement");

  const ambiguousMemory = await service.createMemory({
    content: "I may move to Pune next year.",
    type: "profile",
    source: {
      sourceId: "demo-message-3",
      sourceType: "message",
      excerpt: "I may move to Pune next year.",
    },
    conflictStatus: "ambiguous",
  });

  console.log(`Stored: ${ambiguousMemory.content}`);
  console.log(`Lifecycle: ${ambiguousMemory.lifecycle}`);
  console.log(`Conflict status: ${ambiguousMemory.conflictStatus}`);
  console.log("");

  // 6. Retrieve current context with ambiguous statement.
  console.log("6. Retrieve current context with ambiguous statement");

  const resultsWithAmbiguous = await retriever.retrieve("Where do I live?");

  for (const result of resultsWithAmbiguous) {
    console.log(
      `- ${result.memory.content} ` +
        `(score=${result.evidence.score}, ` +
        `matched=${result.evidence.matchedTokens.join(", ")})`,
    );
  }

  const ambiguousReturned = resultsWithAmbiguous.some(
    (result) => result.memory.id === ambiguousMemory.id,
  );

  console.log(`Ambiguous Pune memory returned: ${ambiguousReturned}`);
  console.log("");

  // 7. Inspect historical memory.
  console.log("7. Inspect supersession history");

  const historicalMemory = await service.inspectMemory(originalMemory.id);

  console.log(`Content: ${historicalMemory.content}`);
  console.log(`Lifecycle: ${historicalMemory.lifecycle}`);
  console.log(`Source: ${historicalMemory.source.sourceId}`);
  console.log("");

  // 8. Delete the current memory.
  console.log("8. Delete current memory");

  const deletedMemory = await service.deleteMemory(
    correction.replacementMemory.id,
  );

  console.log(`Deleted: ${deletedMemory.content}`);
  console.log(`Lifecycle: ${deletedMemory.lifecycle}`);

  results = await retriever.retrieve("Where do I live?");

  console.log(`Current retrieval results after deletion: ${results.length}`);

  console.log("\n=== Demo complete ===");
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
