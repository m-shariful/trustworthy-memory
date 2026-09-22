import { InMemoryMemoryRepository } from "../src/repositories/memory-repository";
import { MemoryRetriever } from "../src/retrieval/memory-retriever";
import { benchmarkCases } from "./expected-results";
import { benchmarkMemories } from "./fixtures";

async function main(): Promise<void> {
  const repository = new InMemoryMemoryRepository(benchmarkMemories);

  const retriever = new MemoryRetriever(repository);

  let passed = 0;
  let failed = 0;

  for (const testCase of benchmarkCases) {
    const results = await retriever.retrieve(testCase.query, {
      limit: 10,
    });

    const resultIds = new Set(results.map((result) => result.memory.id));

    const missing = testCase.include.filter((id) => !resultIds.has(id));

    const unexpected = testCase.exclude.filter((id) => resultIds.has(id));

    const success = missing.length === 0 && unexpected.length === 0;

    if (success) {
      passed += 1;
      console.log(`PASS ${testCase.id}: ${testCase.query}`);
    } else {
      failed += 1;

      console.log(`FAIL ${testCase.id}: ${testCase.query}`);

      if (missing.length > 0) {
        console.log(`  Missing expected: ${missing.join(", ")}`);
      }

      if (unexpected.length > 0) {
        console.log(`  Unexpected results: ${unexpected.join(", ")}`);
      }
    }
  }

  console.log("");
  console.log(`Benchmark: ${passed}/${benchmarkCases.length} passed`);

  if (failed > 0) {
    process.exitCode = 1;
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
