# Playwright MCP Server 사용 가이드

Playwright MCP 서버를 통해 Claude에서 브라우저 자동화를 수행하는 완전한 가이드입니다.

## 목차

1. [기본 설정](#기본-설정)
2. [기본 사용법](#기본-사용법)
3. [고급 사용 예제](#고급-사용-예제)
4. [실전 워크플로우](#실전-워크플로우)
5. [문제 해결](#문제-해결)
6. [팁과 모범 사례](#팁과-모범-사례)

## 기본 설정

### 1. Claude Code에 서버 추가 확인

```bash
# Playwright MCP 서버가 추가되었는지 확인
claude mcp list

# 출력 예시:
# playwright: node /path/to/playwright-mcp/server.js
```

### 2. 새 Claude Code 세션 시작

MCP 서버 도구를 사용하려면 새 세션을 시작해야 합니다:

```bash
# 현재 세션 종료
exit

# 새 세션 시작
claude
```

### 3. 사용 가능한 도구 확인

새 세션에서 다음 도구들을 사용할 수 있습니다:

- `mcp__playwright__navigate_to_page`: 웹페이지로 이동
- `mcp__playwright__get_page_content`: 페이지 내용 추출
- `mcp__playwright__click_element`: 요소 클릭
- `mcp__playwright__fill_input`: 입력 필드 채우기
- `mcp__playwright__take_screenshot`: 스크린샷 캡처
- `mcp__playwright__wait_for_element`: 요소 대기
- `mcp__playwright__close_browser`: 브라우저 닫기

## 기본 사용법

### 1. 웹페이지 이동

```bash
# 기본 이동
mcp__playwright__navigate_to_page --url "https://example.com"

# 특정 브라우저 사용
mcp__playwright__navigate_to_page --url "https://example.com" --browser "firefox"

# 특정 요소가 나타날 때까지 대기
mcp__playwright__navigate_to_page --url "https://example.com" --wait_for ".main-content"
```

**자연어 사용:**
```
"example.com으로 이동해줘"
"Firefox 브라우저로 Google 홈페이지를 열어줘"
```

### 2. 페이지 내용 추출

```bash
# 전체 페이지 텍스트 추출
mcp__playwright__get_page_content --type "text"

# HTML 소스 추출
mcp__playwright__get_page_content --type "html"

# 특정 요소의 내용만 추출
mcp__playwright__get_page_content --type "text" --selector ".article-content"
```

**자연어 사용:**
```
"현재 페이지의 텍스트 내용을 가져와줘"
"페이지의 제목 부분만 추출해줘"
```

### 3. 요소와 상호작용

```bash
# 버튼 클릭
mcp__playwright__click_element --selector "#search-button"

# 입력 필드 채우기
mcp__playwright__fill_input --selector "#search-input" --value "Claude AI"

# 요소가 나타날 때까지 대기
mcp__playwright__wait_for_element --selector ".search-results"
```

**자연어 사용:**
```
"검색 버튼을 클릭해줘"
"검색창에 'Claude AI'를 입력해줘"
```

### 4. 스크린샷 캡처

```bash
# 전체 페이지 스크린샷
mcp__playwright__take_screenshot --full_page true

# 특정 경로에 저장
mcp__playwright__take_screenshot --path "./screenshot.png" --full_page true

# 현재 뷰포트만 캡처
mcp__playwright__take_screenshot --full_page false
```

**자연어 사용:**
```
"현재 페이지의 스크린샷을 찍어줘"
"전체 페이지 스크린샷을 screenshot.png로 저장해줘"
```

## 고급 사용 예제

### 1. 검색 작업 자동화

```bash
# 1. Google로 이동
mcp__playwright__navigate_to_page --url "https://google.com"

# 2. 검색어 입력
mcp__playwright__fill_input --selector "input[name='q']" --value "Playwright automation"

# 3. 검색 버튼 클릭 또는 Enter
mcp__playwright__click_element --selector "input[name='btnK']"

# 4. 결과 대기
mcp__playwright__wait_for_element --selector "#search"

# 5. 결과 추출
mcp__playwright__get_page_content --type "text" --selector "#search"
```

### 2. 폼 작성 자동화

```bash
# 1. 웹사이트로 이동
mcp__playwright__navigate_to_page --url "https://example.com/contact"

# 2. 이름 입력
mcp__playwright__fill_input --selector "#name" --value "홍길동"

# 3. 이메일 입력
mcp__playwright__fill_input --selector "#email" --value "hong@example.com"

# 4. 메시지 입력
mcp__playwright__fill_input --selector "#message" --value "문의사항입니다."

# 5. 제출 버튼 클릭
mcp__playwright__click_element --selector "#submit"

# 6. 성공 메시지 확인
mcp__playwright__wait_for_element --selector ".success-message"
```

### 3. 다중 브라우저 테스트

```bash
# Chrome에서 테스트
mcp__playwright__navigate_to_page --url "https://example.com" --browser "chromium"
mcp__playwright__take_screenshot --path "./chrome_screenshot.png"

# Firefox에서 테스트
mcp__playwright__navigate_to_page --url "https://example.com" --browser "firefox"
mcp__playwright__take_screenshot --path "./firefox_screenshot.png"

# Safari(WebKit)에서 테스트
mcp__playwright__navigate_to_page --url "https://example.com" --browser "webkit"
mcp__playwright__take_screenshot --path "./safari_screenshot.png"
```

## 실전 워크플로우

### 1. 웹사이트 모니터링

```bash
# 정기적으로 웹사이트 상태 확인
mcp__playwright__navigate_to_page --url "https://your-website.com"
mcp__playwright__wait_for_element --selector ".main-content" --timeout 10000
mcp__playwright__take_screenshot --path "./monitoring_$(date +%Y%m%d_%H%M%S).png"
```

### 2. 웹 스크래핑

```bash
# 1. 대상 페이지로 이동
mcp__playwright__navigate_to_page --url "https://news-website.com"

# 2. 기사 제목들 추출
mcp__playwright__get_page_content --type "text" --selector ".article-title"

# 3. 다음 페이지로 이동
mcp__playwright__click_element --selector ".next-page"

# 4. 반복...
```

### 3. UI 테스트 자동화

```bash
# 1. 애플리케이션 로딩 확인
mcp__playwright__navigate_to_page --url "https://your-app.com" --wait_for ".app-loaded"

# 2. 로그인 테스트
mcp__playwright__fill_input --selector "#username" --value "testuser"
mcp__playwright__fill_input --selector "#password" --value "testpass"
mcp__playwright__click_element --selector "#login-btn"

# 3. 로그인 성공 확인
mcp__playwright__wait_for_element --selector ".dashboard"

# 4. 주요 기능 테스트
mcp__playwright__click_element --selector "#feature-button"
mcp__playwright__wait_for_element --selector ".feature-result"
```

## 문제 해결

### 1. 요소를 찾을 수 없는 경우

```bash
# 타임아웃 증가
mcp__playwright__wait_for_element --selector ".slow-loading" --timeout 60000

# 더 구체적인 셀렉터 사용
mcp__playwright__wait_for_element --selector "div.container > .specific-class"
```

### 2. 페이지 로딩 느린 경우

```bash
# 특정 요소 대기와 함께 이동
mcp__playwright__navigate_to_page --url "https://slow-site.com" --wait_for ".content-loaded"

# 단계별로 대기
mcp__playwright__wait_for_element --selector ".first-element"
mcp__playwright__wait_for_element --selector ".second-element"
```

### 3. 브라우저 리소스 관리

```bash
# 작업 완료 후 브라우저 닫기
mcp__playwright__close_browser --browser "chromium"

# 모든 브라우저 닫기
mcp__playwright__close_browser --browser "all"
```

## 팁과 모범 사례

### 1. 효율적인 셀렉터 사용

```bash
# ✅ 좋은 예시
mcp__playwright__click_element --selector "#submit-button"
mcp__playwright__click_element --selector "[data-testid='submit']"

# ❌ 피해야 할 예시
mcp__playwright__click_element --selector "div > div > button"
```

### 2. 적절한 대기 시간 설정

```bash
# 빠른 요소는 기본 타임아웃 사용
mcp__playwright__wait_for_element --selector ".quick-element"

# 느린 요소는 타임아웃 증가
mcp__playwright__wait_for_element --selector ".slow-element" --timeout 30000
```

### 3. 스크린샷을 활용한 디버깅

```bash
# 각 단계마다 스크린샷 촬영
mcp__playwright__take_screenshot --path "./step1.png"
# ... 작업 수행 ...
mcp__playwright__take_screenshot --path "./step2.png"
```

### 4. 자연어와 도구 호출 혼합 사용

```
"네이버로 이동해서 'Claude AI'를 검색하고 결과를 요약해줘"
```

이렇게 자연어로 요청하면 Claude가 자동으로 여러 도구를 조합해서 작업을 수행합니다.

### 5. 브라우저별 특성 고려

- **Chromium**: 가장 빠르고 안정적, 기본 권장
- **Firefox**: Gecko 엔진 특성 테스트 시 사용
- **WebKit**: Safari 브라우저 호환성 테스트 시 사용

## 자주 묻는 질문

### Q: 여러 탭을 동시에 조작할 수 있나요?
A: 현재 버전에서는 한 번에 하나의 페이지만 조작 가능합니다. 새 페이지로 이동하면 이전 페이지는 닫힙니다.

### Q: JavaScript가 많은 SPA 사이트에서도 작동하나요?
A: 네, Playwright는 SPA를 완전히 지원합니다. `wait_for_element`를 활용해 동적 콘텐츠 로딩을 기다릴 수 있습니다.

### Q: 브라우저를 헤드리스가 아닌 모드로 실행할 수 있나요?
A: 현재 서버는 헤드리스 모드로만 실행됩니다. UI가 필요한 디버깅은 스크린샷 기능을 활용하세요.

### Q: 모바일 브라우저 시뮬레이션이 가능한가요?
A: 현재 버전에서는 데스크톱 브라우저만 지원합니다. 향후 버전에서 모바일 에뮬레이션 기능을 추가할 예정입니다.

---

이 가이드를 참고하여 Playwright MCP 서버를 효과적으로 활용하시기 바랍니다. 더 자세한 기술적 내용은 [Playwright 공식 문서](https://playwright.dev/)를 참조하세요.