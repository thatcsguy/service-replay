import type { QueryResponse, DiffResult, DiffHunk, DiffLine } from './types.js';

function formatJson(data: unknown): string {
  try {
    return JSON.stringify(data, null, 2);
  } catch {
    return String(data);
  }
}

function computeLCS(a: string[], b: string[]): number[][] {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  return dp;
}

function backtrackDiff(dp: number[][], a: string[], b: string[]): DiffLine[] {
  const lines: DiffLine[] = [];
  let i = a.length;
  let j = b.length;
  let oldLineNum = a.length;
  let newLineNum = b.length;

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && a[i - 1] === b[j - 1]) {
      lines.unshift({
        type: 'context',
        content: a[i - 1],
        oldLineNumber: oldLineNum,
        newLineNumber: newLineNum,
      });
      i--;
      j--;
      oldLineNum--;
      newLineNum--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      lines.unshift({
        type: 'add',
        content: b[j - 1],
        newLineNumber: newLineNum,
      });
      j--;
      newLineNum--;
    } else if (i > 0) {
      lines.unshift({
        type: 'remove',
        content: a[i - 1],
        oldLineNumber: oldLineNum,
      });
      i--;
      oldLineNum--;
    }
  }

  return lines;
}

function createHunks(lines: DiffLine[], contextSize: number = 3): DiffHunk[] {
  const hunks: DiffHunk[] = [];
  let currentHunk: DiffHunk | null = null;
  let contextBuffer: DiffLine[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.type !== 'context') {
      // Start a new hunk if needed
      if (!currentHunk) {
        currentHunk = {
          oldStart: line.oldLineNumber ?? line.newLineNumber ?? 1,
          oldLines: 0,
          newStart: line.newLineNumber ?? line.oldLineNumber ?? 1,
          newLines: 0,
          lines: [],
        };

        // Add context from buffer
        const context = contextBuffer.slice(-contextSize);
        for (const ctx of context) {
          currentHunk.lines.push(ctx);
          currentHunk.oldLines++;
          currentHunk.newLines++;
          if (ctx.oldLineNumber && ctx.oldLineNumber < currentHunk.oldStart) {
            currentHunk.oldStart = ctx.oldLineNumber;
          }
          if (ctx.newLineNumber && ctx.newLineNumber < currentHunk.newStart) {
            currentHunk.newStart = ctx.newLineNumber;
          }
        }
        contextBuffer = [];
      }

      currentHunk.lines.push(line);
      if (line.type === 'remove') {
        currentHunk.oldLines++;
      } else if (line.type === 'add') {
        currentHunk.newLines++;
      }
    } else {
      if (currentHunk) {
        // Check if we should close the hunk
        let nextChangeIndex = -1;
        for (let j = i + 1; j < lines.length && j <= i + contextSize * 2; j++) {
          if (lines[j].type !== 'context') {
            nextChangeIndex = j;
            break;
          }
        }

        if (nextChangeIndex === -1 || nextChangeIndex > i + contextSize * 2) {
          // Close current hunk with trailing context
          const trailingContext = [];
          for (let j = i; j < lines.length && j < i + contextSize && lines[j].type === 'context'; j++) {
            trailingContext.push(lines[j]);
          }
          for (const ctx of trailingContext) {
            currentHunk.lines.push(ctx);
            currentHunk.oldLines++;
            currentHunk.newLines++;
          }
          hunks.push(currentHunk);
          currentHunk = null;
          contextBuffer = [];
        } else {
          // Continue hunk
          currentHunk.lines.push(line);
          currentHunk.oldLines++;
          currentHunk.newLines++;
        }
      } else {
        contextBuffer.push(line);
      }
    }
  }

  // Close any remaining hunk
  if (currentHunk) {
    hunks.push(currentHunk);
  }

  return hunks;
}

export function compareResponses(local: QueryResponse, production: QueryResponse): { hasDiff: boolean; diff: DiffResult | null } {
  const localJson = formatJson(local.data ?? local.error ?? { success: local.success });
  const productionJson = formatJson(production.data ?? production.error ?? { success: production.success });

  if (localJson === productionJson) {
    return { hasDiff: false, diff: null };
  }

  const localLines = localJson.split('\n');
  const productionLines = productionJson.split('\n');

  const dp = computeLCS(localLines, productionLines);
  const diffLines = backtrackDiff(dp, localLines, productionLines);
  const hunks = createHunks(diffLines);

  return {
    hasDiff: true,
    diff: {
      hunks,
      localJson,
      productionJson,
    },
  };
}
