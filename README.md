# Notion MCP Server

Claude Desktop과 Notion을 연결하는 MCP (Model Context Protocol) 서버입니다.

## 🎯 기능

- **read_page**: Notion 페이지 내용 읽기 (확장된 마크다운 포맷 지원)
- **create_page**: 새 Notion 페이지 생성 (대용량 문서 & 마크다운 서식 지원)

## 📋 요구사항

- Node.js 18+
- Notion Integration Token
- Claude Desktop

## 🚀 빠른 시작

### 1. 저장소 클론 및 의존성 설치

```bash
git clone https://github.com/your-username/notion-mcp-server.git
cd notion-mcp-server
npm install
```

### 2. Notion Integration 설정

1. [Notion Developer Console](https://www.notion.so/my-integrations) 접속
2. "New integration" 클릭
3. 기본 정보 입력:
   - **Name**: "Claude MCP Integration"
   - **Associated workspace**: 본인 워크스페이스
   - **Type**: Internal
4. "Submit" 클릭 후 Integration Token 복사
5. 연결할 페이지에서 "..." → "Add connections" → Integration 선택

### 3. Claude Desktop 설정

Claude Desktop 설정 파일을 편집합니다:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows**: `%APPDATA%/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "notion": {
      "command": "node",
      "args": ["/absolute/path/to/your/notion-mcp-server/server.js"],
      "env": {
        "NOTION_TOKEN": "YOUR_NOTION_TOKEN_HERE"
      }
    }
  }
}
```

또는 `config/claude_desktop_config.example.json` 파일을 참고하여 설정하세요.

### 4. Claude Desktop 재시작

Claude Desktop을 완전히 종료하고 다시 시작하면 MCP 도구가 연결됩니다.

## 🔧 사용법

Claude Desktop에서 다음과 같이 요청할 수 있습니다:

### 페이지 읽기
```
"페이지 ID 12345의 내용을 읽어줘"
```

### 페이지 생성
```
"부모 페이지 12345에 '새 프로젝트 계획'이라는 제목으로 페이지를 만들어줘"
```

## 📚 작동 원리

### MCP (Model Context Protocol)

MCP는 AI 모델과 외부 도구 간의 표준화된 통신 프로토콜입니다.

```
┌─────────────────┐    MCP Protocol    ┌─────────────────┐
│   Claude        │ ◄─────────────────► │   MCP Server    │
│   Desktop       │     (JSON-RPC)     │   (Notion)      │
└─────────────────┘                    └─────────────────┘
                                               │
                                               ▼
                                       ┌─────────────────┐
                                       │   Notion API    │
                                       └─────────────────┘
```

### 통신 플로우

1. **Initialization**: Claude Desktop이 MCP 서버에 연결
2. **Capability Exchange**: 서버가 제공하는 도구 목록 교환
3. **Tool Invocation**: Claude가 도구 호출 요청
4. **Response**: 서버가 결과 반환

### 프로토콜 메시지

**도구 목록 요청:**
```json
{
  "method": "tools/list",
  "params": {},
  "jsonrpc": "2.0",
  "id": 1
}
```

**도구 호출 요청:**
```json
{
  "method": "tools/call",
  "params": {
    "name": "read_page",
    "arguments": {
      "page_id": "12345"
    }
  },
  "jsonrpc": "2.0",
  "id": 2
}
```

## 🔧 트러블슈팅

### 문제 1: MCP SDK 호환성 오류

**증상:**
```
TypeError: Cannot read properties of undefined (reading 'method')
```

**해결책:**
1. `@modelcontextprotocol/sdk` 버전을 0.4.0으로 고정
2. `CallToolRequestSchema`, `ListToolsRequestSchema` import 확인
3. 의존성 재설치: `npm install`

### 문제 2: 서버 연결 실패

**증상:** "Server disconnected" 로그 메시지

**진단 명령어:**
```bash
# 서버 프로세스 확인
ps aux | grep "notion-mcp-server"

# 로그 확인 (macOS)
tail -f ~/Library/Logs/Claude/mcp-server-notion.log
```

**해결책:**
1. Node.js 버전 확인 (v18+ 권장)
2. 파일 절대 경로 확인
3. 실행 권한 설정: `chmod +x server.js`
4. 환경 변수 설정 확인

### 문제 3: Notion API 오류

**증상:** "Error: API request failed"

**해결책:**
1. `NOTION_TOKEN` 재확인
2. Integration 권한이 페이지에 연결되었는지 확인
3. 페이지 ID 형식 확인 (32자리 영숫자)

### 문제 4: 텍스트 길이 제한 (2000자)

**증상:**
```
Error: body failed validation: body.children[0].paragraph.rich_text[0].text.content.length should be ≤ `2000`, instead was `3094`
```

**해결책:** ✅ **자동 해결됨**
- 긴 텍스트를 1900자 단위로 자동 분할
- 안전한 분할점 자동 탐지 (줄바꿈, 문장 끝, 단어 경계)

### 문제 5: 블록 수 제한 (100개)

**증상:**
```
Error: body failed validation: body.children.length should be ≤ `100`, instead was `109`
```

**해결책:** ✅ **자동 해결됨**
- 대용량 문서를 95개 블록씩 배치 처리
- 첫 배치로 페이지 생성 후 나머지 블록 추가
- 총 블록 수 피드백 제공

### 문제 6: 마크다운 서식 미적용

**증상:** `**볼드**` 텍스트가 그대로 표시됨

**해결책:** ✅ **자동 해결됨**
- 볼드 마크다운(`**text**`)을 Notion 서식으로 자동 변환
- Rich Text annotations 적용
- 모든 블록 타입에서 서식 지원

### 디버깅 팁

**로그 모니터링:**
```bash
# macOS
tail -f ~/Library/Logs/Claude/mcp-server-notion.log ~/Library/Logs/Claude/mcp.log
```

**직접 서버 테스트:**
```bash
# 서버 직접 실행
NOTION_TOKEN=your_token node server.js

# 환경 변수 확인
echo $NOTION_TOKEN
```

**성능 최적화:**
- 대용량 문서는 배치 처리로 인해 추가 시간 소요 (배치당 1-2초)
- 매우 큰 문서는 여러 페이지로 분할 권장

## 🔒 보안 고려사항

### 토큰 관리
- **절대 Git에 토큰 커밋 금지**: `.env` 파일은 `.gitignore`에 포함
- **환경 변수 사용**: Claude Desktop 설정에서 토큰을 환경 변수로 설정
- **토큰 주기적 갱신**: 보안을 위해 정기적으로 토큰 재생성
- **`.env.example` 활용**: 실제 토큰 없이 설정 템플릿 제공

### 권한 제어
- **최소 권한 원칙**: Notion Integration에 필요한 최소한의 권한만 부여
- **페이지별 권한**: 필요한 페이지에만 Integration 연결
- **정기적 권한 검토**: 사용하지 않는 Integration 정리

### 개발 환경 보안
```bash
# 로컬 개발 시 .env 파일 사용
cp .env.example .env
# .env 파일에 실제 토큰 입력 (Git에 추가되지 않음)
```

### 에러 처리
- **민감 정보 로깅 방지**: 토큰이나 개인정보가 로그에 노출되지 않도록 처리
- **적절한 로깅 수준**: 디버깅 정보와 보안 정보 구분
- **사용자 친화적 오류 메시지**: 내부 구현 세부사항 노출 방지

## 🔧 개발

### 프로젝트 구조

```
notion-mcp-server/
├── server.js           # MCP 서버 메인 파일
├── package.json        # 프로젝트 설정 및 의존성
├── package-lock.json   # 의존성 잠금 파일
└── README.md          # 프로젝트 문서
```

### 코드 구조

**server.js**의 주요 구성 요소:

1. **Import 및 초기화**
   ```javascript
   import { Server } from "@modelcontextprotocol/sdk/server/index.js";
   import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
   import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
   import { Client } from "@notionhq/client";
   ```

2. **핵심 유틸리티 함수들**
   ```javascript
   function splitTextIntoBlocks(content, maxLength = 1900)  // 텍스트 분할
   function parseRichText(text)                             // 마크다운 → Rich Text 변환
   function parseMarkdownToBlocks(content)                  // 마크다운 → Notion 블록 변환
   function richTextToMarkdown(richTextArray)              // Rich Text → 마크다운 변환
   function blockToText(block)                              // Notion 블록 → 텍스트 변환
   ```

3. **Notion Client 설정**
   ```javascript
   const notion = new Client({
     auth: process.env.NOTION_TOKEN,
   });
   ```

4. **MCP Server 초기화**
   ```javascript
   const server = new Server({
     name: "notion-mcp-server",
     version: "1.0.0",
   }, {
     capabilities: { tools: {} },
   });
   ```

5. **도구 목록 핸들러**
   ```javascript
   server.setRequestHandler(ListToolsRequestSchema, async () => {
     return { tools: [/* 도구 정의 */] };
   });
   ```

6. **도구 호출 핸들러 (배치 처리 지원)**
   ```javascript
   server.setRequestHandler(CallToolRequestSchema, async (request) => {
     // read_page: 확장된 블록 타입 지원
     // create_page: 대용량 문서 배치 처리
   });
   ```

7. **STDIO 통신 설정**
   ```javascript
   async function run() {
     const transport = new StdioServerTransport();
     await server.connect(transport);
   }
   ```

### 지원하는 Notion 블록 타입

현재 다음 블록 타입을 지원합니다:

#### 읽기 지원 (read_page)
- `paragraph`: 일반 텍스트 (볼드, 이탤릭, 코드, 취소선, 밑줄, 링크 서식 포함)
- `heading_1/2/3`: 제목 (# ## ### 형태로 변환)
- `bulleted_list_item`: 불릿 리스트 (• 형태, 중첩 지원)
- `numbered_list_item`: 번호 리스트 (1. 형태, 중첩 지원)
- `code`: 코드 블록 (언어별 구문 강조)
- `quote`: 인용구 (> 형태)
- `divider`: 구분선 (---)
- `callout`: 콜아웃 (이모지 + 강조 텍스트)
- `toggle`: 접기/펼치기 섹션
- `to_do`: 체크박스 항목

#### 생성 지원 (create_page)
- **마크다운 파싱**: `# ## ###` (제목), `- *` (불릿 리스트), `---` (구분선)
- **텍스트 서식**: `**볼드**` 자동 변환
- **대용량 문서**: 100개 이상 블록 자동 배치 처리
- **긴 텍스트**: 2000자 이상 자동 분할 처리

## 🚀 확장 가능성

MCP 프로토콜을 통해 다양한 서비스와 연동할 수 있습니다:

### 데이터베이스
- PostgreSQL, MongoDB
- Redis, Elasticsearch

### 클라우드 서비스
- AWS (S3, Lambda, DynamoDB)
- GCP (BigQuery, Cloud Storage)
- Azure (Cosmos DB, Functions)

### 개발 도구
- GitHub (이슈, PR 관리)
- GitLab (CI/CD 파이프라인)
- Jira (티켓 관리)

### 생산성 도구
- Slack (메시지, 채널 관리)
- Trello (보드, 카드 관리)
- Google Workspace (Drive, Calendar)

## 📄 라이선스

MIT License

## 🤝 기여

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📞 지원

문제가 발생하거나 질문이 있으시면:

1. [Issues](https://github.com/your-username/notion-mcp-server/issues)에 등록
2. 로그 파일과 함께 상세한 증상 설명
3. 운영체제, Node.js 버전 정보 포함

## 🔗 관련 링크

- [MCP Official Documentation](https://modelcontextprotocol.io/)
- [Notion API Documentation](https://developers.notion.com/)
- [Claude Desktop](https://claude.ai/download)
- [Notion Developer Console](https://www.notion.so/my-integrations)

---

**Note**: 이 프로젝트는 Anthropic의 MCP 프로토콜을 사용하여 Claude Desktop과 Notion을 연결합니다. 공식 지원이 아니며, 개인 프로젝트로 개발되었습니다.