import type { Memory } from "../src/domain/memory";

const memories: Memory[] = [];

function addMemory(
  id: string,
  content: string,
  type: Memory["type"],
  lifecycle: Memory["lifecycle"],
  sourceId: string,
  supersedesMemoryId: string | null = null,
  supersededByMemoryId: string | null = null,
  conflictStatus: Memory["conflictStatus"] = "none",
): void {
  memories.push({
    id,
    content,
    normalizedContent: content
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s]/gu, " ")
      .replace(/\s+/g, " ")
      .trim(),
    type,
    lifecycle,
    source: {
      sourceId,
      sourceType: "fixture",
      excerpt: content,
    },
    createdAt: "2026-09-01T00:00:00.000Z",
    updatedAt: "2026-09-01T00:00:00.000Z",
    supersedesMemoryId,
    supersededByMemoryId,
    conflictStatus,
  });
}

// --- Location correction chains ---

addMemory(
  "memory-location-pune",
  "I live in Pune.",
  "profile",
  "superseded",
  "fixture-location-1",
  null,
  "memory-location-mumbai",
);

addMemory(
  "memory-location-mumbai",
  "I live in Mumbai.",
  "profile",
  "superseded",
  "fixture-location-2",
  "memory-location-pune",
  "memory-location-dhaka",
);

addMemory(
  "memory-location-dhaka",
  "I live in Dhaka.",
  "profile",
  "active",
  "fixture-location-4",
  "memory-location-mumbai",
);

// --- Work correction chain ---

addMemory(
  "memory-job-startup",
  "I work at a startup.",
  "profile",
  "superseded",
  "fixture-work-1",
  null,
  "memory-job-software",
);

addMemory(
  "memory-job-software",
  "I work as a software engineer.",
  "profile",
  "active",
  "fixture-work-2",
  "memory-job-startup",
);

// --- Theme correction chain ---

addMemory(
  "memory-theme-light",
  "I prefer light mode.",
  "preference",
  "superseded",
  "fixture-theme-1",
  null,
  "memory-theme-dark",
);

addMemory(
  "memory-theme-dark",
  "I prefer dark mode.",
  "preference",
  "active",
  "fixture-theme-2",
  "memory-theme-light",
);

// --- Communication correction chain ---

addMemory(
  "memory-language-english",
  "I prefer English for work communication.",
  "preference",
  "superseded",
  "fixture-language-1",
  null,
  "memory-language-bengali",
);

addMemory(
  "memory-language-bengali",
  "I prefer Bengali for explanations.",
  "preference",
  "active",
  "fixture-language-2",
  "memory-language-english",
);

// --- Food correction chain ---

addMemory(
  "memory-food-vegetarian",
  "I usually eat vegetarian food.",
  "preference",
  "superseded",
  "fixture-food-1",
  null,
  "memory-food-bangla",
);

addMemory(
  "memory-food-bangla",
  "I enjoy Bengali food.",
  "preference",
  "active",
  "fixture-food-2",
  "memory-food-vegetarian",
);

// --- Additional active memories ---

addMemory(
  "memory-hobby-hiking",
  "I enjoy hiking on weekends.",
  "preference",
  "active",
  "fixture-hobby-1",
);

addMemory(
  "memory-hobby-cooking",
  "I enjoy cooking at home.",
  "preference",
  "active",
  "fixture-hobby-2",
);

addMemory(
  "memory-hobby-reading",
  "I enjoy reading technical books.",
  "preference",
  "active",
  "fixture-hobby-3",
);

addMemory(
  "memory-tech-typescript",
  "I use TypeScript for application development.",
  "preference",
  "active",
  "fixture-tech-1",
);

addMemory(
  "memory-tech-react",
  "I build interfaces with React.",
  "preference",
  "active",
  "fixture-tech-2",
);

addMemory(
  "memory-tech-node",
  "I use Node.js for backend services.",
  "preference",
  "active",
  "fixture-tech-3",
);

addMemory(
  "memory-database-mongo",
  "I use MongoDB for some applications.",
  "preference",
  "active",
  "fixture-db-1",
);

addMemory(
  "memory-database-postgres",
  "I use PostgreSQL for relational data.",
  "preference",
  "active",
  "fixture-db-2",
);

addMemory(
  "memory-cloud-gcp",
  "I deploy applications on Google Cloud.",
  "preference",
  "active",
  "fixture-cloud-1",
);

addMemory(
  "memory-cloud-docker",
  "I use Docker for development.",
  "preference",
  "active",
  "fixture-cloud-2",
);

addMemory(
  "memory-career-fullstack",
  "I am interested in full stack engineering.",
  "profile",
  "active",
  "fixture-career-1",
);

addMemory(
  "memory-career-ai",
  "I am learning AI application engineering.",
  "profile",
  "active",
  "fixture-career-2",
);

addMemory(
  "memory-system-design",
  "I am studying distributed systems and system design.",
  "profile",
  "active",
  "fixture-learning-1",
);

addMemory(
  "memory-security",
  "I care about application security.",
  "preference",
  "active",
  "fixture-security-1",
);

addMemory(
  "memory-testing",
  "I write automated tests for production code.",
  "preference",
  "active",
  "fixture-testing-1",
);

addMemory(
  "memory-api",
  "I build REST APIs with Node.js and Express.",
  "preference",
  "active",
  "fixture-api-1",
);

addMemory(
  "memory-mobile",
  "I am learning React Native development.",
  "profile",
  "active",
  "fixture-mobile-1",
);

addMemory(
  "memory-remote",
  "I prefer remote software engineering roles.",
  "preference",
  "active",
  "fixture-remote-1",
);

addMemory(
  "memory-product",
  "I enjoy building product-focused software.",
  "preference",
  "active",
  "fixture-product-1",
);

// --- Ambiguous potential conflicts ---
// These are preserved, but not treated as current truth.

addMemory(
  "memory-ambiguous-city",
  "I may move to Pune next year.",
  "profile",
  "active",
  "fixture-ambiguous-city",
  null,
  null,
  "ambiguous",
);

addMemory(
  "memory-ambiguous-job",
  "I might move into product management someday.",
  "profile",
  "active",
  "fixture-ambiguous-job",
  null,
  null,
  "ambiguous",
);

export const benchmarkMemories = memories;

if (benchmarkMemories.length < 30) {
  throw new Error(
    `Benchmark requires at least 30 memories, found ${benchmarkMemories.length}`,
  );
}
