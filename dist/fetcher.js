export async function fetchQueries(options) {
    const { replayApiUrl, initialDate, finalDate, limit } = options;
    const url = new URL(replayApiUrl);
    url.searchParams.set('initialDate', initialDate);
    url.searchParams.set('finalDate', finalDate);
    url.searchParams.set('limit', String(limit));
    const response = await fetch(url.toString());
    if (!response.ok) {
        throw new Error(`Failed to fetch queries: ${response.status} ${response.statusText}`);
    }
    const queries = await response.json();
    return queries;
}
