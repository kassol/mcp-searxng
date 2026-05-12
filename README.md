# SearXNG MCP Server

An [MCP server](https://modelcontextprotocol.io/introduction) that integrates the [SearXNG](https://docs.searxng.org) API, giving AI assistants web search capabilities.

This fork is published as `@kassol/mcp-searxng` and includes support for custom outgoing headers via `SEARXNG_HEADERS`, `URL_READER_HEADERS`, and their base64 variants.

[![npm version](https://img.shields.io/npm/v/%40kassol%2Fmcp-searxng?label=npm)](https://www.npmjs.com/package/@kassol/mcp-searxng)
[![npm downloads](https://img.shields.io/npm/dm/%40kassol%2Fmcp-searxng)](https://www.npmjs.com/package/@kassol/mcp-searxng)
[![license](https://img.shields.io/npm/l/%40kassol%2Fmcp-searxng)](LICENSE)
[![GitHub repo](https://img.shields.io/badge/github-kassol%2Fmcp--searxng-24292f?logo=github)](https://github.com/kassol/mcp-searxng)

## Quick Start

Add to your MCP client configuration (e.g. `claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "searxng": {
      "command": "npx",
      "args": ["-y", "@kassol/mcp-searxng"],
      "env": {
        "SEARXNG_URL": "YOUR_SEARXNG_INSTANCE_URL"
      }
    }
  }
}
```

Replace `YOUR_SEARXNG_INSTANCE_URL` with the URL of your SearXNG instance (e.g. `https://search.example.com`).

## Features

- **Web Search**: General queries, news, articles, with pagination.
- **URL Content Reading**: Advanced content extraction with pagination, section filtering, and heading extraction.
- **Intelligent Caching**: URL content is cached with TTL (Time-To-Live) to improve performance and reduce redundant requests.
- **Pagination**: Control which page of results to retrieve.
- **Time Filtering**: Filter results by time range (day, month, year).
- **Language Selection**: Filter results by preferred language.
- **Safe Search**: Control content filtering level for search results.

## How It Works

`mcp-searxng` is a standalone MCP server — a separate Node.js process that your AI assistant connects to for web search. It queries any SearXNG instance via its HTTP JSON API.

> **Not a SearXNG plugin:** This project cannot be installed as a native SearXNG plugin. Point it at any existing SearXNG instance by setting `SEARXNG_URL`.

```
AI Assistant (e.g. Claude)
        │  MCP protocol
        ▼
  mcp-searxng  (this project — Node.js process)
        │  HTTP JSON API  (SEARXNG_URL)
        ▼
  SearXNG instance
```

## Tools

- **searxng_web_search**
  - Execute web searches with pagination
  - Inputs:
    - `query` (string): The search query. This string is passed to external search services.
    - `pageno` (number, optional): Search page number, starts at 1 (default 1)
    - `time_range` (string, optional): Filter results by time range - one of: "day", "month", "year" (default: none)
    - `language` (string, optional): Language code for results (e.g., "en", "fr", "de") or "all" (default: "all")
    - `safesearch` (number, optional): Safe search filter level (0: None, 1: Moderate, 2: Strict) (default: instance setting)

- **web_url_read**
  - Read and convert the content from a URL to markdown with advanced content extraction options
  - Inputs:
    - `url` (string): The URL to fetch and process
    - `startChar` (number, optional): Starting character position for content extraction (default: 0)
    - `maxLength` (number, optional): Maximum number of characters to return
    - `section` (string, optional): Extract content under a specific heading (searches for heading text)
    - `paragraphRange` (string, optional): Return specific paragraph ranges (e.g., '1-5', '3', '10-')
    - `readHeadings` (boolean, optional): Return only a list of headings instead of full content

## Installation

<details>
<summary>NPM (global install)</summary>

```bash
npm install -g @kassol/mcp-searxng
```

```json
{
  "mcpServers": {
    "searxng": {
      "command": "mcp-searxng",
      "env": {
        "SEARXNG_URL": "YOUR_SEARXNG_INSTANCE_URL"
      }
    }
  }
}
```

</details>

<details>
<summary>Docker (local build)</summary>

```bash
docker build -t mcp-searxng:latest -f Dockerfile .
```

```json
{
  "mcpServers": {
    "searxng": {
      "command": "docker",
      "args": [
        "run", "-i", "--rm",
        "-e", "SEARXNG_URL",
        "mcp-searxng:latest"
      ],
      "env": {
        "SEARXNG_URL": "YOUR_SEARXNG_INSTANCE_URL"
      }
    }
  }
}
```

To pass additional env vars, add `-e VAR_NAME` to `args` and the variable to `env`.

</details>

<details>
<summary>Docker Compose</summary>

`docker-compose.yml`:

```yaml
services:
  mcp-searxng:
    build:
      context: .
      dockerfile: Dockerfile
    image: mcp-searxng:latest
    stdin_open: true
    environment:
      - SEARXNG_URL=YOUR_SEARXNG_INSTANCE_URL
      # Add optional variables as needed — see CONFIGURATION.md
```

MCP client config:

```json
{
  "mcpServers": {
    "searxng": {
      "command": "docker",
      "args": ["compose", "run", "--rm", "mcp-searxng"]
    }
  }
}
```

</details>

<details>
<summary>HTTP Transport</summary>

By default the server uses STDIO. Set `MCP_HTTP_PORT` to enable HTTP mode:

```json
{
  "mcpServers": {
    "searxng-http": {
      "command": "mcp-searxng",
      "env": {
        "SEARXNG_URL": "YOUR_SEARXNG_INSTANCE_URL",
        "MCP_HTTP_PORT": "3000"
      }
    }
  }
}
```

**Endpoints:** `POST/GET/DELETE /mcp` (MCP protocol), `GET /health` (health check)

**Test it:**

```bash
MCP_HTTP_PORT=3000 SEARXNG_URL=http://localhost:8080 mcp-searxng
curl http://localhost:3000/health
```

</details>

## Configuration

Set `SEARXNG_URL` to your SearXNG instance URL. All other variables are optional.

Protected SearXNG instances can receive extra search request headers through `SEARXNG_HEADERS_BASE64`. This is the recommended format for ChatWise and other MCP clients that treat environment variables as plain key-value fields.

Generate the value directly from existing Cloudflare Access environment variables:

```bash
export CF_ACCESS_CLIENT_ID='your-client-id.access'
export CF_ACCESS_CLIENT_SECRET='your-client-secret'

node -e 'console.log(Buffer.from(JSON.stringify({"CF-Access-Client-Id":process.env.CF_ACCESS_CLIENT_ID,"CF-Access-Client-Secret":process.env.CF_ACCESS_CLIENT_SECRET})).toString("base64"))'
```

Verify the generated value:

```bash
export SEARXNG_HEADERS_BASE64='paste-generated-value-here'
node -e 'console.log(Buffer.from(process.env.SEARXNG_HEADERS_BASE64,"base64").toString("utf8"))'
```

MCP client configuration:

```json
{
  "mcpServers": {
    "searxng": {
      "command": "npx",
      "args": ["-y", "@kassol/mcp-searxng"],
      "env": {
        "SEARXNG_URL": "https://search.example.com",
        "SEARXNG_HEADERS_BASE64": "eyJDRi1BY2Nlc3MtQ2xpZW50LUlkIjoieW91ci1jbGllbnQtaWQuYWNjZXNzIiwiQ0YtQWNjZXNzLUNsaWVudC1TZWNyZXQiOiJ5b3VyLWNsaWVudC1zZWNyZXQifQ=="
      }
    }
  }
}
```

ChatWise environment variables:

```text
SEARXNG_URL=https://search.example.com
USER_AGENT=Mozilla/5.0
SEARXNG_HEADERS_BASE64=paste-generated-value-here
```

`SEARXNG_HEADERS_BASE64` applies only to `searxng_web_search` requests. Use `URL_READER_HEADERS_BASE64` for headers that should be sent by `web_url_read`.

Full environment variable reference: [CONFIGURATION.md](CONFIGURATION.md)

## Troubleshooting

### 403 Forbidden from SearXNG

Your SearXNG instance likely has JSON format disabled. Edit `settings.yml` (usually `/etc/searxng/settings.yml`):

```yaml
search:
  formats:
    - html
    - json
```

Restart SearXNG (`docker restart searxng`) then verify:

```bash
curl 'http://localhost:8080/search?q=test&format=json'
```

You should receive a JSON response. If not, confirm the file is correctly mounted and YAML indentation is valid.

See also: [SearXNG settings docs](https://docs.searxng.org/admin/settings/settings.html) · [discussion](https://github.com/searxng/searxng/discussions/1789)

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md)

## License

MIT — see [LICENSE](LICENSE) for details.
