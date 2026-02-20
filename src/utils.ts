import { Readability } from '@mozilla/readability';
import { JSDOM } from 'jsdom';
import TurndownService from 'turndown';

const turndownService = new TurndownService({
    headingStyle: 'atx',
    codeBlockStyle: 'fenced',
});

/**
 * Extracts the main article content from raw HTML and converts it to pristine Markdown.
 * Uses `@mozilla/readability` to strip out navigation headers, sidebars, and footers, 
 * leaving only the core documentation body.
 * 
 * If Readability fails to find a distinct `<article>` block, it safely falls back to
 * parsing the raw `document.body.innerHTML`.
 * 
 * @param html The raw HTML string fetched from the Playwright page instance.
 * @param url The absolute URL of the page. This is critical for `JSDOM` to resolve relative `href` and `src` links into absolute URLs.
 * @returns Clean Markdown string ready for LLM consumption or local caching.
 */
export function extractMarkdownPristine(html: string, url: string): string {
    // Parse HTML with jsdom. Passing the url ensures relative links become absolute.
    const doc = new JSDOM(html, { url });

    // Use Readability to extract the main article content.
    const reader = new Readability(doc.window.document);
    const article = reader.parse();

    if (!article) {
        // If Readability fails to find an article, fallback to the entire body or a generic Error
        // Often docs without clear article tags might return null.
        // As a fallback, try to turndown the body.
        return turndownService.turndown(doc.window.document.body.innerHTML || html);
    }

    // Convert the extracted HTML to Markdown
    const markdown = turndownService.turndown(article.content || '');

    return markdown;
}
