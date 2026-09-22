# Product Engineering Challenge Submission

## Candidate

- **Name:** Shariful Alam
- **Email:** `info.sharifulalam@gmail.com`
- **GitHub:** `m-shariful/trustworthy-memory`
- **Selected problem:** Problem 4 — Trustworthy Long-Term Memory
- **Demo video:** `https://cap.so/s/cfh4jk2myttwqtq`

## Run the project

### Prerequisites

- Node.js 20+ recommended
- npm

No environment variables or external services are required.

From the Problem 4 directory:

```text
cd problems/04-trustworthy-memory
npm install
```

Run the interactive demonstration:

```text
npm run dev
```

The demo covers:

1. Store a memory with source provenance.
2. Inspect the stored memory and originating source.
3. Retrieve relevant context.
4. Explicitly correct `Pune -> Mumbai`.
5. Inspect the supersession relationship.
6. Verify the old Pune memory is excluded from current retrieval.
7. Delete the current Mumbai memory.
8. Verify the deleted memory is excluded from retrieval.

The demonstration is deterministic and does not require an LLM or external API.

## Run the tests

```text
npm test
```

Additional verification:

```text
npm run typecheck
npm run build
npm run benchmark
```

Observed verification:

```text
Tests: 11 passed
Typecheck: passed
Build: passed
Benchmark: 22/22 passed
```

## Acceptance scenarios and verification

### AC1 — Store with provenance

Implemented.

Every memory contains:

- stable ID
- normalized content
- memory type
- lifecycle
- source ID
- source type
- source excerpt
- creation/update timestamps

The source can be inspected after storage.

### AC2 — Bounded relevant retrieval

Implemented.

The retriever:

- considers only active memories
- excludes ambiguous memories from current context
- tokenizes the query and memory
- calculates deterministic lexical overlap
- returns selection evidence
- applies a configurable result limit
- uses stable ID ordering as the tie-breaker

Each result exposes its matched tokens and score.

### AC3 — Explicit correction and supersession

Implemented.

An explicit correction does not mutate history destructively.

For example:

```text
Pune
  |
  | explicit correction
  v
Mumbai
```

The original memory becomes `superseded` and points to the replacement.

The replacement points back to the memory it supersedes.

Normal retrieval excludes the superseded memory.

### AC4 — Ambiguous contradiction

Implemented conservatively.

An uncertain candidate is stored with:

```text
conflictStatus: "ambiguous"
```

It remains preserved and active for historical inspection, but is excluded from normal current retrieval.

The system therefore does not silently replace an established memory based only on uncertain information.

### AC5 — Deletion

Implemented as a soft delete.

A deleted memory receives:

```text
lifecycle: "deleted"
```

Its provenance and historical record remain inspectable, but normal retrieval excludes it.

### AC6 — Deterministic fixture

Implemented.

The benchmark uses a version-controlled fixture with more than 30 memories, multiple supersession relationships, ambiguous conflicts, and 22 fixed retrieval queries.

### Problem-specific benchmark

Run:

```text
npm run benchmark
```

Observed result:

```text
Benchmark: 22/22 passed
```

The benchmark checks expected inclusions and exclusions for each fixed query and exits with a failure status if any case does not match.

## Architecture and data flow

The implementation is intentionally split into domain, service, persistence, and retrieval responsibilities.

```text
                    +------------------+
                    |   MemoryService  |
                    +--------+---------+
                             |
                             v
                    +------------------+
                    | MemoryRepository |
                    +--------+---------+
                             |
                 +-----------+-----------+
                 |                       |
                 v                       v
        InMemory Repository       JSON File Repository
                 |
                 v
          Memory Domain Model


New User Query
      |
      v
+------------------+
| MemoryRetriever  |
+--------+---------+
         |
         v
 Active + non-ambiguous
 memories
         |
         v
 Lexical token matching
         |
         v
 Score + matched tokens
         |
         v
 Bounded current context
```

### Main components

**Domain model**

Defines memory identity, type, provenance, lifecycle, timestamps, supersession relationships, and conflict status.

**MemoryService**

Owns business operations:

- create
- inspect
- correct
- supersede
- delete

**MemoryRepository**

Provides the persistence boundary. The application does not depend directly on a particular storage implementation.

**InMemoryMemoryRepository**

Used by deterministic tests and benchmark execution.

**FileMemoryRepository**

Provides lightweight JSON persistence for the prototype.

**MemoryRetriever**

Performs deterministic relevance matching and applies lifecycle/conflict filtering before returning bounded results with evidence.

## Technology choices

### TypeScript

Chosen for strong typing and consistency with modern backend development.

### Node.js

Provides a small runtime with minimal setup for this focused exercise.

### Vitest

Used for focused unit tests with deterministic fixtures.

### Zod

Used to define and validate the memory domain shape.

### JSON persistence

I chose a lightweight JSON file repository instead of introducing a database because the challenge is primarily evaluating memory semantics, provenance, lifecycle handling, retrieval, and explainability.

The repository interface keeps the storage implementation replaceable.

### Lexical retrieval

I deliberately chose deterministic token-overlap retrieval instead of embeddings.

This provides:

- reproducible benchmark results
- observable selection evidence
- no external model dependency
- simple failure analysis
- low implementation complexity appropriate for the exercise

The trade-off is that lexical retrieval does not understand semantic similarity or synonyms.

## Important decisions

### 1. Preserve history during correction

A correction creates a new memory instead of overwriting the original.

This preserves provenance and makes the lifecycle understandable:

```text
old memory
  -> superseded
  -> supersededByMemoryId = new memory

new memory
  -> active
  -> supersedesMemoryId = old memory
```

### 2. Treat ambiguity conservatively

The system does not assume that every contradictory statement is a correction.

An uncertain contradiction is retained as `ambiguous` and excluded from current context rather than silently replacing the existing memory.

This separates explicit user correction from uncertain information.

### 3. Keep retrieval explainable

Each retrieval result includes:

- relevance score
- matched tokens

This makes it possible to understand why a memory was selected and keeps the deterministic benchmark straightforward.

## Assumptions and limitations

- A memory represents an explicitly represented user-specific fact, preference, profile detail, or constraint.
- Automatic extraction of every conversational fact is intentionally out of scope.
- Lexical retrieval does not understand synonyms or semantic similarity.
- `live` and `living`, for example, are different lexical tokens.
- JSON persistence is not designed for high-concurrency or multi-process production workloads.
- There is no authentication or multi-user sharing.
- There is no polished memory UI.
- There is no live LLM dependency.
- Image, audio, and document memories are out of scope.
- Sensitive/high-impact memory policies are documented but not fully implemented in this prototype.

## Production and scale

The submitted implementation is intentionally small and deterministic.

For production, I would first replace the JSON persistence layer with a transactional database while preserving the repository/domain boundaries.

I would then add:

- indexes for lifecycle, user/tenant, timestamps, and source
- transactional or optimistic-concurrency handling for corrections
- full-text search for lexical candidate retrieval
- embeddings as an additional semantic retrieval mechanism where useful
- bounded candidate generation and pagination
- retention and archival policies
- stronger audit logging
- encryption and access controls
- user-facing inspection and deletion controls

The key design invariant would remain unchanged: retrieval technology should not bypass provenance, lifecycle, conflict, deletion, and user-control rules.

## AI usage

AI tools were used during development, primarily ChatGPT.

AI assistance contributed to:

- discussing the architecture and separation of concerns
- reasoning about memory lifecycle and supersession
- identifying edge cases
- drafting and reviewing implementation ideas
- helping structure tests and the deterministic benchmark
- reviewing documentation and submission material

I reviewed the generated suggestions and implemented/tested the resulting code locally.

The final implementation was verified through:

```text
npm test
npm run typecheck
npm run build
npm run benchmark
```

with the observed results:

```text
11 tests passed
Typecheck passed
Build passed
22/22 benchmark cases passed
```

The benchmark and tests are deterministic and do not rely on a live model.

## Credibility note

### Previously shipped product

**Problem solved**

At Wellnite, I worked on a production healthcare/business platform supporting user registration, appointment scheduling, payments, communications, and operational workflows.

**Personal contribution**

I worked as a Software Engineer across the React/Next.js frontend and Node.js/Express backend, including API and database work, third-party integrations, background jobs, performance improvements, production support, and CI/CD.

I also worked on appointment and registration synchronization, booking/cancellation flows, notifications, exports, communication integrations, and production reliability.

**Scale / operational complexity**

The platform supported tens of thousands of users and more than 25,000 appointments per month, with integrations across scheduling, communication, payments, and operational systems.

**Difficult engineering decision**

One recurring engineering challenge was keeping data and asynchronous workflows consistent across multiple systems. I worked on synchronization and background-job flows where failures, retries, and mismatched state needed to be handled without blocking the main user workflow.

Public repository evidence for the production system is not available because the work was performed on a private product codebase.
