#!/usr/bin/env node

import { program } from 'commander';
import { loadConfig } from './config.js';
import { fetchQueries } from './fetcher.js';
import { executeAllQueries } from './executor.js';
import { compareResponses } from './differ.js';
import { generateReport } from './reporter.js';
import type { QueryResult } from './types.js';

function getToday(): string {
  const now = new Date();
  return now.toISOString().split('T')[0];
}

program
  .name('rama-replay')
  .description('Replay GraphQL queries and compare local vs production responses')
  .version('1.0.0')
  .option('-i, --initial-date <date>', 'Start date (YYYY-MM-DD)', getToday())
  .option('-f, --final-date <date>', 'End date (YYYY-MM-DD)', getToday())
  .option('-l, --limit <number>', 'Maximum number of queries to fetch', '100')
  .option('-o, --output <path>', 'Output HTML file path', './report.html')
  .option('-c, --concurrency <number>', 'Number of concurrent requests', '5')
  .action(async (options) => {
    const command = process.argv.join(' ');

    try {
      console.log('🔧 Loading configuration...');
      const config = loadConfig();

      console.log(`📥 Fetching queries from ${options.initialDate} to ${options.finalDate}...`);
      const queries = await fetchQueries({
        replayApiUrl: config.replayApiUrl,
        initialDate: options.initialDate,
        finalDate: options.finalDate,
        limit: parseInt(options.limit),
      });

      if (queries.length === 0) {
        console.log('⚠️  No queries found for the specified date range.');
        return;
      }

      // Filter out introspection queries as they're not useful to diff
      const filteredQueries = queries.filter(q => q.operationName !== 'IntrospectionQuery');
      const skipped = queries.length - filteredQueries.length;

      if (skipped > 0) {
        console.log(`📋 Found ${queries.length} queries (skipping ${skipped} IntrospectionQuery)`);
      } else {
        console.log(`📋 Found ${queries.length} queries`);
      }

      if (filteredQueries.length === 0) {
        console.log('⚠️  No queries to process after filtering.');
        return;
      }

      console.log('🚀 Executing queries against local and production...');
      const executedPairs = await executeAllQueries({
        queries: filteredQueries,
        localEndpoint: config.localGraphqlUrl,
        localAuth: config.localAuth,
        productionEndpoint: config.productionGraphqlUrl,
        productionAuth: config.productionAuth,
        concurrency: parseInt(options.concurrency),
        onProgress: (completed, total) => {
          process.stdout.write(`\r   Progress: ${completed}/${total} queries`);
        },
      });

      console.log('\n🔍 Comparing responses...');
      const results: QueryResult[] = executedPairs.map((pair) => {
        const { hasDiff, diff } = compareResponses(pair.localResponse, pair.productionResponse);
        return {
          query: pair.query,
          localResponse: pair.localResponse,
          productionResponse: pair.productionResponse,
          hasDiff,
          diff,
        };
      });

      const withDiffs = results.filter(r => r.hasDiff).length;
      console.log(`📊 Results: ${withDiffs} queries with diffs, ${results.length - withDiffs} identical`);

      console.log(`📄 Generating report: ${options.output}`);
      generateReport(results, options.output, command);

      console.log('✅ Done!');

      if (withDiffs > 0) {
        console.log(`\n⚠️  ${withDiffs} queries have differences between local and production.`);
      } else {
        console.log('\n🎉 All queries returned identical results!');
      }
    } catch (error) {
      console.error('❌ Error:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

program.parse();
