export interface ReplayQuery {
  requestBody: string;
  operationType: string | null;
  operationName: string;
  executionId: string;
  variables: string;
  sourceSystem: string;
  responseLength: number;
  responseHash: string | null;
  errors: string | null;
  timestamp: number;
  metadata: unknown | null;
}

export interface QueryResult {
  query: ReplayQuery;
  localResponse: QueryResponse;
  productionResponse: QueryResponse;
  hasDiff: boolean;
  diff: DiffResult | null;
}

export interface QueryResponse {
  success: boolean;
  data?: unknown;
  error?: string;
  statusCode?: number;
}

export interface DiffResult {
  changes: DiffChange[];
  totalChanges: number;
  truncated: boolean;
}

export interface DiffChange {
  path: string;
  type: 'added' | 'removed' | 'changed';
  localValue?: unknown;
  productionValue?: unknown;
}
