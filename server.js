#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { Client } from "@notionhq/client";

const notion = new Client({
  auth: process.env.NOTION_TOKEN,
});

class NotionMCPServer {
  constructor() {
    this.server = new Server(
      {
        name: "notion-mcp-server",
        version: "1.0.0",
      },
      {
        capabilities: {
          resources: {},
          tools: {},
        },
      }
    );

    this.setupHandlers();
  }

  setupHandlers() {
    // 도구 목록 제공
    this.server.setRequestHandler("tools/list", async () => {
      return {
        tools: [
          {
            name: "read_page",
            description: "Notion 페이지 내용 읽기",
            inputSchema: {
              type: "object",
              properties: {
                page_id: {
                  type: "string",
                  description: "읽을 페이지의 ID",
                },
              },
              required: ["page_id"],
            },
          },
          {
            name: "create_page",
            description: "새 Notion 페이지 생성",
            inputSchema: {
              type: "object",
              properties: {
                parent_id: {
                  type: "string",
                  description: "부모 페이지 ID",
                },
                title: {
                  type: "string",
                  description: "페이지 제목",
                },
                content: {
                  type: "string",
                  description: "페이지 내용",
                },
              },
              required: ["parent_id", "title"],
            },
          },
        ],
      };
    });

    // 페이지 읽기 도구
    this.server.setRequestHandler("tools/call", async (request) => {
      const { name, arguments: args } = request.params;

      if (name === "read_page") {
        try {
          const page = await notion.pages.retrieve({ page_id: args.page_id });
          const blocks = await notion.blocks.children.list({
            block_id: args.page_id,
          });
          
          return {
            content: [
              {
                type: "text",
                text: `페이지 제목: ${page.properties.title?.title[0]?.plain_text || '제목 없음'}\n\n내용:\n${blocks.results.map(block => this.blockToText(block)).join('\n')}`,
              },
            ],
          };
        } catch (error) {
          return {
            content: [
              {
                type: "text",
                text: `오류: ${error.message}`,
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
                text: `페이지가 성공적으로 생성되었습니다. ID: ${response.id}`,
              },
            ],
          };
        } catch (error) {
          return {
            content: [
              {
                type: "text",
                text: `오류: ${error.message}`,
              },
            ],
          };
        }
      }
    });
  }

  blockToText(block) {
    switch (block.type) {
      case "paragraph":
        return block.paragraph.rich_text.map(rt => rt.plain_text).join("");
      case "heading_1":
        return "# " + block.heading_1.rich_text.map(rt => rt.plain_text).join("");
      case "heading_2":
        return "## " + block.heading_2.rich_text.map(rt => rt.plain_text).join("");
      case "heading_3":
        return "### " + block.heading_3.rich_text.map(rt => rt.plain_text).join("");
      case "bulleted_list_item":
        return "• " + block.bulleted_list_item.rich_text.map(rt => rt.plain_text).join("");
      case "numbered_list_item":
        return "1. " + block.numbered_list_item.rich_text.map(rt => rt.plain_text).join("");
      default:
        return "";
    }
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
  }
}

const server = new NotionMCPServer();
server.run().catch(console.error);
