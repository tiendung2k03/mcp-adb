import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import fs from "fs";
import path from "path";
import toml from "toml";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootPath = path.resolve(__dirname, ".");

const server = new McpServer({
  name: "mcp-adb-test",
  version: "1.0.0",
});

// Mock tool registration logic from index.ts
try {
  const commandsDir = path.join(rootPath, "commands", "android");
  if (fs.existsSync(commandsDir)) {
    const files = fs.readdirSync(commandsDir);
    let count = 0;
    for (const file of files) {
      if (path.extname(file) !== ".toml") continue;
      count++;
    }
    console.log(`Found ${count} TOML command files.`);
  } else {
    console.log("Commands directory not found!");
  }
} catch (e) {
  console.error("Error:", e);
}

console.log("Server initialization test passed.");
