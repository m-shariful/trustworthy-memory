# Trustworthy Long-Term Memory — Design

## Overview

This implementation is a small deterministic memory engine focused on trustworthy memory lifecycle management.

The design separates:

1. Memory domain rules
2. Persistence
3. Memory lifecycle operations
4. Retrieval and relevance

The implementation intentionally avoids live LLM dependencies, embeddings, and vector databases. This keeps the behavior deterministic, explainable, and easy to verify within the scope of the challenge.

## Architecture

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
                  +----------+----------+
                  |                     |
                  v                     v
          InMemoryRepository      JSON File Store


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

## Memory model

Each memory contains:

- stable identifier
- normalized content
- memory type
- lifecycle
- source provenance
- creation timestamp
- update timestamp
- supersession relationships
- conflict status

Supported memory types are:

- `fact`
- `preference`
- `profile`
- `constraint`

## What qualifies as a memory?

A memory represents an explicitly represented user-specific fact, preference, profile detail, or constraint.

Examples:

```text
"I live in Mumbai."
"I prefer dark mode."
"I prefer Bengali for explanations."
"I use TypeScript."
```

The system does not attempt to automatically extract every possible fact from a conversation.

## Identity and provenance

Every memory has a stable unique ID.

A correction creates a new memory with a new ID. The original memory keeps its identity and historical record.

Each memory also stores:

```text
sourceId
sourceType
excerpt
```

This makes the originating message or fixture inspectable.

The memory therefore remains traceable to the source that produced it.

## Lifecycle model

The lifecycle has three states:

```text
active
superseded
deleted
```

### Active

Eligible for current retrieval.

### Superseded

The memory is retained for historical inspection but is not returned as current context.

A superseded memory points to its replacement using:

```text
supersededByMemoryId
`
```
