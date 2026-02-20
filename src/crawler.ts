import { PlaywrightCrawler, Dataset, RequestQueue, log } from 'crawlee';
import { extractMarkdownPristine } from './utils.js';

// Shut off all Crawlee logging because MCP relies on a pure JSON STDOUT pipe.
// Any extraneous logs (especially \x1b colored ones) will break the MCP protocol parsing!
log.setLevel(log.LEVELS.OFF);

export interface CrawlerResult {
    url: string;
    title: string;
    markdown: string;
}

/**
 * Runs the crawler on a specific starting URL using a Breadth-First Search strategy.
 * This utilizes Playwright in headless mode to ensure SPAs (React, Vue, Angular) 
 * are fully rendered before their DOM is parsed.
 * 
 * @param startUrl The absolute URL to start crawling from.
 * @param maxPages The maximum number of pages to crawl before terminating the queue.
 * @returns A Promise resolving to an array of successfully crawled and cached URLs.
 */
export async function runCrawler(startUrl: string, maxPages: number = 10): Promise<string[]> {
    const requestQueue = await RequestQueue.open();
    await requestQueue.addRequest({ url: startUrl });

    const crawledUrls: string[] = [];

    const crawler = new PlaywrightCrawler({
        requestQueue,
        maxRequestsPerCrawl: maxPages,

        // Playwright specific configurations
        headless: true,
        navigationTimeoutSecs: 30,

        // Request handler runs for each page
        async requestHandler({ request, page, enqueueLinks, log }) {
            log.info(`Processing ${request.url}...`);

            // Wait for network idle to ensure SPAs (like Storybook, React) are loaded.
            await page.waitForLoadState('networkidle');

            // Attempt to hide common cookie banners/overlays before extraction
            await page.evaluate(() => {
                const selectors = [
                    '#cookie-banner', '.cookie-banner', '#onetrust-consent-sdk',
                    '.overlay', '.modal', '[id*="cookie"]', '[class*="cookie"]'
                ];
                selectors.forEach(sel => {
                    document.querySelectorAll(sel).forEach(el => (el as HTMLElement).style.display = 'none');
                });
            });

            const title = await page.title();
            const html = await page.content();
            const url = page.url();

            try {
                const markdown = extractMarkdownPristine(html, url);

                // Store the result directly into the default dataset.
                await Dataset.pushData({
                    url,
                    title,
                    markdown,
                });

                crawledUrls.push(url);
            } catch (err) {
                log.error(`Failed to extract markdown from ${url}: ${err}`);
            }

            // Enqueue links that share the same base domain
            // We use strategy 'same-hostname' to prevent wandering to external links.
            await enqueueLinks({
                strategy: 'same-hostname',
                // We only enqueue general 'a' tags, excluding common static assets.
                globs: ['http?(s)://**/*'],
            });
        },

        // Handle failed requests
        failedRequestHandler({ request, log }) {
            log.error(`Request ${request.url} failed completely.`);
        },
    });

    await crawler.run();

    return crawledUrls;
}

/**
 * Extracts a single page without enqueuing links or saving to the global dataset search cache.
 * Useful for targeted extractions where the user provides a direct documentation link.
 * 
 * @param url Document URL to read and extract.
 * @returns A Promise resolving to the converted Markdown string of the main article content.
 */
export async function extractSinglePage(url: string): Promise<string> {
    let resultMarkdown = "";

    const crawler = new PlaywrightCrawler({
        // Only process this one request
        maxRequestsPerCrawl: 1,
        headless: true,

        async requestHandler({ request, page, log }) {
            log.info(`Extracting single page ${request.url}...`);
            await page.waitForLoadState('networkidle');

            const html = await page.content();
            resultMarkdown = extractMarkdownPristine(html, page.url());

            await Dataset.pushData({
                url: request.url,
                title: await page.title(),
                markdown: resultMarkdown
            });
        },
    });

    await crawler.run([url]);
    return resultMarkdown;
}

/**
 * Searches the local Crawlee datasets (`./storage/datasets/default`) for a specific query string.
 * This currently performs an in-memory sequential scan of the JSON cache files.
 * 
 * @param query The text string to search for across all cached markdown documents.
 * @returns A Promise resolving to an array of objects containing the matched URL, title, and full document content.
 */
export async function searchLocalDatasets(query: string): Promise<Array<{ url: string, title: string, content: string }>> {
    const dataset = await Dataset.open();
    // Depending on data volume, loading all might be heavy, but fine for default use cases
    const { items } = await dataset.getData();

    const results = [];
    const lowerQuery = query.toLowerCase();

    for (const item of items) {
        if (!item.markdown) continue;
        const md = item.markdown as string;
        if (md.toLowerCase().includes(lowerQuery)) {
            results.push({
                url: item.url as string,
                title: item.title as string,
                // Optional snippet or full markdown. We'll return full markdown as requested by typical MCP search.
                content: md,
            });
        }
    }

    return results;
}
