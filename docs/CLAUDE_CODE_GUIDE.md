# Claude Code와 Notion MCP 서버 연동 가이드

Claude Code는 Anthropic의 공식 CLI 도구로, MCP (Model Context Protocol) 서버를 통해 Notion과 직접 연동할 수 있습니다.

## 📋 사전 요구사항

- Claude Code CLI 설치 ([claude.ai/code](https://claude.ai/code))
- Node.js 18+ 설치
- Notion Integration Token
- 이 저장소 클론 및 의존성 설치

## 🚀 빠른 설정

### 1. MCP 서버 추가

```bash
# 현재 디렉토리에서 실행 (저장소 루트)
claude mcp add --transport stdio notion "node" "$(pwd)/server.js" --env NOTION_TOKEN="your_token_here"
```

### 2. 설치 확인

```bash
claude mcp list
```

다음과 같은 출력이 나와야 합니다:
```
notion (stdio): node /path/to/notion-mcp-server/server.js
```

### 3. Claude Code 재시작

기존 Claude Code 세션을 종료하고 새로 시작합니다:
```bash
exit  # 기존 세션 종료
claude  # 새 세션 시작
```

## 🔧 사용법

### 자연어로 Notion 작업하기

Claude Code에서 자연어로 Notion 작업을 요청할 수 있습니다:

```bash
# 페이지 읽기
"Notion 페이지 16f51c9b4ae380acafd4eef0a5c37416의 내용을 읽어줘"

# 페이지 생성
"Notion 페이지 12345에 '프로젝트 계획'이라는 제목으로 새 페이지를 만들어줘"

# URL에서 페이지 ID 추출하여 읽기
"https://www.notion.so/project-plan-16f51c9b4ae380acafd4eef0a5c37416 이 페이지 내용을 분석해줘"
```

### 직접 MCP 도구 호출

Claude Code는 MCP 도구를 직접 호출할 수도 있습니다:

```bash
# 페이지 읽기
mcp__notion__read_page page_id="16f51c9b4ae380acafd4eef0a5c37416"

# 페이지 생성
mcp__notion__create_page parent_id="12345" title="새 페이지" content="# 제목\n\n내용입니다."
```

## 🛠️ 고급 활용

### 1. 대용량 문서 생성

Claude Code는 마크다운 파일을 읽어서 Notion 페이지로 변환할 수 있습니다:

```bash
# 마크다운 파일을 Notion 페이지로 변환
"README.md 파일 내용을 읽어서 Notion 페이지 12345에 새 페이지로 만들어줘"
```

### 2. 프로젝트 문서화

프로젝트의 코드나 문서를 분석하여 Notion에 정리할 수 있습니다:

```bash
# 코드 분석 후 Notion 문서 생성
"src/ 디렉토리의 코드를 분석하고 API 문서를 Notion 페이지로 만들어줘"

# 여러 파일 통합 문서 생성
"package.json, README.md, CLAUDE.md를 종합하여 프로젝트 개요 페이지를 Notion에 만들어줘"
```

### 3. 작업 흐름 자동화

```bash
# 브랜치 변경사항을 Notion에 기록
"현재 git 브랜치의 변경사항을 분석하고 릴리즈 노트를 Notion에 작성해줘"

# 이슈 트래킹
"프로젝트의 TODO 주석들을 찾아서 Notion 태스크 페이지로 만들어줘"
```

## 🔧 토큰 관리

### 토큰 업데이트

Notion Integration Token을 변경해야 하는 경우:

```bash
# 기존 서버 제거
claude mcp remove notion

# 새 토큰으로 다시 추가
claude mcp add --transport stdio notion "node" "$(pwd)/server.js" --env NOTION_TOKEN="new_token_here"

# Claude Code 재시작 필요
exit
claude
```

### 환경별 토큰 관리

개발/운영 환경별로 다른 토큰을 사용하는 경우:

```bash
# 개발용
claude mcp add --transport stdio notion-dev "node" "$(pwd)/server.js" --env NOTION_TOKEN="dev_token"

# 운영용  
claude mcp add --transport stdio notion-prod "node" "$(pwd)/server.js" --env NOTION_TOKEN="prod_token"
```

## 🚨 문제 해결

### 1. "API token is invalid" 오류

```bash
# 토큰 확인
echo $NOTION_TOKEN

# MCP 서버 재설정
claude mcp remove notion
claude mcp add --transport stdio notion "node" "$(pwd)/server.js" --env NOTION_TOKEN="correct_token"
```

### 2. "Server not found" 오류

```bash
# 절대 경로 사용
claude mcp add --transport stdio notion "node" "/full/path/to/server.js" --env NOTION_TOKEN="your_token"

# 현재 디렉토리에서 절대 경로 자동 생성
claude mcp add --transport stdio notion "node" "$(realpath server.js)" --env NOTION_TOKEN="your_token"
```

### 3. 도구가 표시되지 않는 경우

```bash
# MCP 서버 목록 확인
claude mcp list

# Claude Code 완전 재시작
exit
claude

# 도구 목록 확인 (세션 내에서)
"사용 가능한 도구 목록을 보여줘"
```

## 📊 성능 최적화

### 배치 처리

큰 문서의 경우 자동으로 배치 처리됩니다:

```bash
# 큰 마크다운 파일도 자동 처리
"5000줄짜리 문서.md를 Notion 페이지로 변환해줘"
# → 자동으로 95개 블록씩 나누어 처리
```

### 메모리 효율성

```bash
# 큰 파일을 청크별로 처리
"대용량 로그 파일을 분석하여 요약을 Notion에 저장해줘"
# → Claude Code가 파일을 적절히 나누어 처리
```

## 🔒 보안 고려사항

### 토큰 보안

```bash
# 토큰을 환경변수로 관리
export NOTION_TOKEN="your_token"
claude mcp add --transport stdio notion "node" "$(pwd)/server.js" --env NOTION_TOKEN="$NOTION_TOKEN"

# 설정 파일에서 토큰 확인 (Claude Code 설정)
cat ~/.config/claude/mcp_servers.json | grep -A5 notion
```

### 권한 제한

- Notion Integration은 필요한 페이지에만 연결
- 정기적으로 사용하지 않는 Integration 정리
- 토큰 정기 갱신 권장

## 🔗 통합 워크플로우

### 개발 문서화 워크플로우

```bash
# 1. 코드 변경사항 분석
"최근 커밋의 변경사항을 분석해줘"

# 2. Notion에 문서화
"변경사항을 바탕으로 API 문서를 업데이트해서 Notion에 저장해줘"

# 3. 팀 공유
"변경사항 요약을 Notion 팀 페이지에 추가해줘"
```

### 프로젝트 관리 워크플로우

```bash
# 1. 이슈 분석
"GitHub 이슈 #123의 요구사항을 분석해줘"

# 2. 작업 계획 수립
"분석 결과를 바탕으로 구현 계획을 Notion에 작성해줘"

# 3. 진행상황 추적
"구현 진행상황을 Notion 페이지에 업데이트해줘"
```

## 📚 추가 자료

- [MCP Protocol 공식 문서](https://modelcontextprotocol.io/)
- [Claude Code 공식 문서](https://docs.anthropic.com/en/docs/claude-code)
- [Notion API 문서](https://developers.notion.com/)
- [프로젝트 CLAUDE.md](../CLAUDE.md) - 개발자 가이드

---

**참고**: 이 가이드는 Claude Code v1.0 기준으로 작성되었습니다. 최신 버전에서는 일부 명령어나 동작이 다를 수 있습니다.