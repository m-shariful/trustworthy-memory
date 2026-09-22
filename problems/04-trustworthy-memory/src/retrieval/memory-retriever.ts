import type { Memory } from "../domain/memory";
import type { MemoryRepository } from "../repositories/memory-repository";

export interface RetrievalEvidence {
  matchedTokens: string[];
  score: number;
}

export interface MemoryRetrievalResult {
  memory: Memory;
  evidence: RetrievalEvidence;
}

export interface RetrievalOptions {
  limit?: number;
}

export class MemoryRetriever {
  constructor(private readonly repository: MemoryRepository) {}

  async retrieve(
    query: string,
    options: RetrievalOptions = {},
  ): Promise<MemoryRetrievalResult[]> {
    const limit = options.limit ?? 5;

    if (limit <= 0) {
      return [];
    }

    const queryTokens = this.tokenize(query);

    if (queryTokens.length === 0) {
      return [];
    }

    const memories = await this.repository.list();

    const candidates = memories
      .filter((memory) => memory.lifecycle === "active")
      .filter((memory) => memory.conflictStatus === "none")
      .map((memory) => {
        const memoryTokens = new Set(this.tokenize(memory.normalizedContent));

        const matchedTokens = queryTokens.filter((token) =>
          memoryTokens.has(token),
        );

        const uniqueMatchedTokens = [...new Set(matchedTokens)];

        return {
          memory,
          evidence: {
            matchedTokens: uniqueMatchedTokens,
            score: uniqueMatchedTokens.length,
          },
        };
      })
      .filter((result) => result.evidence.score > 0)
      .sort((a, b) => {
        if (b.evidence.score !== a.evidence.score) {
          return b.evidence.score - a.evidence.score;
        }

        return a.memory.id.localeCompare(b.memory.id);
      });

    return candidates.slice(0, limit);
  }

  //   private tokenize(text: string): string[] {
  //     return text
  //       .toLowerCase()
  //       .replace(/[^\p{L}\p{N}\s]/gu, " ")
  //       .split(/\s+/)
  //       .filter((token): token is string => token.length > 0);
  //   }

  private tokenize(text: string): string[] {
    const stopwords = new Set([
      "a",
      "an",
      "and",
      "are",
      "do",
      "for",
      "how",
      "i",
      "in",
      "is",
      "me",
      "my",
      "of",
      "on",
      "the",
      "to",
      "what",
      "where",
      "who",
      "with",
    ]);

    return text
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s]/gu, " ")
      .split(/\s+/)
      .filter((token): token is string => {
        return token.length > 0 && !stopwords.has(token);
      });
  }
}
