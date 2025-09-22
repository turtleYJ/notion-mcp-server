# Playwright MCP 서버 구축 가이드

이 문서는 Playwright MCP 서버를 처음부터 구축하는 과정을 단계별로 설명합니다.

## 목차

1. [프로젝트 개요](#프로젝트-개요)
2. [구축 과정](#구축-과정)
3. [서버 구현](#서버-구현)
4. [테스트 및 검증](#테스트-및-검증)
5. [Claude Code 통합](#claude-code-통합)
6. [문제 해결](#문제-해결)

## 프로젝트 개요

### 목표
- Claude Desktop/Code에서 브라우저 자동화 기능 제공
- 웹 스크래핑, UI 테스트, 모니터링 등 다양한 용도로 활용
- 다중 브라우저 지원 (Chromium, Firefox, WebKit)

### 기술 스택
- **MCP SDK**: `@modelcontextprotocol/sdk` v0.4.0
- **브라우저 자동화**: `playwright` v1.40.0
- **통신 방식**: STDIO transport
- **Node.js**: v18+ 

## 구축 과정

### 1. 프로젝트 구조 설정

기존 Notion MCP 프로젝트를 다중 서버 구조로 리팩토링:

```bash
# 1. 새로운 구조 생성
mkdir playwright-mcp
mkdir notion-mcp

# 2. 기존 파일 이동
mv server.js notion-mcp/

# 3. 각 서버별 package.json 생성
# notion-mcp/package.json
# playwright-mcp/package.json

# 4. 루트 package.json을 워크스페이스로 변경
```

**최종 프로젝트 구조:**
```
mcp-servers/
├── notion-mcp/              # 기존 Notion MCP 서버
│   ├── server.js
│   ├── package.json
│   └── README.md
├── playwright-mcp/          # 새로운 Playwright MCP 서버
│   ├── server.js
│   ├── package.json
│   └── README.md
├── docs/                    # 문서
├── config/                  # 설정 예제
├── package.json            # 루트 워크스페이스 설정
└── README.md               # 통합 문서
```

### 2. Playwright MCP 서버 패키지 설정

`playwright-mcp/package.json` 생성:

```json
{
  "name": "playwright-mcp-server",
  "version": "1.0.0",
  "description": "MCP server for Playwright browser automation with Claude",
  "main": "server.js",
  "type": "module",
  "scripts": {
    "start": "node server.js",
    "test": "echo \"Error: no test specified\" && exit 1"
  },
  "keywords": [
    "mcp",
    "playwright",
    "browser",
    "automation",
    "claude",
    "ai"
  ],
  "author": "turtleYJ",
  "license": "MIT",
  "dependencies": {
    "@modelcontextprotocol/sdk": "^0.4.0",
    "playwright": "^1.40.0"
  }
}
```

### 3. 의존성 설치

```bash
# Playwright MCP 의존성 설치
cd playwright-mcp
npm install

# Playwright 브라우저 바이너리 설치
npx playwright install

# 설치 확인
npx playwright --version
```

**설치되는 브라우저:**
- Chromium (약 136MB)
- Firefox (약 96MB) 
- WebKit (약 74MB)
- FFMPEG (약 1.3MB)

## 서버 구현

### 1. 기본 서버 구조

`playwright-mcp/server.js`의 핵심 구조:

```javascript
#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { 
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { chromium, firefox, webkit } from "playwright";

// MCP 서버 초기화
const server = new Server({
  name: "playwright-mcp-server",
  version: "1.0.0",
}, {
  capabilities: { tools: {} },
});
```

### 2. 브라우저 인스턴스 관리

효율적인 브라우저 관리를 위한 전역 인스턴스 시스템:

```javascript
// 전역 브라우저 인스턴스 관리
let browserInstances = new Map();
let currentPage = null;
let currentBrowserType = 'chromium';

async function getBrowser(browserType = 'chromium') {
  if (!browserInstances.has(browserType)) {
    let browser;
    switch (browserType) {
      case 'firefox':
        browser = await firefox.launch({ headless: true });
        break;
      case 'webkit':
        browser = await webkit.launch({ headless: true });
        break;
      default:
        browser = await chromium.launch({ headless: true });
    }
    browserInstances.set(browserType, browser);
  }
  return browserInstances.get(browserType);
}
```

### 3. 도구 정의

`ListToolsRequestSchema` 핸들러에서 7개의 도구 정의:

```javascript
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "navigate_to_page",
        description: "Navigate to a URL and get page information",
        inputSchema: {
          type: "object",
          properties: {
            url: { type: "string", description: "The URL to navigate to" },
            browser: { 
              type: "string", 
              enum: ["chromium", "firefox", "webkit"],
              description: "Browser type to use (default: chromium)" 
            },
            wait_for: { 
              type: "string", 
              description: "Selector to wait for before returning (optional)" 
            }
          },
          required: ["url"]
        }
      },
      // ... 나머지 6개 도구 정의
    ]
  };
});
```

### 4. 도구 구현

각 도구의 핵심 구현 로직:

#### navigate_to_page
```javascript
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
    content: [{
      type: "text",
      text: `Successfully navigated to: ${url}\nPage title: ${title}`
    }]
  };
}
```

#### get_page_content
```javascript
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
    content: [{
      type: "text",
      text: content || ""
    }]
  };
}
```

### 5. 정리 및 에러 처리

```javascript
// 프로세스 종료 시 브라우저 정리
process.on('SIGINT', async () => {
  await closeAllBrowsers();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await closeAllBrowsers();
  process.exit(0);
});

// 에러 처리
try {
  // 도구 실행 로직
} catch (error) {
  return {
    content: [{
      type: "text",
      text: `Error: ${error.message}`
    }]
  };
}
```

## 테스트 및 검증

### 1. 서버 단독 테스트

```bash
# 서버 시작 테스트
cd playwright-mcp
node server.js

# 출력 확인:
# Playwright MCP server running on stdio
```

### 2. 브라우저 바이너리 확인

```bash
# 설치된 브라우저 확인
npx playwright --version

# 브라우저 경로 확인
ls ~/Library/Caches/ms-playwright/
```

### 3. 의존성 검증

```bash
# package.json 확인
cat package.json

# node_modules 확인
ls node_modules/@modelcontextprotocol/
ls node_modules/playwright/
```

## Claude Code 통합

### 1. MCP 서버 등록

```bash
# Playwright MCP 서버 추가
claude mcp add --transport stdio playwright "node" "/Users/tutleJ/Desktop/Repository/notion-mcp-server/playwright-mcp/server.js"

# 등록 확인
claude mcp list
```

### 2. 새 세션에서 테스트

```bash
# Claude Code 재시작
exit
claude

# 도구 사용 테스트
"example.com으로 이동해서 페이지 제목을 알려줘"
```

### 3. 동작 확인

등록 성공 시 다음 도구들이 사용 가능:
- `mcp__playwright__navigate_to_page`
- `mcp__playwright__get_page_content`
- `mcp__playwright__click_element`
- `mcp__playwright__fill_input`
- `mcp__playwright__take_screenshot`
- `mcp__playwright__wait_for_element`
- `mcp__playwright__close_browser`

## 문제 해결

### 1. 브라우저 바이너리 문제

**증상:** "Browser executable not found"
```bash
# 해결: 브라우저 재설치
npx playwright install

# 특정 브라우저만 설치
npx playwright install chromium
```

### 2. 권한 문제

**증상:** "Permission denied"
```bash
# 해결: 실행 권한 부여
chmod +x server.js

# 디렉토리 권한 확인
ls -la
```

### 3. 메모리 부족

**증상:** 브라우저 실행 시 메모리 오류
```bash
# 해결: 브라우저 인스턴스 정리
mcp__playwright__close_browser --browser "all"

# 시스템 리소스 확인
top -o MEM
```

### 4. 네트워크 문제

**증상:** 페이지 로딩 실패
```bash
# 해결: 타임아웃 증가
mcp__playwright__navigate_to_page --url "https://slow-site.com" --wait_for ".content"

# 네트워크 연결 확인
ping google.com
```

### 5. MCP 도구 인식 안됨

**증상:** 도구를 찾을 수 없다는 오류

**해결:**
1. Claude Code 세션 재시작
2. MCP 서버 경로 확인
3. 서버 로그 확인

```bash
# 서버 경로 확인
claude mcp list

# 서버 로그 확인 (macOS)
tail -f ~/Library/Logs/Claude/mcp-server-playwright.log
```

## 성능 최적화

### 1. 브라우저 재사용

- 동일한 브라우저 타입의 인스턴스 재사용
- 페이지만 새로 생성하여 오버헤드 최소화

### 2. 메모리 관리

- 작업 완료 후 명시적 브라우저 종료
- 장시간 사용 시 주기적 인스턴스 정리

### 3. 네트워크 최적화

- 적절한 타임아웃 설정
- 필요한 리소스만 로딩하도록 설정

## 확장 가능성

### 1. 추가 기능 구상

- 모바일 브라우저 에뮬레이션
- 파일 다운로드/업로드
- 쿠키 및 세션 관리
- 네트워크 인터셉션

### 2. 다른 MCP 서버와의 연동

- Notion MCP와 함께 사용하여 웹 데이터를 Notion에 저장
- 이메일 MCP와 연동하여 모니터링 결과 알림

### 3. CI/CD 통합

- GitHub Actions에서 UI 테스트 자동화
- 정기적 웹사이트 모니터링

---

이 가이드를 통해 Playwright MCP 서버의 전체 구축 과정을 이해하고, 유사한 MCP 서버를 개발할 때 참고할 수 있습니다.