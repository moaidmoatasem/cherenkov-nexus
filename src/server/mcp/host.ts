import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { createRequire } from "node:module";
import path from "node:path";

const require = createRequire(import.meta.url);

interface McpTool {
  name: string;
  description: string;
  inputSchema: unknown;
  server: string;
}

interface McpHandle {
  name: string;
  kind: "stdio" | "inmemory";
  connected: boolean;
  error?: string;
  toolNames: string[];
}

interface McpCallResult {
  ok: boolean;
  server: string;
  tool: string;
  content?: string;
  isError?: boolean;
  error?: string;
}

function resolveServerEntry(moduleSpecifier: string): string {
  try {
    return require.resolve(moduleSpecifier);
  } catch (err) {
    const pkg = moduleSpecifier.startsWith("@")
      ? moduleSpecifier.split("/").slice(0, 2).join("/")
      : moduleSpecifier.split("/")[0];
    const subpath = moduleSpecifier.slice(pkg.length + 1);
    const pkgMain = require.resolve(pkg);
    return path.join(path.dirname(pkgMain), subpath);
  }
}

export class McpHost {
  private clients = new Map<string, Client>();
  private handles = new Map<string, McpHandle>();
  private toolIndex = new Map<string, McpTool>();

  private async registerTool(serverName: string, client: Client, kind: McpHandle["kind"]): Promise<void> {
    try {
      const tools = await client.listTools();
      const toolNames: string[] = [];
      for (const tool of tools.tools) {
        toolNames.push(tool.name);
        this.toolIndex.set(tool.name, {
          name: tool.name,
          description: (tool as { description?: string }).description ?? "",
          inputSchema: (tool as { inputSchema?: unknown }).inputSchema ?? { type: "object", properties: {} },
          server: serverName,
        });
      }
      this.handles.set(serverName, { name: serverName, kind, connected: true, toolNames });
    } catch (err) {
      this.handles.set(serverName, {
        name: serverName,
        kind,
        connected: false,
        error: err instanceof Error ? err.message : String(err),
        toolNames: [],
      });
      throw err;
    }
  }

  async connectStdio(name: string, moduleSpecifier: string, envExtra: Record<string, string | undefined> = {}): Promise<void> {
    if (this.clients.has(name)) return;
    let entry: string;
    try {
      entry = resolveServerEntry(moduleSpecifier);
    } catch (err) {
      const message = `Cannot resolve module "${moduleSpecifier}": ${err instanceof Error ? err.message : err}`;
      this.handles.set(name, { name, kind: "stdio", connected: false, error: message, toolNames: [] });
      console.error(`[McpHost] ${message}`);
      return;
    }
    const env: Record<string, string> = {
      ...(process.env as Record<string, string>),
      ...Object.fromEntries(
        Object.entries(envExtra).filter(([, v]) => v !== undefined) as [string, string][]
      ),
    };
    const transport = new StdioClientTransport({ command: process.execPath, args: [entry], env });
    const client = new Client({ name: `cherenkov-${name}`, version: "2.5.0" });
    try {
      await client.connect(transport);
      this.clients.set(name, client);
      await this.registerTool(name, client, "stdio");
      console.log(`[McpHost] connected stdio server "${name}" (${this.handles.get(name)?.toolNames.length ?? 0} tools)`);
    } catch (err) {
      this.handles.set(name, {
        name,
        kind: "stdio",
        connected: false,
        error: err instanceof Error ? err.message : String(err),
        toolNames: [],
      });
      console.error(`[McpHost] failed to connect "${name}":`, err instanceof Error ? err.message : err);
    }
  }

  async connectInMemory(name: string, server: import("@modelcontextprotocol/sdk/server/index.js").Server): Promise<void> {
    if (this.clients.has(name)) return;
    const pair = InMemoryTransport.createLinkedPair();
    const client = new Client({ name: `cherenkov-${name}`, version: "2.5.0" });
    try {
      await Promise.all([client.connect(pair[0]), server.connect(pair[1])]);
      this.clients.set(name, client);
      await this.registerTool(name, client, "inmemory");
      console.log(`[McpHost] connected in-memory server "${name}" (${this.handles.get(name)?.toolNames.length ?? 0} tools)`);
    } catch (err) {
      this.handles.set(name, {
        name,
        kind: "inmemory",
        connected: false,
        error: err instanceof Error ? err.message : String(err),
        toolNames: [],
      });
      console.error(`[McpHost] failed to connect in-memory "${name}":`, err instanceof Error ? err.message : err);
    }
  }

  listAllTools(): McpTool[] {
    return [...this.toolIndex.values()];
  }

  status(): McpHandle[] {
    return [...this.handles.values()];
  }

  connected(): boolean {
    return this.handles.size > 0 && [...this.handles.values()].some((h) => h.connected);
  }

  private findClient(tool: McpTool): Client | undefined {
    return this.clients.get(tool.server);
  }

  async callTool(toolName: string, args: Record<string, unknown>): Promise<McpCallResult> {
    const tool = this.toolIndex.get(toolName);
    if (!tool) return { ok: false, server: "", tool: toolName, error: `Unknown MCP tool "${toolName}"` };
    const client = this.findClient(tool);
    if (!client) return { ok: false, server: tool.server, tool: toolName, error: `Server "${tool.server}" not connected` };
    try {
      const result = await client.callTool({ name: toolName, arguments: args });
      const text = Array.isArray(result.content)
        ? result.content
            .map((c) => (c && typeof c === "object" && "text" in c ? (c as { text: string }).text : JSON.stringify(c)))
            .join("\n")
        : String(result.content ?? "");
      return {
        ok: !result.isError,
        server: tool.server,
        tool: toolName,
        content: text,
        isError: Boolean(result.isError),
      };
    } catch (err) {
      return {
        ok: false,
        server: tool.server,
        tool: toolName,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  }

  async disconnectAll(): Promise<void> {
    for (const [name, client] of this.clients) {
      try {
        await client.close();
      } catch (err) {
        console.warn(`[McpHost] error closing "${name}":`, err instanceof Error ? err.message : err);
      }
      this.clients.delete(name);
    }
    this.toolIndex.clear();
    this.handles.clear();
  }
}

export const mcpHost = new McpHost();

export async function ensureMcpConnectivity(): Promise<void> {
  await mcpHost.connectStdio(
    "github",
    "@modelcontextprotocol/server-github/dist/index.js",
    {
      GITHUB_PERSONAL_ACCESS_TOKEN: process.env.GITHUB_TOKEN,
      GITHUB_API_URL: process.env.GITHUB_API_URL,
    }
  );
  await mcpHost.connectStdio("playwright", "@playwright/mcp/cli.js", {
    ...(process.env.LINKEDIN_COOKIES_JSON ? { LINKEDIN_COOKIES_JSON: process.env.LINKEDIN_COOKIES_JSON } : {}),
  });
  try {
    const { createLinkedInMcpServer } = await import("./linkedinServer.js");
    const linkedin = createLinkedInMcpServer();
    await mcpHost.connectInMemory("linkedin", linkedin);
  } catch (err) {
    console.error("[McpHost] failed to load linkedin server:", err instanceof Error ? err.message : err);
  }
}