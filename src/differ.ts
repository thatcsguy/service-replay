import type { QueryResponse, DiffResult, DiffChange } from './types.js';

const MAX_CHANGES = 500; // Limit to prevent huge diffs

function isObject(val: unknown): val is Record<string, unknown> {
  return val !== null && typeof val === 'object' && !Array.isArray(val);
}

function isArray(val: unknown): val is unknown[] {
  return Array.isArray(val);
}

function formatPath(segments: (string | number)[]): string {
  if (segments.length === 0) return '(root)';

  return segments.reduce<string>((path, segment, idx) => {
    if (typeof segment === 'number') {
      return `${path}[${segment}]`;
    }
    // Use dot notation for valid identifiers, bracket notation otherwise
    if (/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(segment)) {
      return idx === 0 ? segment : `${path}.${segment}`;
    }
    return `${path}["${segment}"]`;
  }, '');
}

function collectChanges(
  local: unknown,
  production: unknown,
  path: (string | number)[],
  changes: DiffChange[],
  maxChanges: number
): void {
  // Stop if we've hit the limit
  if (changes.length >= maxChanges) {
    return;
  }

  // Fast equality check for primitives
  if (local === production) {
    return;
  }

  // Handle nulls and type mismatches
  const localType = local === null ? 'null' : typeof local;
  const prodType = production === null ? 'null' : typeof production;

  // If types differ, it's a change
  if (localType !== prodType ||
      (isArray(local) !== isArray(production))) {
    changes.push({
      path: formatPath(path),
      type: 'changed',
      localValue: local,
      productionValue: production,
    });
    return;
  }

  // Both are arrays
  if (isArray(local) && isArray(production)) {
    const maxLen = Math.max(local.length, production.length);
    for (let i = 0; i < maxLen && changes.length < maxChanges; i++) {
      if (i >= local.length) {
        changes.push({
          path: formatPath([...path, i]),
          type: 'added',
          productionValue: production[i],
        });
      } else if (i >= production.length) {
        changes.push({
          path: formatPath([...path, i]),
          type: 'removed',
          localValue: local[i],
        });
      } else {
        collectChanges(local[i], production[i], [...path, i], changes, maxChanges);
      }
    }
    return;
  }

  // Both are objects
  if (isObject(local) && isObject(production)) {
    const allKeys = new Set([...Object.keys(local), ...Object.keys(production)]);

    for (const key of allKeys) {
      if (changes.length >= maxChanges) break;

      const inLocal = key in local;
      const inProd = key in production;

      if (inLocal && !inProd) {
        changes.push({
          path: formatPath([...path, key]),
          type: 'removed',
          localValue: local[key],
        });
      } else if (!inLocal && inProd) {
        changes.push({
          path: formatPath([...path, key]),
          type: 'added',
          productionValue: production[key],
        });
      } else {
        collectChanges(local[key], production[key], [...path, key], changes, maxChanges);
      }
    }
    return;
  }

  // Primitives that are not equal
  changes.push({
    path: formatPath(path),
    type: 'changed',
    localValue: local,
    productionValue: production,
  });
}

function getResponseData(response: QueryResponse): unknown {
  return response.data ?? response.error ?? { success: response.success };
}

export function compareResponses(
  local: QueryResponse,
  production: QueryResponse
): { hasDiff: boolean; diff: DiffResult | null } {
  const localData = getResponseData(local);
  const productionData = getResponseData(production);

  // Fast check: stringify comparison for quick equality test
  // This is O(n) and catches the common case of identical responses
  const localStr = JSON.stringify(localData);
  const prodStr = JSON.stringify(productionData);

  if (localStr === prodStr) {
    return { hasDiff: false, diff: null };
  }

  // Collect structural differences
  const changes: DiffChange[] = [];
  collectChanges(localData, productionData, [], changes, MAX_CHANGES);

  const truncated = changes.length >= MAX_CHANGES;

  return {
    hasDiff: true,
    diff: {
      changes,
      totalChanges: changes.length,
      truncated,
    },
  };
}
