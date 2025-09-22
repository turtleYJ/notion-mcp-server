# Notion MCP Server

MCP server for Notion integration with Claude Desktop and Claude Code.

## Features

- **Read Notion pages**: Extract content from Notion pages in markdown format
- **Create Notion pages**: Create new pages with rich content and formatting
- **Rich text support**: Bold text, headings, lists, code blocks, quotes, and more
- **Batch processing**: Handle large documents with automatic text splitting

## Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Get Notion Integration Token
1. Go to [Notion Integrations](https://www.notion.so/my-integrations)
2. Create a new integration
3. Copy the integration token

### 3. Configure Claude Code
```bash
# Add to Claude Code
claude mcp add --transport stdio notion "node" "/path/to/notion-mcp/server.js" --env NOTION_TOKEN="your_token_here"

# Example with actual path
claude mcp add --transport stdio notion "node" "/Users/tutleJ/Desktop/Repository/mcp-servers/notion-mcp/server.js" --env NOTION_TOKEN="ntn_your_actual_token_here"
```

### 4. Share Pages with Integration
For each Notion page you want to access:
1. Open the page in Notion
2. Click "Share" → "Add people, emails, groups, or integrations"
3. Select your integration and grant access

## Available Tools

### `mcp__notion__read_page`
Read content from a Notion page.

**Parameters:**
- `page_id` (string): The Notion page ID

### `mcp__notion__create_page`
Create a new Notion page.

**Parameters:**
- `parent_id` (string): Parent page ID where the new page will be created
- `title` (string): Page title
- `content` (string, optional): Page content in markdown format

## Running the Server

```bash
npm start
```

## Troubleshooting

- **Page not found**: Ensure the Notion integration is shared with the target page
- **Invalid token**: Check that your NOTION_TOKEN is correct and active
- **Large content**: The server automatically handles text splitting and batch processing

For more details, see the main project documentation.