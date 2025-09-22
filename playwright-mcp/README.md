# Playwright MCP Server

MCP server for Playwright browser automation with Claude Desktop and Claude Code.

## Features

- **Multi-browser support**: Chromium, Firefox, and WebKit
- **Page navigation**: Navigate to URLs and wait for elements
- **Content extraction**: Get text or HTML content from pages
- **Element interaction**: Click elements and fill forms
- **Screenshots**: Capture full page or element screenshots
- **Waiting utilities**: Wait for elements to appear
- **Browser management**: Efficient browser instance handling

## Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Install Playwright Browsers
```bash
npx playwright install
```

### 3. Configure Claude Code
```bash
# Add to Claude Code
claude mcp add --transport stdio playwright "node" "/path/to/playwright-mcp/server.js"

# Example with actual path
claude mcp add --transport stdio playwright "node" "/Users/tutleJ/Desktop/Repository/mcp-servers/playwright-mcp/server.js"
```

## Available Tools

### `mcp__playwright__navigate_to_page`
Navigate to a URL and get page information.

**Parameters:**
- `url` (string): The URL to navigate to
- `browser` (string, optional): Browser type - "chromium", "firefox", or "webkit" (default: chromium)
- `wait_for` (string, optional): CSS selector to wait for before returning

### `mcp__playwright__get_page_content`
Get the text content or HTML of the current page.

**Parameters:**
- `type` (string, optional): "text" or "html" (default: text)
- `selector` (string, optional): CSS selector to get content from specific element

### `mcp__playwright__click_element`
Click on an element on the page.

**Parameters:**
- `selector` (string): CSS selector of the element to click
- `timeout` (number, optional): Timeout in milliseconds (default: 30000)

### `mcp__playwright__fill_input`
Fill an input field with text.

**Parameters:**
- `selector` (string): CSS selector of the input element
- `value` (string): Text to fill in the input
- `timeout` (number, optional): Timeout in milliseconds (default: 30000)

### `mcp__playwright__take_screenshot`
Take a screenshot of the current page.

**Parameters:**
- `path` (string, optional): Path to save the screenshot (returns base64 if not provided)
- `full_page` (boolean, optional): Take screenshot of full page (default: true)

### `mcp__playwright__wait_for_element`
Wait for an element to appear on the page.

**Parameters:**
- `selector` (string): CSS selector of the element to wait for
- `timeout` (number, optional): Timeout in milliseconds (default: 30000)

### `mcp__playwright__close_browser`
Close the browser instance.

**Parameters:**
- `browser` (string, optional): Browser type to close or "all" to close all browsers

## Running the Server

```bash
npm start
```

## Example Usage

```javascript
// Navigate to a page
mcp__playwright__navigate_to_page({
  url: "https://example.com",
  browser: "chromium",
  wait_for: ".main-content"
})

// Get page content
mcp__playwright__get_page_content({
  type: "text",
  selector: ".article"
})

// Fill a form and submit
mcp__playwright__fill_input({
  selector: "#search-input",
  value: "search query"
})

mcp__playwright__click_element({
  selector: "#search-button"
})

// Take a screenshot
mcp__playwright__take_screenshot({
  path: "./screenshot.png",
  full_page: true
})
```

## Browser Management

The server efficiently manages browser instances:
- Browsers are launched on first use
- Multiple pages can share the same browser instance
- Browsers are automatically closed on server shutdown
- Manual browser closure is available via the close_browser tool

## Troubleshooting

- **Browser not found**: Run `npx playwright install` to install browser binaries
- **Timeout errors**: Increase timeout values or check element selectors
- **Navigation issues**: Ensure URLs are valid and accessible

For more details, see the main project documentation.