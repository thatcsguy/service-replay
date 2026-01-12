# Rama Replay

CLI tool to replay GraphQL queries against local and production endpoints and compare the responses.

## Installation

```bash
npm install
npm run build
```

## Configuration

Copy `.env.example` to `.env` and set the following variables:

```bash
REPLAY_API_URL=http://localhost:7301/replay/queries   # API that returns historical queries
LOCAL_GRAPHQL_URL=http://localhost:7301/graphql       # Local GraphQL endpoint
PRODUCTION_GRAPHQL_URL=https://prod.example.com/graphql
LOCAL_AUTH=Basic your-local-token                     # Authorization header value
PRODUCTION_AUTH=Basic your-production-token
```

## Usage

```bash
# Run with defaults (today's queries, limit 100)
npm start

# Or run directly
node dist/index.js [options]
```

## Command Line Options

| Option | Alias | Description | Default |
|--------|-------|-------------|---------|
| `--initial-date <date>` | `-i` | Start date for query range (YYYY-MM-DD) | Today |
| `--final-date <date>` | `-f` | End date for query range (YYYY-MM-DD) | Today |
| `--limit <number>` | `-l` | Maximum number of queries to fetch | 100 |
| `--output <path>` | `-o` | Output path for HTML report | ./report.html |
| `--concurrency <number>` | `-c` | Number of parallel requests | 5 |

## Examples

```bash
# Replay last week's queries
npm start -- -i 2024-01-01 -f 2024-01-07

# Fetch up to 500 queries with higher concurrency
npm start -- -l 500 -c 10

# Custom output file
npm start -- -o ./reports/comparison.html
```

## Output

Generates an interactive HTML report with:
- Side-by-side diff view of local vs production responses
- Filter queries by diff status
- Search by operation name
- JSON syntax highlighting
