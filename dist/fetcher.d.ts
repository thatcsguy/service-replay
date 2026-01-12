import type { ReplayQuery } from './types.js';
export interface FetchQueriesOptions {
    replayApiUrl: string;
    initialDate: string;
    finalDate: string;
    limit: number;
}
export declare function fetchQueries(options: FetchQueriesOptions): Promise<ReplayQuery[]>;
