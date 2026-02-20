import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

async function runTest() {
    console.log("Starting MCP Client Test...");
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

    console.log("Listing tools...");
    const tools = await client.listTools();
    console.log("Tools available:", tools.tools.map(t => t.name));

    console.log("Testing read_and_extract_page...");
    try {
        const result = await client.callTool({
            name: "read_and_extract_page",
            arguments: {
                url: "https://example.com"
            }
        });

        console.log("Extraction Test Successful!");
        console.log("Content slice:", (result.content[0] as any).text.slice(0, 100) + "...");
    } catch (e) {
        console.error("Tool execution failed:", e);
    }

    process.exit(0);
}

runTest().catch(console.error);
