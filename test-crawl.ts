import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

async function runCrawlTest() {
    console.log("Starting MCP Client Test for Crawl and Search...");
    const transport = new StdioClientTransport({
        command: "node",
        args: ["./build/index.js"]
    });

    const client = new Client({
        name: "test-client",
        version: "1.0.0"
    }, {
        capabilities: {}
    });

    console.log("Connecting to server...");
    await client.connect(transport);

    console.log("Testing crawl_documentation_site on https://playwright.dev/docs/intro (max 3 pages)...");
    try {
        const crawlResult = await client.callTool({
            name: "crawl_documentation_site",
            arguments: {
                start_url: "https://playwright.dev/docs/intro",
                max_pages: 3
            }
        });

        console.log("Crawl Result:");
        console.log((crawlResult.content[0] as any).text);

        console.log("\nTesting search_crawled_docs with query 'playwright'...");
        const searchResult = await client.callTool({
            name: "search_crawled_docs",
            arguments: {
                query: "playwright"
            }
        });

        console.log("Search Result snippet:");
        const fullResult = (searchResult.content[0] as any).text;
        console.log(fullResult.slice(0, 500) + "...\n[TRUNCATED FOR DISPLAY]");

        console.log("\nCrawl and Search Test Successful!");

    } catch (e) {
        console.error("Tool execution failed:", e);
    }

    process.exit(0);
}

runCrawlTest().catch(console.error);
