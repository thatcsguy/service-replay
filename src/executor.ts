import type { ReplayQuery, QueryResponse } from './types.js';

export interface ExecuteQueryOptions {
  query: ReplayQuery;
  endpoint: string;
  authorization: string;
}

export async function executeQuery(options: ExecuteQueryOptions): Promise<QueryResponse> {
  const { query, endpoint, authorization } = options;

  try {
    let variables: Record<string, unknown> = {};
    try {
      variables = JSON.parse(query.variables);
    } catch {
      // If variables parsing fails, use empty object
    }

    const body = JSON.stringify({
      query: query.requestBody,
      variables,
      operationName: query.operationName.replace('REPLAY-', ''),
    });

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authorization,
      },
      body,
    });

    const data = await response.json();

    return {
      success: response.ok,
      data,
      statusCode: response.status,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export interface ExecuteAllQueriesOptions {
  queries: ReplayQuery[];
  localEndpoint: string;
  localAuth: string;
  productionEndpoint: string;
  productionAuth: string;
  concurrency?: number;
  onProgress?: (completed: number, total: number) => void;
}

export interface ExecutedQueryPair {
  query: ReplayQuery;
  localResponse: QueryResponse;
  productionResponse: QueryResponse;
}

export async function executeAllQueries(options: ExecuteAllQueriesOptions): Promise<ExecutedQueryPair[]> {
  const {
    queries,
    localEndpoint,
    localAuth,
    productionEndpoint,
    productionAuth,
    concurrency = 5,
    onProgress,
  } = options;

  const results: ExecutedQueryPair[] = [];
  let completed = 0;

  // Process queries in batches for rate limiting
  for (let i = 0; i < queries.length; i += concurrency) {
    const batch = queries.slice(i, i + concurrency);

    const batchResults = await Promise.all(
      batch.map(async (query) => {
        const [localResponse, productionResponse] = await Promise.all([
          executeQuery({ query, endpoint: localEndpoint, authorization: localAuth }),
          executeQuery({ query, endpoint: productionEndpoint, authorization: productionAuth }),
        ]);

        return { query, localResponse, productionResponse };
      })
    );

    results.push(...batchResults);
    completed += batch.length;
    onProgress?.(completed, queries.length);
  }

  return results;
}
