# 새 색상 테마 추가하기

`src/lib/theme.ts`에 고정된 이름의 팔레트 하나를 추가하는 절차입니다. 현재
`system` / `dark` / `light` / `curseborne` 네 가지 모드가 있고, 각 모드는
캐릭터·캠페인 등 컨텍스트와 무관하게 항상 같은 고정 팔레트를 반환합니다.

## 1. 팔레트 상수 정의

`DARK_THEME` / `LIGHT_THEME` / `CURSEBORNE_THEME` 옆에 새 상수를 추가합니다.

```ts
export const SUNSET_THEME: Theme = {
  scheme: 'dark', // 'dark' | 'light' — 네이티브 위젯·스크롤바 색상(color-scheme)에 씀
  bg: '#...',
  bg2: '#...',
  card: '#...',
  card2: '#...',
  border: '#...',
  text: '#...',
  muted: '#...',
  accent: '#...',
  accent2: '#...',
  success: '#...',
  failure: '#...',
  danger: '#...',
  special: '#...',
  ...DARK_EXTRAS, // 또는 LIGHT_EXTRAS
};
```

`Theme` 인터페이스는 필드가 훨씬 많지만(`headerBg`, `scrim`, `wickedText` 등),
`DARK_EXTRAS`/`LIGHT_EXTRAS`가 그 나머지를 대부분 채워줍니다. 직접 정할 값은
핵심 팔레트 12개(`bg` ~ `curse`)뿐입니다. 배경색에 딱 맞춰 반투명 바
(`headerBg`, `barBg`)를 손보고 싶다면 `CURSEBORNE_THEME`처럼 스프레드 뒤에
개별 override를 추가하면 됩니다.

## 2. 모드로 노출

`ThemeMode` 타입과 `THEME_MODES` 배열에 추가합니다.

```ts
export type ThemeMode = 'system' | 'dark' | 'light' | 'curseborne' | 'sunset';

export const THEME_MODES: ThemeMode[] = [
  'system',
  'dark',
  'light',
  'curseborne',
  'sunset',
];
```

`resolveTheme`의 switch문에 case를 추가합니다.

```ts
switch (mode) {
  case 'light':
    return LIGHT_THEME;
  case 'curseborne':
    return CURSEBORNE_THEME;
  case 'sunset':
    return SUNSET_THEME;
  case 'system':
    return systemPrefersDark() ? DARK_THEME : LIGHT_THEME;
  case 'dark':
  default:
    return DARK_THEME;
}
```

## 3. i18n 라벨 추가

`src/i18n/locales/en.json`, `ko.json`의 `theme` 네임스페이스에 표시 이름을
추가합니다.

```json
"theme": {
  "sunset": "Sunset"
}
```

```json
"theme": {
  "sunset": "선셋"
}
```

`Settings.tsx`는 `THEME_MODES`를 순회하며 `t(\`theme.${m}\`)`로 옵션을
자동으로 만들기 때문에, 컴포넌트 코드는 건드릴 필요가 없습니다.

## 여기까지가 끝인 이유

특수 주사위 색상 오버라이드(`specialColor`)는 모드와 무관하게 `resolveTheme`
마지막 단계에서 한 번 더 적용되므로, 새 테마를 추가해도 자동으로 적용됩니다.
별도 처리가 필요 없습니다.

## 캐릭터/캠페인에 따라 테마를 다르게 하고 싶다면

지금 구조는 "고정된 이름있는 팔레트"만 지원합니다. 예전에는 `rule` 모드가
열려있는 캐릭터의 `templateId`를 읽어 시스템별 테마를 고르는 방식이었지만,
번들 시스템이 커스본 하나뿐이라 실제로는 아무것도 달라지지 않아 제거했습니다
(→ `curseborne` 고정 테마로 이름만 남음).

여러 게임 시스템을 지원하게 되어 시스템별로 팔레트를 다르게 하고 싶다면:

1. `resolveTheme`에 `templateId?: string` 같은 파라미터를 다시 추가하고,
   `Record<string, Theme>` 형태의 맵(예: `SYSTEM_THEMES`)에서 조회하도록
   바꿉니다.
2. `useTheme.ts`에서 `useCharacterStore`(또는 캠페인 스토어)를 다시 구독해
   현재 열려있는 캐릭터/캠페인의 `templateId`를 넘겨줍니다.
3. 시스템 템플릿(`src/templates/*.json`)에 팔레트 힌트 필드를 추가하고,
   `src/templates/index.ts`에 등록할 때 함께 매핑하는 방법도 고려할 수
   있습니다.

이 경우는 실제로 컨텍스트에 따라 값이 달라지는 로직이 필요하므로, 지금처럼
"이름만 있고 실제로는 고정값"인 상태가 되지 않도록 주의하세요.
