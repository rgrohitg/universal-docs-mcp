import { extractSinglePage } from './src/crawler.js';

async function test() {
    console.log("Testing single page extraction...");
    const url = "https://example.com";
    try {
        const md = await extractSinglePage(url);
        console.log("Extraction successful!");
        console.log("---");
        console.log(md);
        console.log("---");
    } catch (e) {
        console.error("Error during extraction:", e);
    }

    // Explicitly exit since Playwright might keep the process alive
    process.exit(0);
}

test();
