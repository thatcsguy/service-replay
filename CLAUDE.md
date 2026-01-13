# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Rama Replay is a CLI tool that replays GraphQL queries against local and production endpoints, then compares responses to detect differences. It generates an interactive HTML report highlighting any discrepancies.

## Commands

```bash
# Build TypeScript to dist/
npm run build

# Run compiled CLI
npm start

# Development (run directly with ts-node)
npm run dev

# CLI usage with options
rama-replay --initial-date 2024-01-01 --final-date 2024-01-15 --limit 50 --output ./report.html --concurrency 10
```

## Required Environment Variables

Copy `.env.example` to `.env` and configure:
- `REPLAY_API_URL` - Endpoint that returns historical GraphQL queries
- `LOCAL_GRAPHQL_URL` - Local GraphQL server to test
- `PRODUCTION_GRAPHQL_URL` - Production GraphQL server for comparison
- `LOCAL_AUTH` / `PRODUCTION_AUTH` - Authorization headers (e.g., "Basic token" or "Bearer token")

## Architecture

The tool follows a pipeline architecture:

1. **fetcher.ts** - Fetches historical queries from the replay API with date range and limit filters
2. **executor.ts** - Executes each query against both local and production endpoints in parallel batches (controlled by concurrency setting)
3. **differ.ts** - Compares JSON responses using LCS-based diff algorithm, producing unified diff hunks
4. **reporter.ts** - Injects comparison data into the HTML template and writes the report file

Key types in `types.ts`:
- `ReplayQuery` - Query metadata from the replay API (requestBody, variables, operationName, executionId)
- `QueryResult` - Combined result with local/production responses and diff
- `DiffResult` / `DiffHunk` / `DiffLine` - Structured diff output

The CLI (`index.ts`) orchestrates the pipeline using Commander for argument parsing.

## Output

The tool generates a standalone HTML report (`templates/template.html`) with:
- Side-by-side diff viewer with JSON syntax highlighting
- Filter by queries with/without differences
- Search by operation name
- Expandable variables section per query
