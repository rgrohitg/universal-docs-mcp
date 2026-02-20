import { runCrawler } from './src/crawler.js';

async function test() {
    console.log('Crawling https://turndown.js.org/ (max 3 pages)...');
    try {
        const urls = await runCrawler('https://turndown.js.org/', 3);
        console.log("Crawled URLs:", urls);
    } catch (e) {
        console.error("Test failed", e);
    }
}

test();
