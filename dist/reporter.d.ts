import type { QueryResult } from './types.js';
export interface ReportData {
    generatedAt: string;
    command: string;
    summary: {
        total: number;
        withDiffs: number;
        withoutDiffs: number;
    };
    results: Array<{
        query: {
            operationName: string;
            executionId: string;
            timestamp: number;
            variables: string;
        };
        hasDiff: boolean;
        localJson: string;
        productionJson: string;
        diff: QueryResult['diff'];
    }>;
}
export declare function generateReport(results: QueryResult[], outputPath: string, command: string): void;
