# MCP Servers Collection

Collection of **MCP (Model Context Protocol) servers** for **Claude Desktop** and **Claude Code** integration. This repository provides multiple specialized MCP servers for different automation and integration needs.

## Available MCP Servers

### 🔗 [Notion MCP Server](./notion-mcp/)
Connect Claude to Notion for reading and creating pages.

**Features:**
- Read Notion pages in markdown format
- Create new pages with rich content
- Support for headings, lists, code blocks, and more
- Automatic text splitting and batch processing

### 🎭 [Playwright MCP Server](./playwright-mcp/)
Browser automation and web scraping capabilities for Claude.

**Features:**
- Multi-browser support (Chromium, Firefox, WebKit)
- Page navigation and content extraction
- Element interaction (click, fill forms)
- Screenshot capture
- Wait for elements and page states

## Quick Setup

### Prerequisites
- Node.js 18+
- Claude Desktop or Claude Code

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/turtleYJ/mcp-servers.git
cd mcp-servers
```

2. **Install dependencies for all servers**
```bash
npm run install:all
```

3. **Configure Claude Code**

For Notion MCP:
```bash
claude mcp add --transport stdio notion "node" "/path/to/mcp-servers/notion-mcp/server.js" --env NOTION_TOKEN="your_token_here"
```

For Playwright MCP:
```bash
claude mcp add --transport stdio playwright "node" "/path/to/mcp-servers/playwright-mcp/server.js"
```

4. **Verify installation**
```bash
claude mcp list
```

## Individual Server Setup

Each MCP server can be set up independently. See the README files in each server directory for detailed setup instructions:

- [Notion MCP Setup](./notion-mcp/README.md)
- [Playwright MCP Setup](./playwright-mcp/README.md)

## Available Scripts

```bash
# Install dependencies for all servers
npm run install:all

# Start individual servers
npm run start:notion
npm run start:playwright
```

## Architecture

```
Claude Desktop/Code ↔ MCP Protocol (JSON-RPC/STDIO) ↔ MCP Servers ↔ External APIs
```

Each MCP server:
- Uses the standardized MCP protocol
- Runs as an independent process
- Communicates via STDIO transport
- Provides specific tools and capabilities

## Configuration Examples

### Claude Desktop Config
Add to `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "notion": {
      "command": "node",
      "args": ["/absolute/path/to/notion-mcp/server.js"],
      "env": {
        "NOTION_TOKEN": "YOUR_NOTION_TOKEN"
      }
    },
    "playwright": {
      "command": "node",
      "args": ["/absolute/path/to/playwright-mcp/server.js"]
    }
  }
}
```

### Claude Code Config
```bash
# Add multiple MCP servers
claude mcp add --transport stdio notion "node" "/path/to/notion-mcp/server.js" --env NOTION_TOKEN="token"
claude mcp add --transport stdio playwright "node" "/path/to/playwright-mcp/server.js"
```

## Available Tools

Once configured, the following tools will be available in Claude:

### Notion Tools (prefix: `mcp__notion__`)
- `mcp__notion__read_page`: Read Notion page content
- `mcp__notion__create_page`: Create new Notion pages

### Playwright Tools (prefix: `mcp__playwright__`)
- `mcp__playwright__navigate_to_page`: Navigate to URLs
- `mcp__playwright__get_page_content`: Extract page content
- `mcp__playwright__click_element`: Click page elements
- `mcp__playwright__fill_input`: Fill form inputs
- `mcp__playwright__take_screenshot`: Capture screenshots
- `mcp__playwright__wait_for_element`: Wait for elements
- `mcp__playwright__close_browser`: Close browser instances

## Development

### Project Structure
```
mcp-servers/
├── notion-mcp/           # Notion integration server
│   ├── server.js
│   ├── package.json
│   └── README.md
├── playwright-mcp/       # Browser automation server
│   ├── server.js
│   ├── package.json
│   └── README.md
├── docs/                 # Documentation
├── config/              # Configuration examples
└── package.json         # Root workspace config
```

### Adding New MCP Servers

1. Create a new directory for your server
2. Implement the MCP server using `@modelcontextprotocol/sdk`
3. Add package.json with appropriate dependencies
4. Update the root package.json workspace configuration
5. Add documentation and examples

## Troubleshooting

### Common Issues

**MCP servers not appearing in Claude:**
- Ensure correct absolute paths in configuration
- Restart Claude Desktop/Code after adding servers
- Check that Node.js is accessible from the command line

**Permission errors:**
- Verify file permissions for server scripts
- Ensure environment variables are properly set

**Server crashes:**
- Check individual server logs
- Verify all dependencies are installed
- Test servers independently using `npm start`

### Debugging

**Server Logs (macOS):**
```bash
tail -f ~/Library/Logs/Claude/mcp-server-notion.log
tail -f ~/Library/Logs/Claude/mcp-server-playwright.log
tail -f ~/Library/Logs/Claude/mcp.log
```

**Test Individual Servers:**
```bash
cd notion-mcp && npm start
cd playwright-mcp && npm start
```

## Contributing

Contributions are welcome! Please feel free to:
- Report bugs and issues
- Suggest new MCP server ideas
- Submit pull requests with improvements
- Add documentation and examples

## License

MIT

## Documentation

- [Claude Code Guide](./docs/CLAUDE_CODE_GUIDE.md)
- [Individual Server READMEs](./notion-mcp/README.md)

---

**Made with ❤️ for Claude Code and Claude Desktop users**