# Harness 섹션 추가 — 설계 문서

작성일: 2026-04-28
상태: 검토 대기

## 1. 목적

블로그에 기존 Posts / Works 외에 **Harness** 섹션을 신설한다. AI 하네스(Claude Code, Codex, Cursor 등) 환경에서 만든 스킬·플러그인·에이전트·MCP 서버·워크플로우 같은 자산을 주제별로 정리해 보여주는 카드 갤러리이며, 각 항목은 마크다운으로 자세히 설명된 디테일 페이지를 가진다.

## 2. 콘텐츠 모델

새 콘텐츠 컬렉션 `harness`를 `src/content.config.ts`에 추가한다. 파일 위치는 `src/content/harness/<slug>.md` (다국어 분리 시 `<slug>.ko.md` / `<slug>.en.md`).

```ts
const harness = defineCollection({
  loader: markdownLoader('harness'),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    category: z.string(),                       // 단일 (예: "AI", "Backend", "Design")
    tags: z.array(z.string()).default([]),      // 다중 (예: ["skill", "mcp"])
    date: z.coerce.date(),
    links: z.object({
      github: z.string().url().optional(),
      docs: z.string().url().optional(),
      demo: z.string().url().optional(),
    }).default({}),
    cover: z.string().optional(),
    order: z.number().default(0),
    lang: z.enum(['ko', 'en']).default('ko'),
    draft: z.boolean().default(false),
  }),
});
```

설계 원칙:
- **카테고리는 단일** — 큰 분류(디자인 / 백엔드 / AI 등). 자유 입력 문자열이며, 사용된 값만 자동 수집되어 필터로 노출.
- **태그는 다중** — 세부 라벨(skill / agent / mcp / hook / workflow / prompt 등). 다중 선택 필터링 가능.
- **모든 항목은 디테일 페이지를 가진다** — 외부 직행 옵션은 없음. 외부 링크는 `links` 필드로 두고 디테일 페이지에서 버튼으로 노출한다.

## 3. 라우팅 & 페이지 구조

```
src/pages/harness/index.astro          → ko 인덱스
src/pages/harness/[...slug].astro      → ko 디테일
src/pages/en/harness/index.astro       → en 인덱스
src/pages/en/harness/[...slug].astro   → en 디테일
```

페이지 컴포넌트는 기존 패턴(`src/components/pages/`)을 따른다.

- `HarnessIndexPage.astro` — `lang` prop을 받아 해당 언어 항목만 노출, 필터 UI + 카드 그리드 렌더
- `HarnessDetailPage.astro` — 단일 항목의 마크다운 본문 렌더
- `HarnessCard.astro` — 카드 컴포넌트 (썸네일, 카테고리 뱃지, 제목, 설명, 태그 칩들)

네비게이션: `Nav.astro`의 `items`에 `'Harness'`를 추가하고 `Props.active` 타입을 `'About' | 'Posts' | 'Works' | 'Harness'`로 확장한다.

## 4. 인덱스 페이지 UI (Variant A — 상단 가로 필터바)

레이아웃:

```
┌─────────────────────────────────────────────┐
│  Harness                                    │
│  AI 하네스 관련 자산과 워크플로우 모음          │
├─────────────────────────────────────────────┤
│ Category:  [All] [AI] [Backend] [Design]    │  ← pill 세그먼트, 단일 선택
│ Tags:      [skill] [agent] [mcp] [hook] ... │  ← 칩, 다중 선택
│ 12 items                       Reset filters│
├─────────────────────────────────────────────┤
│ ┌──────────┐ ┌──────────┐ ┌──────────┐      │
│ │ [cover]  │ │ [cover]  │ │ [cover]  │      │
│ │ AI badge │ │ Backend  │ │ AI       │      │
│ │ Title    │ │ Title    │ │ Title    │      │
│ │ desc...  │ │ desc...  │ │ desc...  │      │
│ │ #skill   │ │ #agent   │ │ #mcp     │      │
│ └──────────┘ └──────────┘ └──────────┘      │
└─────────────────────────────────────────────┘
```

필터링 동작:
- **카테고리**: 단일 선택, 기본값 `All`
- **태그**: 다중 선택, **AND 결합** (선택한 모든 태그를 가진 항목만 표시)
- 두 필터는 **AND** 결합 (카테고리 일치 ∧ 태그 모두 포함)
- 결과 개수와 Reset 링크를 같은 줄에 노출

자동 수집:
- 빌드 타임에 해당 언어의 모든 harness 항목을 훑어 등장하는 카테고리·태그를 정렬해 필터바에 노출
- 카드의 카테고리/태그는 `data-cat`, `data-tags` 속성으로 박아두고 클라이언트 JS가 토글

URL querystring 동기화:
- `?cat=AI&tags=skill,mcp` 형식
- 진입 시 querystring 파싱해 초기 상태 적용
- 필터 변경 시 `history.replaceState`로 URL 업데이트 (히스토리 누적 방지)

정렬: `order` 오름차순 → 동일 시 `date` 내림차순.

빈 결과 상태: "No items match the selected filters." 메시지 + Reset 버튼.

와이어프레임: `_draft/harness-wireframe.html` 참조.

## 5. 디테일 페이지

라우트: `/harness/<slug>` (모든 항목이 디테일 페이지를 가짐)

레이아웃 (Posts 디테일 톤을 따름):

```
┌──────────────────────────────────────────────────┐
│ — HARNESS / <CATEGORY>                            │  ← eyebrow (악센트 컬러)
│ <Title>                                          │  ← Instrument Serif h1
│ <description>                                    │  ← 부제
│ 2026.04.27 · #skill #mcp                         │  ← 날짜 + 태그칩
│ [ View on GitHub ↗ ] [ Live demo ↗ ] [ Docs ↗ ]  │  ← links 중 있는 것만 노출
├──────────────────────────────────────────────────┤
│  (마크다운 본문)                                   │
├──────────────────────────────────────────────────┤
│ ← Back to Harness                                │
└──────────────────────────────────────────────────┘
```

구성:
- **Eyebrow**: `— HARNESS / <카테고리>`, 모노스페이스, 악센트 컬러
- **제목**: `Instrument Serif`
- **설명**: frontmatter `description`
- **메타**: 날짜 + 태그칩
- **링크 버튼**: `links.github` / `links.demo` / `links.docs` 중 있는 것만. pill 형태 + 외부 링크 화살표
- **본문**: Astro `<Content />` 렌더, Posts 디테일과 동일한 타이포 스타일
- **하단 네비**: `← Back to Harness`

i18n:
- `[...slug].astro`의 `getStaticPaths`에서 `lang` 일치 항목만 경로 생성
- URL은 `baseSlug`로 `.ko`/`.en` suffix 제거해 동일하게 유지

## 6. 변경 영향 범위

**새로 추가할 파일**:
```
src/content/harness/                           # 콘텐츠 폴더
src/pages/harness/index.astro
src/pages/harness/[...slug].astro
src/pages/en/harness/index.astro
src/pages/en/harness/[...slug].astro
src/components/pages/HarnessIndexPage.astro
src/components/pages/HarnessDetailPage.astro
src/components/HarnessCard.astro
```

**수정할 파일**:
```
src/content.config.ts    # harness 컬렉션 정의 추가
src/components/Nav.astro # items에 'Harness' 추가, active 타입 확장
src/styles/global.css    # 필터바·세그먼트·칩·카드·디테일 스타일 추가
```

## 7. 엣지 케이스

- **빈 콘텐츠 폴더**: `markdownLoader`가 이미 존재/파일 여부를 체크하므로 빌드는 통과. 인덱스에 "No items yet." 메시지 표시.
- **draft 항목**: prod 빌드에서 제외, dev에서는 표시 (Posts 패턴 일치).
- **사용 안 된 태그**: 자동 수집 단계에서 제외되므로 필터바에 안 나옴.
- **i18n 비어 있음**: 한쪽 언어에 항목이 0개여도 빌드 통과, 인덱스 빈 상태 메시지로 처리.
- **잘못된 querystring**: 존재하지 않는 카테고리/태그 값은 무시하고 기본값으로 fallback.

## 8. 명시적으로 만들지 않을 것

- 검색창
- 페이지네이션
- 정렬 변경 UI
- 관련 항목(같은 카테고리/태그) 섹션
- 카드 클릭 시 외부 링크 직행 옵션

항목 수가 충분히 늘어났을 때 다시 검토한다 (YAGNI).
