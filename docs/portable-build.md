# 포터블 빌드 (`MEJIRO.html`)

Node/Python 등 아무것도 설치하지 않은 사람도 다운로드해서 더블클릭만으로 쓸 수
있는, 서버 없이 완전히 독립된 단일 HTML 파일 빌드입니다. GitHub Pages 배포
(`dist/`, `deploy.yml`)와는 별개의 빌드 타깃이며, 소스 코드는 완전히 같습니다
(리액트 컴포넌트, 굴림 엔진, CSS 전부 동일 — 마지막 패키징 단계만 다릅니다).

## 빌드하기

```bash
npm run build:portable   # dist-portable/MEJIRO.html — 파일 이거 딱 하나
```

- 엔트리포인트는 `index.html`이 아니라 루트의 `MEJIRO.html`입니다. 파비콘도
  `public/favicon.svg`를 참조하지 않고 base64 데이터 URI로 하드코딩되어 있습니다.
  (`vite-plugin-singlefile`은 `public/` 파일은 인라인하지 않으므로, 그대로 두면
  파비콘 하나 때문에 산출물이 파일 두 개가 됩니다).
- 설정은 `vite.config.portable.ts`에 따로 있습니다 (메인 `vite.config.ts`와
  다른 점: `base: './'`, `publicDir: false`, `viteSingleFile()` 플러그인 추가,
  `VitePWA` 플러그인은 아예 뺌).
- 서비스워커/매니페스트는 이 빌드에 없습니다. `file://`에서는 서비스워커
  등록 자체가 안 되고("origin 'null' is not supported"), 이미 로컬 파일이니
  PWA로 설치할 이유도 없습니다.
- 라우팅은 `HashRouter`(`src/main.tsx`)라서 `file://`에서도 문제없이 동작합니다
  (History API 라우팅은 `file://`에서 안 됨 — 애초에 GitHub Pages 서브패스
  때문에 HashRouter를 쓰고 있었던 거라 별도 대응이 필요 없었습니다).

## 실제로 검증한 것들 (추측 아님)

Playwright + 실제로 유지되는 브라우저 프로필(`launchPersistentContext`)로
직접 테스트했습니다 — `browser.newPage()`나 매번 새로운 `launch()`는 매번
새 임시 프로필을 쓰기 때문에 지속성 테스트에 안 맞습니다, 주의.

- **IndexedDB가 `file://`에서 정상 동작하고, 브라우저를 완전히 껐다 켜도
  유지됩니다.**
- **`file://` 페이지들은 브라우저(정확히는 프로필) 안에서 하나의 공유된
  `null` origin을 씁니다.** 즉 `MEJIRO.html`을 다른 폴더로 옮기거나 이름을
  바꿔도 데이터는 그대로 남습니다 — 폴더 경로에 묶여있지 않습니다.
  다만 반대로: 브라우저를 바꾸거나(Chrome → Firefox), 다른 컴퓨터로
  옮기거나, "인터넷 사용 기록 삭제"를 하면 데이터가 사라집니다 (그리고 그
  경우 로컬의 다른 file:// 도구들 데이터도 같이 날아갈 수 있음 — 같은
  origin을 공유하니까). 이게 바로 아래 백업 기능이 필요한 이유입니다.
- 인라인 `<script type="module">`(다른 파일을 import하지 않는)은 `file://`
  에서 CORS 문제 없이 정상 실행됩니다. 문제가 되는 건 "별도 파일을 import"할
  때뿐이라, `vite-plugin-singlefile`로 전부 한 파일에 인라인하면 애초에
  해당 안 됨.
- File System Access API(`showSaveFilePicker` 등)는 `file://`에서도
  `isSecureContext: true`로 잡혀서 이론상 사용 가능하지만, Chromium 계열
  전용이라 채택하지 않았습니다 (아래 "왜 파일 기반 저장 대신 백업
  내보내기/가져오기인가" 참고).

## 데이터 백업 (Settings 페이지)

전체 캐릭터·캠페인·설정을 JSON 파일 하나로 내보내기/가져오기(전체
교체)/모두 지우기 할 수 있는 기능이 Settings 페이지에 있습니다
(`src/components/BackupSection.tsx`, `src/storage/backup.ts`). GitHub
Pages 빌드에도 동일하게 들어있습니다 — Settings 컴포넌트가 두 빌드에서
완전히 같은 코드라 별도 처리가 필요 없었습니다.

- 내보내기: 디스코드 웹훅 URL은 캐릭터/캠페인 단건 내보내기와 마찬가지로
  항상 제외됩니다.
- 가져오기: 항상 "전체 교체"만 지원합니다 (부분 병합은 애매한 케이스가 너무
  많아서 일부러 안 만듦).
- 지우기: 캐릭터/캠페인만 삭제하고, 설정(언어·테마 등)은 건드리지 않습니다.

### 왜 파일 기반 저장 대신 백업 내보내기/가져오기인가

원래 아이디어는 "`MEJIRO.html` 옆에 저장 파일이 자동으로 갱신되는" 방식
(File System Access API로 실제 파일에 직접 씀)이었지만:

- Chromium 계열에서만 되고 Firefox/Safari는 지원 안 함.
- 파일 접근 권한을 세션 넘어 기억하게 하는 부분이 브라우저/버전마다
  들쭉날쭉함.

대신 수동 내보내기/가져오기(JSON 다운로드/업로드)는 모든 브라우저에서
동일하게 동작하고, 구현도 훨씬 단순하며, "다른 컴퓨터로 옮기기"·"다른
사람에게 전달하기"·"그냥 백업해두기" 용도에 오히려 더 잘 맞습니다.

## `custom.css` 오버라이드

`MEJIRO.html`과 같은 폴더에 `custom.css` 파일을 넣어두면 자동으로 로드되어
기본 스타일을 덮어씁니다 (`src/lib/loadCustomCss.ts`, `main.tsx`에서 앱
자체 스타일을 import한 다음에 호출). 파일이 없으면 그냥 조용히 무시됩니다
(404가 나도 아무 에러도 안 뜸). `file://`일 때만 동작하고, GitHub Pages
같은 호스팅 배포에서는 아예 요청조차 하지 않습니다 — 거기선 누구도 같은
"폴더"에 파일을 넣을 수 없으니까요.

같은 우선순위(specificity)의 셀렉터라면 `custom.css` 쪽이 이깁니다 — 앱
자체 스타일이 담긴 `<style>`보다 나중에 `<head>`에 추가되기 때문에 CSS
캐스케이드상 자연스럽게 우선합니다. `!important` 없이도 됩니다.

## 수동 릴리즈 만드는 법

CI 자동화는 아직 없습니다 (일부러 — 계속 수정 중이라 매번 릴리즈가 튀는 게
번거로움). 필요할 때 수동으로:

```bash
npm run build:portable
```

1. GitHub 저장소 → Releases → "Draft a new release"
2. 태그 입력 (예: `v0.1.0`, 또는 `portable-2026-08-07`처럼 날짜 기반도 괜찮음)
3. `dist-portable/MEJIRO.html`을 릴리즈 첨부 파일로 업로드
4. Publish

이후 세션에서 "매뉴얼 릴리즈 해줘" 요청이 오면 이 문서를 참고해서 위
순서대로 진행하면 됩니다. `MEJIRO.html` 하나만 올리면 되고, 압축(zip)은
필요 없습니다 — 파일이 이미 하나뿐이라서요.
