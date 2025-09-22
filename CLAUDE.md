# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a collection of **MCP (Model Context Protocol) servers** that connect Claude Desktop and Claude Code to various external services via standardized protocols. The servers act as bridges, translating Claude's natural language requests into API calls.

**Key Architecture Pattern:**
```
Claude Desktop/Code ↔ MCP Protocol (JSON-RPC/STDIO) ↔ MCP Servers ↔ External APIs
```

### Available MCP Servers

1. **Notion MCP Server** (`notion-mcp/`): Notion integration for reading and creating pages
2. **Playwright MCP Server** (`playwright-mcp/`): Browser automation and web scraping

### Project Status ✅

**Successfully Implemented and Tested:**
- ✅ Multi-server MCP architecture with workspace configuration
- ✅ Notion MCP Server: Full CRUD operations with rich text and batch processing
- ✅ Playwright MCP Server: Headful browser automation with visual debugging
- ✅ Claude Code integration with all 9 MCP tools (2 Notion + 7 Playwright)
- ✅ Real-time browser interaction with slowMo visualization
- ✅ Multi-browser support (Chromium, Firefox, WebKit)
- ✅ Comprehensive documentation with usage guides and troubleshooting

**Latest Update:** 2025-09-22 - Successfully tested headful mode browser automation with visual confirmation

### Claude Code Integration

Claude Code fully supports MCP tools. To add the MCP servers to Claude Code:

#### Notion MCP Server
```bash
# Add Notion MCP server to Claude Code
claude mcp add --transport stdio notion "node" "/path/to/mcp-servers/notion-mcp/server.js" --env NOTION_TOKEN="your_token_here"

# Example with actual project path
claude mcp add --transport stdio notion "node" "/Users/tutleJ/Desktop/Repository/notion-mcp-server/notion-mcp/server.js" --env NOTION_TOKEN="ntn_your_actual_token_here"
```

#### Playwright MCP Server
```bash
# Add Playwright MCP server to Claude Code
claude mcp add --transport stdio playwright "node" "/path/to/mcp-servers/playwright-mcp/server.js"

# Example with actual project path
claude mcp add --transport stdio playwright "node" "/Users/tutleJ/Desktop/Repository/notion-mcp-server/playwright-mcp/server.js"
```

#### Verification and Management
```bash
# Verify installation
claude mcp list

# Remove servers if needed
claude mcp remove notion
claude mcp remove playwright
```

#### Available Tools

**Notion Tools (prefix: `mcp__notion__`):**
- `mcp__notion__read_page`: Read Notion page content
- `mcp__notion__create_page`: Create new Notion pages

**Playwright Tools (prefix: `mcp__playwright__`):**
- `mcp__playwright__navigate_to_page`: Navigate to URLs
- `mcp__playwright__get_page_content`: Extract page content
- `mcp__playwright__click_element`: Click page elements
- `mcp__playwright__fill_input`: Fill form inputs
- `mcp__playwright__take_screenshot`: Capture screenshots
- `mcp__playwright__wait_for_element`: Wait for elements
- `mcp__playwright__close_browser`: Close browser instances

**Important Notes:**
- Claude Code requires a session restart after adding MCP servers for the tools to become available
- When updating NOTION_TOKEN, remove the existing server first, then re-add with new token
- Ensure the absolute path to server.js is correct for your system
- Playwright requires browser binaries: run `npx playwright install` in the playwright-mcp directory
- **Playwright Visual Mode**: The server runs in headful mode with `slowMo: 500ms` for visual debugging
- **Server Updates**: When modifying server code, remove and re-add the MCP server, then restart Claude Code session

## Core Commands

### Running Individual Servers

#### Notion MCP Server
```bash
cd notion-mcp
npm start                    # Start the Notion MCP server
node server.js              # Direct execution

# Test with environment variable
NOTION_TOKEN=your_token node server.js
```

#### Playwright MCP Server
```bash
cd playwright-mcp
npm start                    # Start the Playwright MCP server
node server.js              # Direct execution

# Install browser binaries
npx playwright install

# Test headful mode directly (browser window will appear)
node -e "
import('playwright').then(async ({chromium}) => {
  const browser = await chromium.launch({headless: false, slowMo: 500});
  const page = await browser.newPage();
  await page.goto('https://example.com');
  setTimeout(() => browser.close(), 5000);
});"
```

**Headful Mode Configuration:**
- **Default Mode**: `headless: false` - Browser windows are visible
- **Slow Motion**: `slowMo: 500` - 500ms delay between actions for better visualization
- **Visual Debugging**: Watch browser automation in real-time

### Project-wide Development
```bash
# Install all dependencies
npm run install:all

# Start individual servers
npm run start:notion
npm run start:playwright
```

## Architecture

### Multi-Server Design
Each MCP server is contained in its own directory with dedicated functionality:

#### Notion MCP Server (`notion-mcp/server.js`)
1. **MCP Server Setup**: Uses `@modelcontextprotocol/sdk` v0.4.0
2. **Notion Client**: Uses `@notionhq/client` v4.0.0 
3. **STDIO Transport**: Communication via standard input/output
4. **Tool Handlers**: Two main tools (`read_page`, `create_page`)

#### Playwright MCP Server (`playwright-mcp/server.js`)
1. **MCP Server Setup**: Uses `@modelcontextprotocol/sdk` v0.4.0
2. **Playwright Integration**: Uses `playwright` v1.40.0 with multi-browser support
3. **STDIO Transport**: Communication via standard input/output
4. **Browser Management**: Efficient browser instance handling with automatic cleanup
5. **Tool Handlers**: Seven main tools for browser automation

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
      "args": ["/absolute/path/to/notion-mcp/server.js"],
      "env": {
        "NOTION_TOKEN": "YOUR_TOKEN_HERE"
      }
    },
    "playwright": {
      "command": "node",
      "args": ["/absolute/path/to/playwright-mcp/server.js"]
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
tail -f ~/Library/Logs/Claude/mcp-server-playwright.log
tail -f ~/Library/Logs/Claude/mcp.log
```

**Process Verification:**
```bash
ps aux | grep "notion-mcp-server"
ps aux | grep "playwright-mcp-server"
```

**Playwright Browser Testing:**
```bash
# Test if browser window appears (should open visible Chrome for 5 seconds)
cd playwright-mcp
node -e "
import('playwright').then(async ({chromium}) => {
  const browser = await chromium.launch({headless: false, slowMo: 500});
  const page = await browser.newPage();
  await page.goto('https://example.com');
  setTimeout(() => browser.close(), 5000);
});"
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

## Playwright MCP Specifics

### Browser Configuration
**Headful Mode**: `headless: false` - Browser windows are visible for debugging
**Slow Motion**: `slowMo: 500` - 500ms delay between actions for visualization
**Multi-browser**: Supports Chromium, Firefox, and WebKit

### Common Playwright Issues

#### Issue 1: Browser Window Not Appearing
**Symptom:** Browser automation works but no window is visible

**Solutions:**
1. **Session Restart Required:**
   ```bash
   claude mcp remove playwright
   claude mcp add --transport stdio playwright "node" "/path/to/playwright-mcp/server.js"
   # Exit and restart Claude Code session
   ```

2. **Test Browser Directly:**
   ```bash
   cd playwright-mcp
   node -e "
   import('playwright').then(async ({chromium}) => {
     const browser = await chromium.launch({headless: false, slowMo: 500});
     const page = await browser.newPage();
     await page.goto('https://example.com');
     setTimeout(() => browser.close(), 5000);
   });"
   ```

3. **Check macOS Permissions:**
   - System Preferences → Privacy & Security → Screen Recording
   - Allow Terminal/Claude Code if prompted

#### Issue 2: Element Not Found
**Symptom:** `Error: Element not found: selector`

**Solutions:**
- Use `wait_for_element` before interacting with elements
- Increase timeout: `--timeout 30000`
- Use more specific CSS selectors
- Check if page is fully loaded

#### Issue 3: Server Code Changes Not Applied
**Symptom:** Modified server behavior doesn't take effect

**Solutions:**
1. Remove and re-add MCP server
2. Restart Claude Code session completely
3. Verify code changes in `playwright-mcp/server.js`

### Browser Management
- **Instance Reuse**: Same browser type instances are reused for efficiency
- **Memory Management**: Use `close_browser` tool to free resources
- **Multi-browser Testing**: Switch between browsers for compatibility testing

### Performance Tips
- Use `slowMo: 500` for debugging, remove for production speed
- Close unused browser instances to save memory
- Prefer specific selectors over complex DOM traversal