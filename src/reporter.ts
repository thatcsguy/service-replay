import { readFileSync } from 'fs';
import { writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import type { QueryResult } from './types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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
    diff: QueryResult['diff'];
  }>;
}

export function generateReport(results: QueryResult[], outputPath: string, command: string): void {
  const templatePath = join(__dirname, '..', 'templates', 'report.html');
  let template: string;

  try {
    template = readFileSync(templatePath, 'utf-8');
  } catch {
    // If running from dist, try different path
    const altPath = join(__dirname, '..', '..', 'templates', 'report.html');
    template = readFileSync(altPath, 'utf-8');
  }

  const withDiffs = results.filter(r => r.hasDiff).length;

  // Sort results so queries with diffs appear first
  const sortedResults = [...results].sort((a, b) => {
    if (a.hasDiff === b.hasDiff) return 0;
    return a.hasDiff ? -1 : 1;
  });

  const reportData: ReportData = {
    generatedAt: new Date().toISOString(),
    command,
    summary: {
      total: results.length,
      withDiffs,
      withoutDiffs: results.length - withDiffs,
    },
    results: sortedResults.map(r => ({
      query: {
        operationName: r.query.operationName,
        executionId: r.query.executionId,
        timestamp: r.query.timestamp,
        variables: r.query.variables,
      },
      hasDiff: r.hasDiff,
      diff: r.diff,
    })),
  };

  // Inject data into template
  const dataScript = `<script>window.DATA = ${JSON.stringify(reportData)};</script>`;
  const html = template.replace('</head>', `${dataScript}\n</head>`);

  writeFileSync(outputPath, html, 'utf-8');
}
