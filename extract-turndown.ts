import { extractSinglePage } from './src/crawler.js';
import { log } from 'crawlee';

log.setLevel(log.LEVELS.DEBUG);

async function main() {
    try {
        console.log("Starting extraction...");
        const markdown = await extractSinglePage('https://mixmark-io.github.io/turndown/');
        console.log("--- MARKDOWN ---");
        console.log(markdown);
        console.log("--- END MARKDOWN ---");
    } catch (e) {
        console.error("Failed to extract:", e);
    }
}

main();
