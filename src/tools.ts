/**
 * MCPツール定義
 *
 * 3つのMCPツールの登録と、APIレスポンス → AI最適化テキストへの変換を担当します。
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

import {
  LitraApiClient,
  type SearchResponse,
  type PaperSummary,
  type AuthorSearchResponse,
  type AuthorInfo,
  type AuthorPaper,
  type CreditsResponse,
} from "./api-client.js";

// ---------------------------------------------------------------------------
// フォーマッタ
// ---------------------------------------------------------------------------

function formatNumber(n: number): string {
  return n.toLocaleString("en-US");
}

function formatSearchResult(result: SearchResponse): string {
  const lines: string[] = [];

  lines.push(
    `Found ${result.total_count} papers for: "${result.query}"\n`
  );

  if (result.overview) {
    lines.push("## Research Overview");
    lines.push(result.overview);
    lines.push("");
  }

  lines.push("## Papers (sorted by relevance)\n");

  result.papers.forEach((paper, index) => {
    lines.push(formatPaper(paper, index + 1));
  });

  lines.push("---");
  lines.push(
    `Credits used: ${result.credits_used} | Remaining: ${result.credits_remaining}`
  );

  return lines.join("\n");
}

function formatPaper(paper: PaperSummary, rank: number): string {
  const lines: string[] = [];

  const relevance =
    paper.relevance_score !== null
      ? ` (Relevance: ${paper.relevance_score.toFixed(1)}/10)`
      : "";
  lines.push(`### [${rank}] ${paper.title}${relevance}`);

  lines.push(`- Authors: ${paper.authors}`);
  lines.push(
    `- Year: ${paper.year} | Citations: ${formatNumber(paper.citation_count)} | Source: ${paper.source}`
  );

  const journalParts: string[] = [];
  if (paper.venue) journalParts.push(paper.venue);
  if (paper.venue_sjr !== null)
    journalParts.push(`SJR: ${paper.venue_sjr}`);
  if (paper.venue_if !== null)
    journalParts.push(`IF: ${paper.venue_if}`);
  if (journalParts.length > 0) {
    lines.push(`- Journal: ${journalParts.join(" | ")}`);
  }

  if (paper.work_type) {
    lines.push(`- Type: ${paper.work_type}`);
  }

  lines.push(`- Summary: ${paper.summary}`);

  if (paper.url) {
    lines.push(`- URL: ${paper.url}`);
  }
  if (paper.pdf_url) {
    lines.push(`- PDF: ${paper.pdf_url}`);
  }

  lines.push("");
  return lines.join("\n");
}

function formatAuthorResult(result: AuthorSearchResponse): string {
  const lines: string[] = [];

  if (result.author) {
    lines.push(formatAuthorInfo(result.author));
  }

  lines.push(`## Papers (${result.total_count} results)\n`);

  result.papers.forEach((paper, index) => {
    lines.push(formatAuthorPaper(paper, index + 1));
  });

  return lines.join("\n");
}

function formatAuthorInfo(author: AuthorInfo): string {
  const lines: string[] = [];

  lines.push(`## Author: ${author.name}`);
  if (author.affiliation) {
    lines.push(`- Affiliation: ${author.affiliation}`);
  }
  if (author.h_index !== null) {
    lines.push(`- h-index: ${author.h_index}`);
  }
  lines.push(`- Total works: ${formatNumber(author.works_count)}`);
  lines.push("");

  return lines.join("\n");
}

function formatAuthorPaper(paper: AuthorPaper, rank: number): string {
  const lines: string[] = [];

  lines.push(`### [${rank}] ${paper.title}`);
  lines.push(`- Authors: ${paper.authors}`);
  lines.push(
    `- Year: ${paper.year} | Citations: ${formatNumber(paper.citation_count)} | Source: ${paper.source}`
  );

  if (paper.venue) {
    lines.push(`- Journal: ${paper.venue}`);
  }

  lines.push(`- Abstract: ${paper.abstract}`);
  lines.push(`- URL: ${paper.url}`);
  lines.push("");

  return lines.join("\n");
}

function formatCredits(credits: CreditsResponse): string {
  const lines: string[] = [];

  lines.push("## Litra.ai Account Status");
  lines.push(`- Credits: ${credits.credits}`);
  lines.push(`- Plan: ${credits.current_plan}`);
  if (credits.rate_limit) {
    lines.push(`- Rate limit: ${credits.rate_limit}`);
  }

  return lines.join("\n");
}

// ---------------------------------------------------------------------------
// ツール登録
// ---------------------------------------------------------------------------

export function registerTools(server: McpServer): void {
  // クライアントはツール呼び出し時に遅延初期化する
  let client: LitraApiClient | null = null;

  function getClient(): LitraApiClient {
    if (!client) {
      client = new LitraApiClient();
    }
    return client;
  }

  // ツール1: search_papers
  server.registerTool(
    "search_papers",
    {
      description:
        "Search academic papers with AI-powered relevance scoring and summarization. " +
        "Returns papers ranked by relevance with AI-generated summaries.",
      inputSchema: {
        query: z
          .string()
          .min(1)
          .max(500)
          .describe("Natural language search query"),
        max_results: z
          .number()
          .int()
          .min(10)
          .max(30)
          .default(30)
          .describe("Maximum number of papers (10-30, default: 30)"),
        year_from: z
          .number()
          .int()
          .optional()
          .describe("Minimum publication year (inclusive)"),
        year_to: z
          .number()
          .int()
          .optional()
          .describe("Maximum publication year (inclusive)"),
      },
    },
    async ({ query, max_results, year_from, year_to }) => {
      try {
        const result = await getClient().searchPapers({
          query,
          max_results,
          year_from,
          year_to,
        });
        return {
          content: [{ type: "text" as const, text: formatSearchResult(result) }],
        };
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "An unexpected error occurred";
        return {
          content: [{ type: "text" as const, text: `Error: ${message}` }],
          isError: true,
        };
      }
    }
  );

  // ツール2: search_author
  server.registerTool(
    "search_author",
    {
      description:
        "Search academic papers by author name. Returns author profile and publications.",
      inputSchema: {
        name: z.string().min(1).describe("Author name"),
        limit: z
          .number()
          .int()
          .min(1)
          .max(50)
          .default(20)
          .describe("Maximum number of papers (1-50, default: 20)"),
      },
    },
    async ({ name, limit }) => {
      try {
        const result = await getClient().searchAuthor({ name, limit });
        return {
          content: [
            { type: "text" as const, text: formatAuthorResult(result) },
          ],
        };
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "An unexpected error occurred";
        return {
          content: [{ type: "text" as const, text: `Error: ${message}` }],
          isError: true,
        };
      }
    }
  );

  // ツール3: check_credits
  server.registerTool(
    "check_credits",
    {
      description:
        "Check your Litra.ai credit balance and subscription plan.",
    },
    async () => {
      try {
        const result = await getClient().checkCredits();
        return {
          content: [{ type: "text" as const, text: formatCredits(result) }],
        };
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "An unexpected error occurred";
        return {
          content: [{ type: "text" as const, text: `Error: ${message}` }],
          isError: true,
        };
      }
    }
  );
}
