import type { ReplayQuery, QueryResponse } from './types.js';
export interface ExecuteQueryOptions {
    query: ReplayQuery;
    endpoint: string;
    authorization: string;
}
export declare function executeQuery(options: ExecuteQueryOptions): Promise<QueryResponse>;
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
export declare function executeAllQueries(options: ExecuteAllQueriesOptions): Promise<ExecutedQueryPair[]>;
