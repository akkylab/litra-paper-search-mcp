# litra-paper-search-mcp

[![npm version](https://img.shields.io/npm/v/litra-paper-search-mcp.svg)](https://www.npmjs.com/package/litra-paper-search-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

MCP server for [Litra.ai](https://litra-ai.com) – AI-powered academic paper search with relevance scoring and summarization.

## Features

- **search_papers** – Search academic papers with AI-powered relevance scoring (1-10) and summarization. Supports year filtering.
- **search_author** – Search papers by author name. Returns author profile (affiliation, h-index) and publications.
- **check_credits** – Check your Litra.ai credit balance and subscription plan.

## Prerequisites

- Node.js 18 or higher
- A [Litra.ai](https://litra-ai.com) account with a paid plan (Mini or above)

## Get Your API Key

1. Sign in at [litra-ai.com/account](https://litra-ai.com/account)
2. Navigate to the **API Keys** section
3. Click **Create API Key** and copy the key (it is shown only once)

## Setup

### Claude Code

```bash
claude mcp add litra-paper-search -- npx -y litra-paper-search-mcp
```

Then set the environment variable `LITRA_API_KEY` in your shell or Claude Code config.

### Claude Desktop

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "litra-paper-search": {
      "command": "npx",
      "args": ["-y", "litra-paper-search-mcp"],
      "env": {
        "LITRA_API_KEY": "litra_xxxxxxxxxxxx"
      }
    }
  }
}
```

### Cursor

Add to `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "litra-paper-search": {
      "command": "npx",
      "args": ["-y", "litra-paper-search-mcp"],
      "env": {
        "LITRA_API_KEY": "litra_xxxxxxxxxxxx"
      }
    }
  }
}
```

### Windsurf

Add to `.windsurf/mcp.json`:

```json
{
  "mcpServers": {
    "litra-paper-search": {
      "command": "npx",
      "args": ["-y", "litra-paper-search-mcp"],
      "env": {
        "LITRA_API_KEY": "litra_xxxxxxxxxxxx"
      }
    }
  }
}
```

### Cline

Add to `.cline/mcp_settings.json`:

```json
{
  "mcpServers": {
    "litra-paper-search": {
      "command": "npx",
      "args": ["-y", "litra-paper-search-mcp"],
      "env": {
        "LITRA_API_KEY": "litra_xxxxxxxxxxxx"
      }
    }
  }
}
```

### GitHub Copilot (VS Code)

Add to `.vscode/mcp.json`:

```json
{
  "servers": {
    "litra-paper-search": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "litra-paper-search-mcp"],
      "env": {
        "LITRA_API_KEY": "litra_xxxxxxxxxxxx"
      }
    }
  }
}
```

## Tools

### search_papers

Search academic papers with AI-powered relevance scoring and summarization.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `query` | string | Yes | Natural language search query (1-500 chars) |
| `max_results` | number | No | Maximum number of papers (10-30, default: 30) |
| `year_from` | number | No | Minimum publication year (inclusive) |
| `year_to` | number | No | Maximum publication year (inclusive) |

**Example usage:**

> Search for recent papers on transformer architectures in NLP from 2023 onwards

### search_author

Search academic papers by author name.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `name` | string | Yes | Author name |
| `limit` | number | No | Maximum number of papers (1-50, default: 20) |

**Example usage:**

> Find papers by Yoshua Bengio

### check_credits

Check your Litra.ai credit balance and subscription plan. No parameters required.

## Pricing & Rate Limits

API access requires a paid Litra.ai subscription (Mini or above). Each search consumes credits from your existing subscription pool.

| Plan | Rate Limit |
|------|-----------|
| Mini | 10 requests/min |
| Standard | 30 requests/min |
| Pro | 60 requests/min |
| Max | 120 requests/min |

See [litra-ai.com/pricing](https://litra-ai.com/pricing) for plan details and pricing.

## Response Language

All API responses — including paper titles, summaries, and research overviews — are returned in **English only**.

This is an intentional design choice for the MCP server and public API:

- **LLM accuracy**: Large language models perform reasoning, analysis, and tool use more reliably in English. Returning structured data in English ensures the highest quality when AI agents process search results for downstream tasks (e.g., literature reviews, citation analysis, research synthesis).
- **Token efficiency**: English responses consume fewer tokens than translated equivalents, reducing both latency and cost for LLM-based workflows.
- **No multilingual plans for the API**: This MCP server is designed specifically for AI agent consumption. There are no plans to add other response languages. If you need Japanese or other languages, use the [Litra.ai web interface](https://litra-ai.com) directly, which provides full Japanese support including translated titles and summaries.

If your AI workflow requires output in a specific language, the AI client can translate the English response as a post-processing step — this is more reliable than asking the API to translate, since the LLM can adapt the translation to your specific context.

## Troubleshooting

### "LITRA_API_KEY environment variable is required"

Set the `LITRA_API_KEY` environment variable in your MCP client configuration. See the [Setup](#setup) section for examples.

### "Invalid API key"

Your API key may be incorrect or revoked. Generate a new key at [litra-ai.com/account](https://litra-ai.com/account).

### "Insufficient credits"

Your credit balance is too low. Top up at [litra-ai.com/account](https://litra-ai.com/account).

### "Paid subscription required"

API access requires a paid plan (Mini or above). Subscribe at [litra-ai.com/pricing](https://litra-ai.com/pricing).

### "Rate limit exceeded"

You've exceeded your plan's rate limit. Wait a moment and try again, or upgrade your plan for a higher limit.

## Development

```bash
git clone https://github.com/akkylab/litra-paper-search-mcp.git
cd litra-paper-search-mcp
npm install
npm run build
```

To test locally with Claude Code:

```bash
claude mcp add litra-paper-search -- node /path/to/litra-paper-search-mcp/dist/index.js
```

## License

MIT
