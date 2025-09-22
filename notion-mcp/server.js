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

function splitTextIntoBlocks(content, maxLength = 1900) {
  if (!content || content.length <= maxLength) {
    return [content];
  }
  
  const blocks = [];
  let remaining = content;
  
  while (remaining.length > maxLength) {
    // Find safe split points (sentence end, line break, etc.)
    let splitPoint = remaining.lastIndexOf('\n', maxLength);
    if (splitPoint === -1) {
      splitPoint = remaining.lastIndexOf('. ', maxLength);
    }
    if (splitPoint === -1) {
      splitPoint = remaining.lastIndexOf(' ', maxLength);
    }
    if (splitPoint === -1) {
      splitPoint = maxLength; // Force split if no safe point found
    }
    
    blocks.push(remaining.substring(0, splitPoint).trim());
    remaining = remaining.substring(splitPoint).trim();
  }
  
  if (remaining) {
    blocks.push(remaining);
  }
  
  return blocks.filter(block => block.length > 0);
}

function parseRichText(text) {
  if (!text) return [{ type: "text", text: { content: "" } }];
  
  const richTextArray = [];
  const boldRegex = /\*\*(.*?)\*\*/g;
  
  let lastIndex = 0;
  let match;
  
  while ((match = boldRegex.exec(text)) !== null) {
    // Add text before bold
    if (match.index > lastIndex) {
      const beforeText = text.slice(lastIndex, match.index);
      if (beforeText) {
        richTextArray.push({
          type: "text",
          text: { content: beforeText }
        });
      }
    }
    
    // Add bold text
    richTextArray.push({
      type: "text",
      text: { content: match[1] },
      annotations: { bold: true }
    });
    
    lastIndex = boldRegex.lastIndex;
  }
  
  // Add remaining text
  if (lastIndex < text.length) {
    const remainingText = text.slice(lastIndex);
    if (remainingText) {
      richTextArray.push({
        type: "text",
        text: { content: remainingText }
      });
    }
  }
  
  return richTextArray.length > 0 ? richTextArray : [{ type: "text", text: { content: text } }];
}

function parseMarkdownToBlocks(content) {
  if (!content) return [];
  
  const lines = content.split('\n');
  const blocks = [];
  let currentParagraph = "";
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    
    // Handle headings
    if (trimmedLine.startsWith('### ')) {
      if (currentParagraph) {
        const textBlocks = splitTextIntoBlocks(currentParagraph);
        textBlocks.forEach(text => {
          blocks.push({
            object: "block",
            type: "paragraph",
            paragraph: { rich_text: parseRichText(text) }
          });
        });
        currentParagraph = "";
      }
      blocks.push({
        object: "block",
        type: "heading_3",
        heading_3: { rich_text: parseRichText(trimmedLine.slice(4)) }
      });
    } else if (trimmedLine.startsWith('## ')) {
      if (currentParagraph) {
        const textBlocks = splitTextIntoBlocks(currentParagraph);
        textBlocks.forEach(text => {
          blocks.push({
            object: "block",
            type: "paragraph",
            paragraph: { rich_text: parseRichText(text) }
          });
        });
        currentParagraph = "";
      }
      blocks.push({
        object: "block",
        type: "heading_2",
        heading_2: { rich_text: parseRichText(trimmedLine.slice(3)) }
      });
    } else if (trimmedLine.startsWith('# ')) {
      if (currentParagraph) {
        const textBlocks = splitTextIntoBlocks(currentParagraph);
        textBlocks.forEach(text => {
          blocks.push({
            object: "block",
            type: "paragraph",
            paragraph: { rich_text: parseRichText(text) }
          });
        });
        currentParagraph = "";
      }
      blocks.push({
        object: "block",
        type: "heading_1",
        heading_1: { rich_text: parseRichText(trimmedLine.slice(2)) }
      });
    } else if (trimmedLine.startsWith('- ') || trimmedLine.startsWith('* ')) {
      if (currentParagraph) {
        const textBlocks = splitTextIntoBlocks(currentParagraph);
        textBlocks.forEach(text => {
          blocks.push({
            object: "block",
            type: "paragraph",
            paragraph: { rich_text: parseRichText(text) }
          });
        });
        currentParagraph = "";
      }
      blocks.push({
        object: "block",
        type: "bulleted_list_item",
        bulleted_list_item: { rich_text: parseRichText(trimmedLine.slice(2)) }
      });
    } else if (trimmedLine === '---') {
      if (currentParagraph) {
        const textBlocks = splitTextIntoBlocks(currentParagraph);
        textBlocks.forEach(text => {
          blocks.push({
            object: "block",
            type: "paragraph",
            paragraph: { rich_text: parseRichText(text) }
          });
        });
        currentParagraph = "";
      }
      blocks.push({
        object: "block",
        type: "divider",
        divider: {}
      });
    } else if (trimmedLine === '') {
      // Empty line - end current paragraph
      if (currentParagraph) {
        const textBlocks = splitTextIntoBlocks(currentParagraph);
        textBlocks.forEach(text => {
          blocks.push({
            object: "block",
            type: "paragraph",
            paragraph: { rich_text: parseRichText(text) }
          });
        });
        currentParagraph = "";
      }
    } else {
      // Regular text - accumulate into paragraph
      if (currentParagraph) {
        currentParagraph += " " + trimmedLine;
      } else {
        currentParagraph = trimmedLine;
      }
    }
  }
  
  // Handle remaining paragraph
  if (currentParagraph) {
    const textBlocks = splitTextIntoBlocks(currentParagraph);
    textBlocks.forEach(text => {
      blocks.push({
        object: "block",
        type: "paragraph",
        paragraph: { rich_text: parseRichText(text) }
      });
    });
  }
  
  return blocks;
}

function richTextToMarkdown(richTextArray) {
  if (!richTextArray || richTextArray.length === 0) return "";
  
  return richTextArray.map(rt => {
    let text = rt.plain_text || "";
    
    // Apply text formatting
    if (rt.annotations?.bold) text = `**${text}**`;
    if (rt.annotations?.italic) text = `*${text}*`;
    if (rt.annotations?.code) text = `\`${text}\``;
    if (rt.annotations?.strikethrough) text = `~~${text}~~`;
    if (rt.annotations?.underline) text = `<u>${text}</u>`;
    
    // Handle links
    if (rt.href) text = `[${text}](${rt.href})`;
    
    return text;
  }).join("");
}

function blockToText(block) {
  if (!block || !block.type) return "";
  
  switch (block.type) {
    case "paragraph":
      return richTextToMarkdown(block.paragraph?.rich_text);
      
    case "heading_1":
      return "# " + richTextToMarkdown(block.heading_1?.rich_text);
      
    case "heading_2":
      return "## " + richTextToMarkdown(block.heading_2?.rich_text);
      
    case "heading_3":
      return "### " + richTextToMarkdown(block.heading_3?.rich_text);
      
    case "bulleted_list_item":
      const bulletIndent = "  ".repeat(block.bulleted_list_item?.indent_level || 0);
      return bulletIndent + "• " + richTextToMarkdown(block.bulleted_list_item?.rich_text);
      
    case "numbered_list_item":
      const numberIndent = "  ".repeat(block.numbered_list_item?.indent_level || 0);
      return numberIndent + "1. " + richTextToMarkdown(block.numbered_list_item?.rich_text);
      
    case "code":
      const language = block.code?.language || "";
      const codeText = richTextToMarkdown(block.code?.rich_text);
      return `\`\`\`${language}\n${codeText}\n\`\`\``;
      
    case "quote":
      return "> " + richTextToMarkdown(block.quote?.rich_text);
      
    case "divider":
      return "---";
      
    case "callout":
      const emoji = block.callout?.icon?.emoji || "💡";
      return `${emoji} **${richTextToMarkdown(block.callout?.rich_text)}**`;
      
    case "toggle":
      return `<details><summary>${richTextToMarkdown(block.toggle?.rich_text)}</summary></details>`;
      
    case "to_do":
      const checked = block.to_do?.checked ? "[x]" : "[ ]";
      return `${checked} ${richTextToMarkdown(block.to_do?.rich_text)}`;
      
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
      
      const content = blocks.results
        .map(block => blockToText(block))
        .filter(text => text.trim() !== "")
        .join('\n\n');
      
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
      const blocks = args.content ? parseMarkdownToBlocks(args.content) : [];
      const BATCH_SIZE = 95; // Safe limit under 100
      
      if (blocks.length <= BATCH_SIZE) {
        // Single request for small content
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
          children: blocks,
        });

        return {
          content: [
            {
              type: "text",
              text: `Page created successfully. ID: ${response.id}`,
            },
          ],
        };
      } else {
        // Batch processing for large content
        const firstBatch = blocks.slice(0, BATCH_SIZE);
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
          children: firstBatch,
        });

        // Add remaining blocks in batches
        const remainingBlocks = blocks.slice(BATCH_SIZE);
        for (let i = 0; i < remainingBlocks.length; i += BATCH_SIZE) {
          const batch = remainingBlocks.slice(i, i + BATCH_SIZE);
          await notion.blocks.children.append({
            block_id: response.id,
            children: batch,
          });
        }

        return {
          content: [
            {
              type: "text",
              text: `Page created successfully with ${blocks.length} blocks. ID: ${response.id}`,
            },
          ],
        };
      }
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