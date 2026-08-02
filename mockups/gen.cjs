// One-off generator for character-sheet-ko.html. Not part of the app build.
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function dotsView(value, max = 5) {
  let out = '<span class="dots">';
  for (let n = 1; n <= max; n++) out += `<span class="dot ${n <= value ? 'filled' : ''}"></span>`;
  out += '</span>';
  return out;
}
function dotsEdit(value, max = 5) {
  let out = '<span class="dots" role="radiogroup">';
  for (let n = 1; n <= max; n++)
    out += `<button class="dot ${n <= value ? 'filled' : ''}" aria-label="${n}"></button>`;
  out += '</span>';
  return out;
}

const skills = [
  ['예술', 'Artistry', 1],
  ['운동', 'Athletics', 2],
  ['근접전', 'Close Combat', 3],
  ['문화', 'Culture', 1],
  ['공감', 'Empathy', 2],
  ['수수께끼', 'Enigmas', 4],
  ['비학', 'Esoterica', 3],
  ['도둑질', 'Larceny', 2],
  ['지휘', 'Leadership', 1],
  ['의학', 'Medicine', 0],
  ['설득', 'Persuasion', 3],
  ['운전', 'Pilot', 1],
  ['원거리 전투', 'Ranged Combat', 2],
  ['과학', 'Science', 1],
  ['생존', 'Survival', 2],
  ['공학', 'Technology', 1],
];

const attrCategories = [
  {
    ko: '정신',
    en: 'Mental',
    stats: [
      ['지성', 'Intellect', 3],
      ['교활', 'Cunning', 4],
      ['결의', 'Resolve', 2],
    ],
  },
  {
    ko: '신체',
    en: 'Physical',
    stats: [
      ['완력', 'Might', 2],
      ['민첩', 'Dexterity', 3],
      ['체력', 'Stamina', 2],
    ],
  },
  {
    ko: '사회',
    en: 'Social',
    stats: [
      ['존재감', 'Presence', 2],
      ['조종', 'Manipulation', 3],
      ['평정', 'Composure', 1],
    ],
  },
];

function statRowView(ko, en, value, selected = false) {
  return `
            <button class="sheet-stat ${selected ? 'selected' : ''}" type="button">
              <span class="stat-label">${ko}<small class="label-en">${en}</small></span>
              ${dotsView(value)}
            </button>`;
}
function statRowEdit(ko, en, value) {
  return `
            <div class="sheet-stat editing">
              <span class="stat-label">${ko}<small class="label-en">${en}</small></span>
              ${dotsEdit(value)}
            </div>`;
}

let skillsView = skills.map(([ko, en, v], i) => statRowView(ko, en, v, i === 5)).join('');
let skillsEdit = skills.map(([ko, en, v]) => statRowEdit(ko, en, v)).join('');

let attrView = attrCategories
  .map(
    (cat) => `
          <div class="attr-col">
            <h3 class="group-title">${cat.ko}</h3>
            ${cat.stats.map(([ko, en, v], i) => statRowView(ko, en, v, cat.ko === '정신' && i === 0)).join('')}
          </div>`
  )
  .join('');
let attrEdit = attrCategories
  .map(
    (cat) => `
          <div class="attr-col">
            <h3 class="group-title">${cat.ko}</h3>
            ${cat.stats.map(([ko, en, v]) => statRowEdit(ko, en, v)).join('')}
          </div>`
  )
  .join('');

// Injury track: levels 2/2/2/1 + terminal 1, marked = 3 (lights the "Wounded" level: 2 < 3 <= 4)
function injuryBoxes(count, markedCount) {
  let out = '';
  for (let i = 0; i < count; i++) {
    out += `<button class="injury-box ${i < markedCount ? 'marked' : ''}" aria-label="${i + 1}"></button>`;
  }
  return out;
}
const injuryLevels = [
  { boxes: 2, ko: '피투성이' },
  { boxes: 2, ko: '부상' },
  { boxes: 2, ko: '불구' },
  { boxes: 1, ko: '빈사' },
];
const marked = 3;
let offset = 0;
const injuryGroups = injuryLevels
  .map((level) => {
    const start = offset;
    offset += level.boxes;
    const lit = marked > start && marked <= offset;
    const localMarked = Math.max(0, Math.min(level.boxes, marked - start));
    return `
          <div class="injury-level ${lit ? 'lit' : ''}">
            <div class="injury-boxes">${injuryBoxes(level.boxes, localMarked)}</div>
            <span class="injury-level-label">${level.ko}</span>
          </div>`;
  })
  .join('');

const armorRating = 2;
const armorMarked = 1;
const armorRow = `
        <div class="stat-track-row">
          <span class="field-label">장갑</span>
          <div class="curse-controls">
            <button aria-label="− 장갑">−</button>
            <div class="injury-boxes">${injuryBoxes(armorRating, armorMarked)}</div>
            <button aria-label="+ 장갑">+</button>
          </div>
        </div>`;

const takenOutRow = `
        <div class="injury-standalone">
          <div class="injury-level terminal">
            <div class="injury-boxes">${injuryBoxes(1, 0)}</div>
            <span class="injury-level-label">탈락</span>
          </div>
        </div>`;

function ratedItemView(name, dots, note) {
  return `
          <li class="named-item">
            <div class="named-item-row">
              <span class="named-name">${esc(name)}</span>
              ${dotsView(dots)}
            </div>
            ${note ? `<p class="muted item-card-desc named-item-note">${esc(note)}</p>` : ''}
          </li>`;
}
function ratedItemEdit(name, dots, note) {
  return `
          <li class="named-item">
            <div class="named-item-row">
              <span class="drag-handle"></span>
              <span class="named-name">${esc(name)}</span>
              ${dotsEdit(dots)}
              <div class="item-card-actions">
                <button class="chip ghost" aria-label="edit ${esc(name)}" type="button">✏️</button>
                <button class="chip ghost" aria-label="remove ${esc(name)}" type="button">✕</button>
              </div>
            </div>
            ${note ? `<p class="muted item-card-desc named-item-note">${esc(note)}</p>` : ''}
          </li>`;
}
// One contact rendered with its inline edit form open, to preview
// .named-item-editing styling (the note/rename form added for contacts & bonds).
function ratedItemEditOpen(name, note) {
  return `
          <li class="named-item named-item-editing">
            <div class="form-row">
              <input class="grow" placeholder="이름" value="${esc(name)}">
            </div>
            <div class="form-row">
              <input class="grow" placeholder="메모 (선택)" value="${esc(note)}">
            </div>
            <div class="form-row">
              <button class="primary" type="button">저장</button>
              <button type="button">취소</button>
            </div>
          </li>`;
}

const edges = [
  ['그림자 속에서', 3, ''],
  ['언변의 달인', 2, ''],
  ['야행성', 1, ''],
];
const paths = [
  ['탐정의 길', 3, ''],
  ['저주받은 혈통', 2, ''],
];
const contacts = [
  ['정보상 ‘까치’', 2, '뒷골목 소문에 빠삭함. 현금을 좋아함.'],
  ['형사 박도윤', 1, '가끔 정보를 흘려주지만 믿을 수 없음.'],
];
const bonds = [
  ['여동생 윤하늘', 4, '실종 상태. 반드시 찾아야 함.'],
  ['옛 스승', 2, ''],
];

function ratedListView(title, items) {
  return `
        <section class="card">
          <h2>${title}</h2>
          <ul class="named-list">${items.map(([n, d, note]) => ratedItemView(n, d, note)).join('')}
          </ul>
        </section>`;
}
function ratedListEdit(title, items, openLastAsForm = false) {
  const rows = items.map(([n, d, note], i) =>
    openLastAsForm && i === items.length - 1 ? ratedItemEditOpen(n, note) : ratedItemEdit(n, d, note)
  );
  return `
        <section class="card">
          <h2>${title}</h2>
          <ul class="named-list">${rows.join('')}
          </ul>
          <div class="form-row">
            <input class="grow" placeholder="이름">
            <button type="button">추가</button>
          </div>
        </section>`;
}

const html = `<!doctype html>
<html lang="ko">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
<title>MEJIRO 캐릭터 시트 목업 (한국어)</title>
<link rel="stylesheet" href="../src/styles.css" />
<style>
  /* Mockup-only helper CSS — not part of the app, just view/edit toggling. */
  body.editing .view-only { display: none !important; }
  body:not(.editing) .edit-only { display: none !important; }
  .mockup-banner {
    max-width: 1100px;
    margin: 0 auto;
    padding: 0.5rem 1rem 0;
    font-size: 0.82rem;
    color: var(--muted);
  }
  .mockup-banner code { color: var(--text); }
</style>
</head>
<body>
<div class="app">
  <header class="app-header">
    <a href="#" class="brand">
      <span class="brand-mark">目</span>
      <span class="brand-text">
        <strong>MEJIRO</strong>
        <small>TRPG 시트 & 굴림기</small>
      </span>
    </a>
    <nav class="app-nav">
      <a href="#" class="active">캐릭터</a>
      <a href="#">설정</a>
    </nav>
  </header>

  <p class="mockup-banner">
    CSS 테스트용 정적 목업입니다. <code>src/styles.css</code>를 수정하고 새로고침하면 적용됩니다.
    상단 버튼으로 편집/읽기 모드를 전환하세요.
  </p>

  <main class="app-main">
    <div class="character-view">
      <div class="toolbar">
        <a href="#" class="back-link">← 뒤로</a>
        <div class="toolbar-actions">
          <button type="button">📤 내보내기</button>
          <button type="button" id="editToggle">✏️ 시트 편집</button>
        </div>
      </div>

      <nav class="page-tabs" aria-label="sheet pages">
        <button type="button" class="page-tab active">시트</button>
        <button type="button" class="page-tab">장비</button>
        <button type="button" class="page-tab">주문</button>
        <button type="button" class="page-tab">트릭</button>
      </nav>

      <div class="play-layout">
        <div class="stack">

          <div class="two-col identity-split">
            <section class="card identity view-only">
              <div class="identity-name">
                <h1>윤소하 <a class="external-sheet-link" href="#" title="외부 캐릭터 시트">🔗</a></h1>
              </div>
              <div class="identity-row muted">가시덤불 · 벨몬트 가 · 밤거리를 떠도는 탐정</div>
              <details class="fold">
                <summary>롤 패스 & 목표</summary>
                <div class="fold-readonly">
                  <div><span class="field-label">롤 패스</span> 그림자 정보상</div>
                  <div><span class="field-label">단기 목표 1</span> 실종된 동생의 행방을 찾는다</div>
                  <div><span class="field-label">단기 목표 2</span> 조직의 눈을 피해 은신처를 확보한다</div>
                  <div><span class="field-label">장기 목표</span> 가문에 걸린 저주의 근원을 밝혀낸다</div>
                </div>
              </details>
              <details class="fold">
                <summary>모티프</summary>
                <p class="muted fold-readonly">까마귀 깃털
낡은 회중시계
붉은 실</p>
              </details>
            </section>

            <section class="card identity edit-only">
              <div class="form-row">
                <label class="field grow"><span class="field-label">이름</span><input value="윤소하"></label>
              </div>
              <div class="form-row">
                <label class="field grow"><span class="field-label">혈통</span><input value="가시덤불"></label>
                <label class="field grow"><span class="field-label">가문</span><input value="벨몬트 가"></label>
              </div>
              <div class="form-row">
                <label class="field grow"><span class="field-label">컨셉</span><input value="밤거리를 떠도는 탐정"></label>
              </div>
              <details class="fold" open>
                <summary>롤 패스 & 목표</summary>
                <div class="form-row">
                  <label class="field grow"><span class="field-label">롤 패스</span><input value="그림자 정보상"></label>
                </div>
                <div class="form-row">
                  <label class="field grow"><span class="field-label">단기 목표 1</span><input value="실종된 동생의 행방을 찾는다"></label>
                  <label class="field grow"><span class="field-label">단기 목표 2</span><input value="조직의 눈을 피해 은신처를 확보한다"></label>
                </div>
                <div class="form-row">
                  <label class="field grow"><span class="field-label">장기 목표</span><input value="가문에 걸린 저주의 근원을 밝혀낸다"></label>
                </div>
              </details>
              <details class="fold">
                <summary>모티프</summary>
                <textarea rows="3">까마귀 깃털
낡은 회중시계
붉은 실</textarea>
              </details>
              <div class="form-row">
                <label class="field grow"><span class="field-label">외부 캐릭터 시트</span><input type="url" placeholder="https://…"></label>
              </div>
              <div class="form-row">
                <label class="field grow"><span class="field-label">디스코드 웹훅 URL</span><input type="url" placeholder="https://discord.com/api/webhooks/…"></label>
              </div>
              <div class="form-row">
                <label class="field-check"><input type="checkbox" checked><span>웹훅 메시지에 캐릭터 이름 표시</span></label>
              </div>
            </section>

            <section class="card view-only">
              <div class="curse-row">
                <span class="field-label">얽힘</span>
                ${dotsView(2, 4)}
              </div>
              <div class="curse-row">
                <span class="field-label">저주 주사위</span>
                <div class="curse-controls">
                  <button aria-label="− 저주 주사위" type="button">−</button>
                  <span class="dots curse-dots">${dotsEdit(3, 7)}</span>
                  <button aria-label="+ 저주 주사위" type="button">+</button>
                </div>
              </div>
            </section>

            <section class="card edit-only">
              <div class="curse-row">
                <span class="field-label">얽힘</span>
                ${dotsEdit(2, 4)}
              </div>
              <div class="curse-row">
                <span class="field-label">저주 주사위</span>
                <div class="curse-controls">
                  <button aria-label="− 저주 주사위" type="button">−</button>
                  <span class="dots curse-dots">${dotsEdit(3, 7)}</span>
                  <button aria-label="+ 저주 주사위" type="button">+</button>
                </div>
              </div>
            </section>
          </div>

          <details class="card fold-card" open>
            <summary class="card-summary">기술</summary>
            <div class="skill-grid view-only">${skillsView}
            </div>
            <div class="skill-grid edit-only">${skillsEdit}
            </div>
          </details>

          <details class="card fold-card" open>
            <summary class="card-summary">능력치</summary>
            <div class="attr-grid view-only">${attrView}
            </div>
            <div class="attr-grid edit-only">${attrEdit}
            </div>
          </details>

          <div class="two-col">
            <section class="card">
              <h2>부상</h2>
              ${armorRow}
              <div class="injury-track grouped">${injuryGroups}
              </div>
              ${takenOutRow}
            </section>
            <section class="card">
              <h2>상태</h2>
              <div class="condition-chips">
                <span class="condition">출혈<button aria-label="remove" type="button">✕</button></span>
                <span class="condition">혼란<button aria-label="remove" type="button">✕</button></span>
              </div>
              <div class="form-row">
                <input class="grow" placeholder="이름">
                <button type="button">추가</button>
              </div>
            </section>
          </div>

          <div class="two-col view-only">
            ${ratedListView('엣지', edges)}
            ${ratedListView('패스', paths)}
          </div>
          <div class="two-col edit-only">
            ${ratedListEdit('엣지', edges)}
            ${ratedListEdit('패스', paths)}
          </div>

          <div class="two-col view-only">
            ${ratedListView('인맥', contacts)}
            ${ratedListView('유대', bonds)}
          </div>
          <div class="two-col edit-only">
            ${ratedListEdit('인맥', contacts, true)}
            ${ratedListEdit('유대', bonds)}
          </div>

          <div class="two-col">
            <section class="card">
              <h2>번민</h2>
              <textarea class="torment-field" rows="4">밤마다 반복되는 악몽 속에서 낯선 목소리가 이름을 부른다.</textarea>
            </section>
            <section class="card">
              <h2>천형</h2>
              <textarea class="torment-field" rows="4">손끝에서 그림자가 스며나올 때마다 이성을 붙잡기 어렵다.</textarea>
            </section>
          </div>

          <section class="card">
            <h2>유산</h2>
            <div class="form-row">
              <textarea class="torment-field inheritance-field" rows="4">할머니의 낡은 열쇠</textarea>
              <textarea class="torment-field inheritance-field" rows="4">가문의 문장이 새겨진 반지</textarea>
            </div>
          </section>

        </div>
      </div>
    </div>
  </main>
</div>
<script>
  var btn = document.getElementById('editToggle');
  btn.addEventListener('click', function () {
    var editing = document.body.classList.toggle('editing');
    btn.classList.toggle('primary', editing);
    btn.textContent = editing ? '✓ 완료' : '✏️ 시트 편집';
  });
</script>
</body>
</html>
`;

require('fs').writeFileSync(__dirname + '/character-sheet-ko.html', html);
console.log('wrote', __dirname + '/character-sheet-ko.html');
