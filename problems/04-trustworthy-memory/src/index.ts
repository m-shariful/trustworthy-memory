import { MemoryRetriever } from "./retrieval/memory-retriever";
import { MemoryService } from "./services/memory-service";
import { SqliteMemoryRepository } from "./repositories/sqlite-memory-repository";
import { SqliteStore } from "./db/sqlite-store";
import path from "node:path";

const databasePath = path.join(process.cwd(), "data", "memories.sqlite");

const sqliteStore = new SqliteStore(databasePath);
const repository = new SqliteMemoryRepository(sqliteStore.database);
const retriever = new MemoryRetriever(repository);

let demoCounter = 0;

const now = () => "2026-09-20T10:00:00.000Z";

const createId = () => {
  demoCounter += 1;
  return `demo-memory-${demoCounter}`;
};

const service = new MemoryService(repository, {
  now,
  createId,
});

async function main(): Promise<void> {
  console.log("=== Trustworthy Long-Term Memory Demo ===");

  try {
    console.log("\n1. Store a memory");

    const puneMemory = await service.createMemory({
      content: "I live in Pune.",
      type: "profile",
      source: {
        sourceId: "message-1",
        sourceType: "message",
        excerpt: "I live in Pune.",
      },
    });

    console.log("Stored:", puneMemory.content);
    console.log("Memory ID:", puneMemory.id);

    console.log("\n2. Retrieve the memory");

    const firstResults = await retriever.retrieve("Where do I live?");

    console.log(
      firstResults.map((result) => ({
        content: result.memory.content,
        evidence: result.evidence,
      })),
    );

    console.log("\n3. Correct the memory");

    const correction = await service.correctMemory(puneMemory.id, {
      replacementContent: "I live in Mumbai.",
      replacementType: "profile",
      replacementSource: {
        sourceId: "message-2",
        sourceType: "message",
        excerpt: "I actually live in Mumbai now.",
      },
    });

    console.log("Previous memory:", correction.previousMemory.content);

    console.log("Previous lifecycle:", correction.previousMemory.lifecycle);

    console.log("Replacement memory:", correction.replacementMemory.content);

    console.log("Replacement ID:", correction.replacementMemory.id);

    console.log("Supersedes:", correction.replacementMemory.supersedesMemoryId);

    console.log("\n4. Retrieve after correction");

    const correctedResults = await retriever.retrieve("Where do I live?");

    console.log(
      correctedResults.map((result) => ({
        content: result.memory.content,
        evidence: result.evidence,
      })),
    );

    const oldMemoryStillReturned = correctedResults.some(
      (result) => result.memory.id === puneMemory.id,
    );

    console.log("Old Pune memory returned:", oldMemoryStillReturned);

    console.log("\n5. Store an ambiguous memory");

    const ambiguousMemory = await service.createMemory({
      content: "I may move to Pune next year.",
      type: "profile",
      conflictStatus: "ambiguous",
      source: {
        sourceId: "message-3",
        sourceType: "message",
        excerpt: "I may move to Pune next year.",
      },
    });

    console.log("Stored:", ambiguousMemory.content);
    console.log("Conflict status:", ambiguousMemory.conflictStatus);

    console.log("\n6. Retrieve with ambiguous information");

    const ambiguousResults = await retriever.retrieve(
      "Am I definitely moving to Pune?",
    );

    console.log(
      ambiguousResults.map((result) => ({
        content: result.memory.content,
        evidence: result.evidence,
      })),
    );

    const ambiguousReturned = ambiguousResults.some(
      (result) => result.memory.id === ambiguousMemory.id,
    );

    console.log("Ambiguous memory returned:", ambiguousReturned);

    console.log("\n7. Inspect historical memory");

    const inspectedPuneMemory = await service.inspectMemory(puneMemory.id);

    console.log({
      id: inspectedPuneMemory.id,
      content: inspectedPuneMemory.content,
      lifecycle: inspectedPuneMemory.lifecycle,
      source: inspectedPuneMemory.source,
      supersededByMemoryId: inspectedPuneMemory.supersededByMemoryId,
    });

    console.log("\n8. Delete the current memory");

    const deletedMemory = await service.deleteMemory(
      correction.replacementMemory.id,
    );

    console.log("Deleted:", deletedMemory.content);
    console.log("Lifecycle:", deletedMemory.lifecycle);

    const afterDeleteResults = await retriever.retrieve("Where do I live?");

    console.log("Results after deletion:", afterDeleteResults.length);

    console.log("\n=== Demo complete ===");
  } finally {
    sqliteStore.close();
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
