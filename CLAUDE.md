# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **MCP (Model Context Protocol) server** that connects Claude Desktop to Notion via a standardized protocol. The server acts as a bridge, translating Claude's natural language requests into Notion API calls.

**Key Architecture Pattern:**
```
Claude Desktop ↔ MCP Protocol (JSON-RPC/STDIO) ↔ MCP Server ↔ Notion API
```

## Core Commands

### Running the Server
```bash
npm start                    # Start the MCP server
node server.js              # Direct execution
```

### Development
```bash
npm install                  # Install dependencies
npm test                     # Run tests (currently not implemented)
```

### Testing the Server
```bash
# Test with environment variable
NOTION_TOKEN=your_token node server.js

# Verify environment variable
echo $NOTION_TOKEN
```

## Architecture

### Single-File Design
The entire server logic is contained in `server.js` (197 lines), implementing:

1. **MCP Server Setup**: Uses `@modelcontextprotocol/sdk` v0.4.0
2. **Notion Client**: Uses `@notionhq/client` v4.0.0 
3. **STDIO Transport**: Communication via standard input/output
4. **Tool Handlers**: Two main tools (`read_page`, `create_page`)

### Key Components

**MCP Protocol Handlers:**
- `ListToolsRequestSchema`: Returns available tools to Claude Desktop
- `CallToolRequestSchema`: Executes tool calls with parameters

**Notion Integration:**
- `notion.pages.retrieve()`: Get page metadata
- `notion.blocks.children.list()`: Get page content blocks
- `notion.pages.create()`: Create new pages

**Block Processing:**
- `blockToText()`: Converts Notion blocks to markdown-style text
- Supports: paragraph, heading_1/2/3, bulleted_list_item, numbered_list_item

### Configuration Requirements

**Environment Variables:**
- `NOTION_TOKEN`: Required for Notion API authentication

**Claude Desktop Config:**
Located at `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS):
```json
{
  "mcpServers": {
    "notion": {
      "command": "node",
      "args": ["/absolute/path/to/server.js"],
      "env": {
        "NOTION_TOKEN": "YOUR_TOKEN_HERE"
      }
    }
  }
}
```

### Error Handling Strategy
- All API calls wrapped in try-catch blocks
- Consistent error response format: `{content: [{type: "text", text: "Error: ..."}]}`
- Environment variable validation via process.env

### Security Implementation
- Token management through environment variables only
- No token exposure in logs or error messages
- Notion Integration permissions must be manually configured per page

## Adding New Tools

To extend functionality:

1. **Add tool definition** in `ListToolsRequestSchema` handler
2. **Implement tool logic** in `CallToolRequestSchema` handler  
3. **Follow existing patterns** for error handling and response format

Example tool structure:
```javascript
{
  name: "tool_name",
  description: "Tool description",
  inputSchema: {
    type: "object",
    properties: { /* parameters */ },
    required: [/* required params */]
  }
}
```

## Debugging

**Server Logs (macOS):**
```bash
tail -f ~/Library/Logs/Claude/mcp-server-notion.log
tail -f ~/Library/Logs/Claude/mcp.log
```

**Process Verification:**
```bash
ps aux | grep "notion-mcp-server"
```

## Common Issues and Solutions

### Issue 1: Text Length Limit (2000 characters)
**Symptom:**
```
Error: body failed validation: body.children[0].paragraph.rich_text[0].text.content.length should be ≤ `2000`, instead was `3094`
```

**Solution:** Implemented `splitTextIntoBlocks()` function that:
- Splits long text into chunks of 1900 characters (safe margin)
- Finds safe split points: line breaks → sentence ends → word boundaries → force split
- Automatically filters empty blocks

### Issue 2: Block Count Limit (100 blocks)
**Symptom:**
```
Error: body failed validation: body.children.length should be ≤ `100`, instead was `109`
```

**Solution:** Implemented batch processing in `create_page`:
- First batch: Create page with initial 95 blocks using `notion.pages.create()`
- Remaining batches: Add blocks using `notion.blocks.children.append()` in 95-block chunks
- Provides feedback on total blocks created

### Issue 3: Markdown Formatting Not Applied
**Symptom:** Bold text (`**text**`) appears as literal text instead of formatted text

**Solution:** Implemented `parseRichText()` function that:
- Uses regex `/\*\*(.*?)\*\*/g` to detect bold markdown
- Converts to Notion's rich_text format with `annotations: { bold: true }`
- Maintains text before/after bold formatting
- Applied to all block types (headings, paragraphs, lists)

### Issue 4: Limited Block Type Support
**Solution:** Enhanced `blockToText()` and `parseMarkdownToBlocks()` to support:
- Code blocks with language syntax highlighting
- Quote blocks (`> text`)
- Dividers (`---`)
- Callouts with emoji support
- Toggle/collapsible sections
- Todo items with checkboxes
- Nested lists with proper indentation

## Advanced Troubleshooting

**Large Document Processing:**
- Documents with 100+ blocks are automatically processed in batches
- Each batch is limited to 95 blocks for API safety
- Success message indicates total blocks created

**Rich Text Debugging:**
- Bold formatting: `**text**` → `{annotations: {bold: true}}`
- Mixed formatting within single paragraph is supported
- Empty rich_text arrays are handled gracefully

**Performance Considerations:**
- Batch API calls may take longer for large documents
- Each additional batch adds ~1-2 seconds processing time
- Consider breaking very large documents into multiple pages

## Notion API Specifics

**Page ID Format:** 32-character alphanumeric string
**Rich Text Processing:** Uses proper annotations structure for formatting
**Block Types:** Extended support for 10+ block types with proper formatting
**Permissions:** Notion Integration must be connected to each target page manually
**API Limits:** 
- 2000 characters per rich_text content
- 100 blocks per single API request
- Rate limiting may apply for rapid successive calls