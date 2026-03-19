/**
 * Litra.ai 公開REST APIクライアント
 *
 * 公開APIへのHTTP通信とエラーハンドリングを担当します。
 */

// ---------------------------------------------------------------------------
// 型定義（バックエンド schemas.py から転写）
// ---------------------------------------------------------------------------

// --- 論文検索 ---

export interface SearchPapersParams {
  query: string;
  max_results?: number;
  year_from?: number;
  year_to?: number;
}

export interface PaperSummary {
  id: string;
  title: string;
  title_original: string;
  title_japanese: string | null;
  language: string;
  authors: string;
  year: number;
  citation_count: number;
  summary: string;
  source: string;
  url: string | null;
  pdf_url: string | null;
  venue: string | null;
  venue_sjr: number | null;
  venue_if: number | null;
  venue_rating: number | null;
  work_type: string | null;
  relevance_score: number | null;
  search_source: string | null;
}

export interface SearchResponse {
  query: string;
  total_count: number;
  overview: string | null;
  papers: PaperSummary[];
  credits_used: number;
  credits_remaining: number;
}

// --- 著者検索 ---

export interface SearchAuthorParams {
  name: string;
  limit?: number;
}

export interface AuthorInfo {
  id: string;
  name: string;
  affiliation: string | null;
  h_index: number | null;
  works_count: number;
}

export interface AuthorPaper {
  id: string;
  title: string;
  title_original: string;
  title_japanese: string | null;
  authors: string;
  year: number;
  citation_count: number;
  abstract: string;
  url: string;
  source: string;
  venue: string | null;
}

export interface AuthorSearchResponse {
  author: AuthorInfo | null;
  papers: AuthorPaper[];
  total_count: number;
  message: string;
}

// --- クレジット ---

export interface CreditsResponse {
  credits: number;
  current_plan: string;
  rate_limit: string | null;
}

// --- エラー ---

interface ApiErrorDetail {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

interface ApiErrorResponse {
  error: ApiErrorDetail;
}

// ---------------------------------------------------------------------------
// エラーメッセージマッピング
// ---------------------------------------------------------------------------

const ERROR_MESSAGES: Record<string, string> = {
  invalid_api_key:
    "Invalid API key. Check your LITRA_API_KEY. Get a new key at https://litra-ai.com/account",
  insufficient_credits:
    "Insufficient credits. Top up at https://litra-ai.com/account",
  subscription_required:
    "Paid subscription required. Subscribe at https://litra-ai.com/pricing",
  rate_limit_exceeded: "Rate limit exceeded. Please wait and try again.",
  internal_error: "Litra.ai server error. Please try again later.",
};

const STATUS_FALLBACK_MESSAGES: Record<number, string> = {
  401: "Authentication failed. Check your LITRA_API_KEY.",
  402: "Payment required. Check your credits at https://litra-ai.com/account",
  403: "Access denied. Check your subscription at https://litra-ai.com/pricing",
  429: "Rate limit exceeded. Please wait and try again.",
  500: "Litra.ai server error. Please try again later.",
};

// ---------------------------------------------------------------------------
// APIクライアント
// ---------------------------------------------------------------------------

const PACKAGE_VERSION = "1.0.0";

export class LitraApiClient {
  private readonly baseUrl: string;
  private readonly apiKey: string;

  constructor() {
    const apiKey = process.env.LITRA_API_KEY;
    if (!apiKey) {
      throw new Error(
        "LITRA_API_KEY environment variable is required. " +
          "Get your API key at https://litra-ai.com/account"
      );
    }
    this.apiKey = apiKey;
    this.baseUrl =
      process.env.LITRA_API_BASE_URL ?? "https://litra-ai.com";
  }

  /**
   * 論文検索
   */
  async searchPapers(params: SearchPapersParams): Promise<SearchResponse> {
    return this.request<SearchResponse>("/api/v1/search", {
      method: "POST",
      body: JSON.stringify(params),
    });
  }

  /**
   * 著者検索
   */
  async searchAuthor(
    params: SearchAuthorParams
  ): Promise<AuthorSearchResponse> {
    const searchParams = new URLSearchParams({ name: params.name });
    if (params.limit !== undefined) {
      searchParams.set("limit", String(params.limit));
    }
    return this.request<AuthorSearchResponse>(
      `/api/v1/author/search?${searchParams.toString()}`
    );
  }

  /**
   * クレジット残高確認
   */
  async checkCredits(): Promise<CreditsResponse> {
    return this.request<CreditsResponse>("/api/v1/credits");
  }

  // ---------------------------------------------------------------------------
  // プライベートメソッド
  // ---------------------------------------------------------------------------

  private async request<T>(
    path: string,
    init?: RequestInit
  ): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.apiKey}`,
      "Content-Type": "application/json",
      "User-Agent": `litra-paper-search-mcp/${PACKAGE_VERSION}`,
    };

    const response = await fetch(url, {
      ...init,
      headers: {
        ...headers,
        ...(init?.headers as Record<string, string> | undefined),
      },
    });

    if (!response.ok) {
      await this.handleErrorResponse(response);
    }

    return (await response.json()) as T;
  }

  private async handleErrorResponse(response: Response): Promise<never> {
    let errorMessage: string;

    try {
      const body = (await response.json()) as ApiErrorResponse;
      const code = body.error?.code;
      if (code && ERROR_MESSAGES[code]) {
        errorMessage = ERROR_MESSAGES[code];
      } else if (body.error?.message) {
        errorMessage = body.error.message;
      } else {
        errorMessage =
          STATUS_FALLBACK_MESSAGES[response.status] ??
          `Request failed with status ${response.status}`;
      }
    } catch {
      errorMessage =
        STATUS_FALLBACK_MESSAGES[response.status] ??
        `Request failed with status ${response.status}`;
    }

    throw new Error(errorMessage);
  }
}
