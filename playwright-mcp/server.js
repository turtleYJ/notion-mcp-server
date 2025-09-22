#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { 
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { chromium, firefox, webkit } from "playwright";

const server = new Server(
  {
    name: "playwright-mcp-server",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Global browser instance management
let browserInstances = new Map();

async function getBrowser(browserType = 'chromium') {
  if (!browserInstances.has(browserType)) {
    let browser;
    switch (browserType) {
      case 'firefox':
        browser = await firefox.launch({ 
          headless: false,
          slowMo: 500  // 동작을 천천히 해서 보기 쉽게
        });
        break;
      case 'webkit':
        browser = await webkit.launch({ 
          headless: false,
          slowMo: 500
        });
        break;
      default:
        browser = await chromium.launch({ 
          headless: false,
          slowMo: 500  // 0.5초씩 지연해서 동작 확인 가능
        });
    }
    browserInstances.set(browserType, browser);
  }
  return browserInstances.get(browserType);
}

async function closeBrowser(browserType) {
  if (browserInstances.has(browserType)) {
    await browserInstances.get(browserType).close();
    browserInstances.delete(browserType);
  }
}

async function closeAllBrowsers() {
  for (const [browserType, browser] of browserInstances) {
    await browser.close();
  }
  browserInstances.clear();
}

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "navigate_to_page",
        description: "Navigate to a URL and get page information",
        inputSchema: {
          type: "object",
          properties: {
            url: {
              type: "string",
              description: "The URL to navigate to",
            },
            browser: {
              type: "string",
              enum: ["chromium", "firefox", "webkit"],
              description: "Browser type to use (default: chromium)",
            },
            wait_for: {
              type: "string",
              description: "Selector to wait for before returning (optional)",
            },
          },
          required: ["url"],
        },
      },
      {
        name: "get_page_content",
        description: "Get the text content or HTML of the current page",
        inputSchema: {
          type: "object",
          properties: {
            type: {
              type: "string",
              enum: ["text", "html"],
              description: "Type of content to retrieve (default: text)",
            },
            selector: {
              type: "string",
              description: "CSS selector to get content from specific element (optional)",
            },
          },
        },
      },
      {
        name: "click_element",
        description: "Click on an element on the page",
        inputSchema: {
          type: "object",
          properties: {
            selector: {
              type: "string",
              description: "CSS selector of the element to click",
            },
            timeout: {
              type: "number",
              description: "Timeout in milliseconds (default: 30000)",
            },
          },
          required: ["selector"],
        },
      },
      {
        name: "fill_input",
        description: "Fill an input field with text",
        inputSchema: {
          type: "object",
          properties: {
            selector: {
              type: "string",
              description: "CSS selector of the input element",
            },
            value: {
              type: "string",
              description: "Text to fill in the input",
            },
            timeout: {
              type: "number",
              description: "Timeout in milliseconds (default: 30000)",
            },
          },
          required: ["selector", "value"],
        },
      },
      {
        name: "take_screenshot",
        description: "Take a screenshot of the current page",
        inputSchema: {
          type: "object",
          properties: {
            path: {
              type: "string",
              description: "Path to save the screenshot (optional, returns base64 if not provided)",
            },
            full_page: {
              type: "boolean",
              description: "Take screenshot of full page (default: true)",
            },
          },
        },
      },
      {
        name: "wait_for_element",
        description: "Wait for an element to appear on the page",
        inputSchema: {
          type: "object",
          properties: {
            selector: {
              type: "string",
              description: "CSS selector of the element to wait for",
            },
            timeout: {
              type: "number",
              description: "Timeout in milliseconds (default: 30000)",
            },
          },
          required: ["selector"],
        },
      },
      {
        name: "close_browser",
        description: "Close the browser instance",
        inputSchema: {
          type: "object",
          properties: {
            browser: {
              type: "string",
              enum: ["chromium", "firefox", "webkit", "all"],
              description: "Browser type to close or 'all' to close all browsers",
            },
          },
        },
      },
    ],
  };
});

// Current page context
let currentPage = null;
let currentBrowserType = 'chromium';

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case "navigate_to_page": {
        const browserType = args.browser || 'chromium';
        const browser = await getBrowser(browserType);
        
        if (currentPage) {
          await currentPage.close();
        }
        
        currentPage = await browser.newPage();
        currentBrowserType = browserType;
        
        await currentPage.goto(args.url);
        
        if (args.wait_for) {
          await currentPage.waitForSelector(args.wait_for, { timeout: 30000 });
        }
        
        const title = await currentPage.title();
        const url = currentPage.url();
        
        return {
          content: [
            {
              type: "text",
              text: `Successfully navigated to: ${url}\nPage title: ${title}`,
            },
          ],
        };
      }

      case "get_page_content": {
        if (!currentPage) {
          throw new Error("No page is currently open. Use navigate_to_page first.");
        }
        
        const contentType = args.type || 'text';
        let content;
        
        if (args.selector) {
          const element = await currentPage.locator(args.selector);
          content = contentType === 'html' 
            ? await element.innerHTML()
            : await element.textContent();
        } else {
          content = contentType === 'html'
            ? await currentPage.content()
            : await currentPage.textContent('body');
        }
        
        return {
          content: [
            {
              type: "text",
              text: content || "",
            },
          ],
        };
      }

      case "click_element": {
        if (!currentPage) {
          throw new Error("No page is currently open. Use navigate_to_page first.");
        }
        
        const timeout = args.timeout || 30000;
        await currentPage.click(args.selector, { timeout });
        
        return {
          content: [
            {
              type: "text",
              text: `Successfully clicked element: ${args.selector}`,
            },
          ],
        };
      }

      case "fill_input": {
        if (!currentPage) {
          throw new Error("No page is currently open. Use navigate_to_page first.");
        }
        
        const timeout = args.timeout || 30000;
        await currentPage.fill(args.selector, args.value, { timeout });
        
        return {
          content: [
            {
              type: "text",
              text: `Successfully filled input ${args.selector} with: ${args.value}`,
            },
          ],
        };
      }

      case "take_screenshot": {
        if (!currentPage) {
          throw new Error("No page is currently open. Use navigate_to_page first.");
        }
        
        const options = {
          fullPage: args.full_page !== false,
        };
        
        if (args.path) {
          options.path = args.path;
          await currentPage.screenshot(options);
          return {
            content: [
              {
                type: "text",
                text: `Screenshot saved to: ${args.path}`,
              },
            ],
          };
        } else {
          const buffer = await currentPage.screenshot(options);
          const base64 = buffer.toString('base64');
          return {
            content: [
              {
                type: "text",
                text: `Screenshot taken (base64): data:image/png;base64,${base64.substring(0, 100)}...`,
              },
            ],
          };
        }
      }

      case "wait_for_element": {
        if (!currentPage) {
          throw new Error("No page is currently open. Use navigate_to_page first.");
        }
        
        const timeout = args.timeout || 30000;
        await currentPage.waitForSelector(args.selector, { timeout });
        
        return {
          content: [
            {
              type: "text",
              text: `Element appeared: ${args.selector}`,
            },
          ],
        };
      }

      case "close_browser": {
        if (args.browser === 'all') {
          await closeAllBrowsers();
          currentPage = null;
          return {
            content: [
              {
                type: "text",
                text: "All browser instances closed",
              },
            ],
          };
        } else {
          const browserType = args.browser || currentBrowserType;
          await closeBrowser(browserType);
          if (browserType === currentBrowserType) {
            currentPage = null;
          }
          return {
            content: [
              {
                type: "text",
                text: `Browser ${browserType} closed`,
              },
            ],
          };
        }
      }

      default:
        return {
          content: [
            {
              type: "text",
              text: `Unknown tool: ${name}`,
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
});

async function run() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Playwright MCP server running on stdio");
}

// Cleanup on exit
process.on('SIGINT', async () => {
  await closeAllBrowsers();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await closeAllBrowsers();
  process.exit(0);
});

run().catch(console.error);