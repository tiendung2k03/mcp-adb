import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { exec } from "child_process";
import { promisify } from "util";
import fs from "fs";
import path from "path";
import toml from "toml";
import { fileURLToPath } from "url";
import os from "os";

const execPromise = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to the root of the project
const rootPath = path.resolve(__dirname, "..");

/**
 * Helper to get a temporary directory compatible with Termux and Linux
 */
function getTempDir() {
  // In Termux, /tmp might not exist or be writable, use os.tmpdir()
  return os.tmpdir();
}

/**
 * Helper to execute shell commands and return MCP-compatible response
 */
async function executeCommandAsTool(command: string) {
  try {
    const { stdout, stderr } = await execPromise(command);
    return {
      content: [
        {
          type: "text" as const,
          text: stdout || stderr || "Command executed successfully (no output).",
        },
      ],
    };
  } catch (error: any) {
    return {
      content: [
        {
          type: "text" as const,
          text: `Error executing command: ${error.message}\n${error.stderr || ""}`,
        },
      ],
      isError: true,
    };
  }
}

const server = new McpServer({
  name: "mcp-adb",
  version: "1.0.0",
});

// --- Core ADB Tools ---

server.tool(
  "adb_devices",
  "Lists all connected Android devices and emulators.",
  {},
  () => executeCommandAsTool("adb devices -l")
);

server.tool(
  "adb_shell",
  "Executes a shell command on the connected Android device.",
  {
    command: z.string().describe("The shell command to execute"),
    device: z.string().optional().describe("Optional device ID"),
  },
  ({ command, device }) => {
    const deviceArg = device ? `-s ${device} ` : "";
    return executeCommandAsTool(`adb ${deviceArg}shell "${command.replace(/"/g, '\\"')}"`);
  }
);

server.tool(
  "inspect_ui",
  "Captures the complete UI hierarchy of the current screen as an XML document.",
  {
    device: z.string().optional().describe("Optional device ID"),
  },
  async ({ device }) => {
    const deviceArg = device ? `-s ${device} ` : "";
    const tempDir = getTempDir();
    const tempFile = path.join(tempDir, `view-${Date.now()}.xml`);
    try {
      // For Termux compatibility, we use a more robust way to handle temp files
      await execPromise(`adb ${deviceArg}shell uiautomator dump /sdcard/view.xml`);
      await execPromise(`adb ${deviceArg}pull /sdcard/view.xml ${tempFile}`);
      const content = fs.readFileSync(tempFile, "utf-8");
      fs.unlinkSync(tempFile);
      return {
        content: [{ type: "text" as const, text: content }],
      };
    } catch (error: any) {
      return {
        content: [{ type: "text" as const, text: `Error inspecting UI: ${error.message}` }],
        isError: true,
      };
    }
  }
);

server.tool(
  "screenshot",
  "Takes a screenshot of the current screen and returns it as a base64 string.",
  {
    device: z.string().optional().describe("Optional device ID"),
  },
  async ({ device }) => {
    const deviceArg = device ? `-s ${device} ` : "";
    const tempDir = getTempDir();
    const tempFile = path.join(tempDir, `screen-${Date.now()}.png`);
    try {
      await execPromise(`adb ${deviceArg}shell screencap -p /sdcard/screen.png`);
      await execPromise(`adb ${deviceArg}pull /sdcard/screen.png ${tempFile}`);
      const imageBuffer = fs.readFileSync(tempFile);
      const base64Image = imageBuffer.toString("base64");
      fs.unlinkSync(tempFile);
      return {
        content: [
          {
            type: "text" as const,
            text: "Screenshot captured successfully.",
          },
          {
            type: "image" as const,
            data: base64Image,
            mimeType: "image/png",
          },
        ],
      };
    } catch (error: any) {
      return {
        content: [{ type: "text" as const, text: `Error taking screenshot: ${error.message}` }],
        isError: true,
      };
    }
  }
);

// --- Dynamic TOML Tools ---

try {
  const commandsDir = path.join(rootPath, "commands", "android");
  if (fs.existsSync(commandsDir)) {
    const files = fs.readdirSync(commandsDir);
    for (const file of files) {
      if (path.extname(file) !== ".toml") continue;
      const filePath = path.join(commandsDir, file);
      const tomlContent = fs.readFileSync(filePath, "utf-8");
      const parsedToml = toml.parse(tomlContent);
      const toolName = path.basename(file, ".toml").replace(/-/g, "_");
      const description = parsedToml.description || `Tool for ${toolName}`;
      const prompt = parsedToml.prompt || "";
      
      const execMatch = prompt.match(/Example execution: (.+)/);
      if (!execMatch || !execMatch[1]) continue;
      
      const commandTemplate = execMatch[1].trim();
      const paramMap = new Map<string, { original: string; clean: string }>();
      const paramRegex = /<([^>]+)>/g;
      let match;
      while ((match = paramRegex.exec(prompt)) !== null) {
        const original = match[1];
        const clean = original.replace("param name", "").trim().replace(/\s/g, "_").replace(/:/g, "_");
        if (clean) paramMap.set(clean, { original, clean });
      }
      
      const shape: Record<string, any> = {};
      const numberKeywords = ["level", "port", "duration", "limit", "brightness", "state", "pid", "width", "height", "seconds", "ms", "dpi"];
      paramMap.forEach(({ original, clean }) => {
        const isNumber = numberKeywords.some(k => clean.includes(k) || original.includes(k));
        shape[clean] = (isNumber ? z.number() : z.string()).describe(original.replace(/_/g, " "));
      });

      server.tool(toolName, shape, (args: any) => {
        let finalCommand = commandTemplate;
        paramMap.forEach(({ original, clean }) => {
          if (clean in args) {
            const value = args[clean];
            finalCommand = finalCommand.split(`<${original}>`).join(String(value));
          }
        });
        finalCommand = finalCommand.replace(/<[^>]+>/g, "").trim();
        return executeCommandAsTool(finalCommand);
      });
    }
  }
} catch (e) {
  console.error("Failed during dynamic tool registration:", e);
}

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("MCP-ADB Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
