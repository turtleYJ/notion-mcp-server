#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { 
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { Client } from "@notionhq/client";

const notion = new Client({
  auth: process.env.NOTION_TOKEN,
});

const server = new Server(
  {
    name: "notion-mcp-server",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

function blockToText(block) {
  if (!block || !block.type) return "";
  
  switch (block.type) {
    case "paragraph":
      return block.paragraph?.rich_text?.map(rt => rt.plain_text).join("") || "";
    case "heading_1":
      return "# " + (block.heading_1?.rich_text?.map(rt => rt.plain_text).join("") || "");
    case "heading_2":
      return "## " + (block.heading_2?.rich_text?.map(rt => rt.plain_text).join("") || "");
    case "heading_3":
      return "### " + (block.heading_3?.rich_text?.map(rt => rt.plain_text).join("") || "");
    case "bulleted_list_item":
      return "• " + (block.bulleted_list_item?.rich_text?.map(rt => rt.plain_text).join("") || "");
    case "numbered_list_item":
      return "1. " + (block.numbered_list_item?.rich_text?.map(rt => rt.plain_text).join("") || "");
    default:
      return "";
  }
}

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "read_page",
        description: "Read a Notion page content",
        inputSchema: {
          type: "object",
          properties: {
            page_id: {
              type: "string",
              description: "The ID of the page to read",
            },
          },
          required: ["page_id"],
        },
      },
      {
        name: "create_page",
        description: "Create a new Notion page",
        inputSchema: {
          type: "object",
          properties: {
            parent_id: {
              type: "string",
              description: "Parent page ID",
            },
            title: {
              type: "string",
              description: "Page title",
            },
            content: {
              type: "string",
              description: "Page content",
            },
          },
          required: ["parent_id", "title"],
        },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (name === "read_page") {
    try {
      const page = await notion.pages.retrieve({ page_id: args.page_id });
      const blocks = await notion.blocks.children.list({
        block_id: args.page_id,
      });
      
      const title = page.properties?.title?.title?.[0]?.plain_text || 
                   page.properties?.Name?.title?.[0]?.plain_text ||
                   "Untitled";
      
      const content = blocks.results.map(block => blockToText(block)).join('\n');
      
      return {
        content: [
          {
            type: "text",
            text: `Page Title: ${title}\n\nContent:\n${content}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error: ${error.message}`,
          },
        ],
      };
    }
  }

  if (name === "create_page") {
    try {
      const response = await notion.pages.create({
        parent: { page_id: args.parent_id },
        properties: {
          title: {
            title: [
              {
                text: {
                  content: args.title,
                },
              },
            ],
          },
        },
        children: args.content
          ? [
              {
                object: "block",
                type: "paragraph",
                paragraph: {
                  rich_text: [
                    {
                      type: "text",
                      text: {
                        content: args.content,
                      },
                    },
                  ],
                },
              },
            ]
          : [],
      });

      return {
        content: [
          {
            type: "text",
            text: `Page created successfully. ID: ${response.id}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error: ${error.message}`,
          },
        ],
      };
    }
  }

  return {
    content: [
      {
        type: "text",
        text: `Unknown tool: ${name}`,
      },
    ],
  };
});

async function run() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Notion MCP server running on stdio");
}

run().catch(console.error);