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
    hunks: DiffHunk[];
    localJson: string;
    productionJson: string;
}
export interface DiffHunk {
    oldStart: number;
    oldLines: number;
    newStart: number;
    newLines: number;
    lines: DiffLine[];
}
export interface DiffLine {
    type: 'add' | 'remove' | 'context';
    content: string;
    oldLineNumber?: number;
    newLineNumber?: number;
}
