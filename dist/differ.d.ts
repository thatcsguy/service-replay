import type { QueryResponse, DiffResult } from './types.js';
export declare function compareResponses(local: QueryResponse, production: QueryResponse): {
    hasDiff: boolean;
    diff: DiffResult | null;
};
