# Notion CMS Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the static driving instructor site into a Notion-powered CMS that auto-deploys to GitHub Pages hourly and on manual trigger.

**Architecture:** Five Notion databases feed a Node.js build script that generates a single `dist/index.html`. HTML rendering is split into pure functions in `lib/render.js` (testable). Notion API calls are isolated in `lib/notion.js`. Gallery images are downloaded locally during each build to avoid Notion's expiring signed URLs. GitHub Actions builds on schedule and on `workflow_dispatch`.

**Tech Stack:** Node.js 18+, `@notionhq/client`, `node:test` (built-in), GitHub Actions, GitHub Pages

---

## File Structure

**New files:**
- `lib/render.js` — Pure HTML generation functions (one per section)
- `lib/notion.js` — Notion database fetch functions
- `lib/images.js` — Image download utility (handles redirects)
- `tests/render.test.js` — Unit tests for all render functions
- `templates/style.css` — CSS extracted from current HTML + new section styles
- `.github/workflows/deploy.yml` — Hourly + manual deploy pipeline
- `.gitignore` — Proper gitignore (replaces `gitignore` file without dot)

**Modified files:**
- `build.js` — Complete rewrite: orchestration only, delegates to lib/
- `.env` — Add 5 new database ID keys
- `env.example` — Mirror new keys (no values)
- `package.json` — Add `test` script

---

### Task 1: Create Notion databases via MCP

**Files:**
- Modify: `.env`
- Modify: `env.example`

- [ ] **Step 1: Find or create a parent page in Notion**

Use `notion-search` with query `"Mihail"` to find an existing page. If none found, use `notion-create-pages` to create a parent page:

```json
{
  "parent": { "type": "workspace", "workspace": true },
  "properties": {
    "title": [{ "type": "text", "text": { "content": "Mihail Website CMS" } }]
  }
}
```

Record the returned page ID as `PARENT_PAGE_ID`.

- [ ] **Step 2: Create database "Текстове"**

Use `notion-create-database`:
```json
{
  "parent": { "type": "page_id", "page_id": "<PARENT_PAGE_ID>" },
  "title": [{ "type": "text", "text": { "content": "Текстове" } }],
  "properties": {
    "Ключ": { "title": {} },
    "Съдържание": { "rich_text": {} }
  }
}
```
Record returned `id` as `NOTION_DB_TEXTS`.

- [ ] **Step 3: Create database "Предимства"**

Use `notion-create-database`:
```json
{
  "parent": { "type": "page_id", "page_id": "<PARENT_PAGE_ID>" },
  "title": [{ "type": "text", "text": { "content": "Предимства" } }],
  "properties": {
    "Заглавие": { "title": {} },
    "Описание": { "rich_text": {} },
    "Ред": { "number": { "format": "number" } }
  }
}
```
Record `id` as `NOTION_DB_PREDIMSTVA`.

- [ ] **Step 4: Create database "Услуги"**

Use `notion-create-database`:
```json
{
  "parent": { "type": "page_id", "page_id": "<PARENT_PAGE_ID>" },
  "title": [{ "type": "text", "text": { "content": "Услуги" } }],
  "properties": {
    "Наименование": { "title": {} },
    "Цена": { "rich_text": {} },
    "Описание": { "rich_text": {} },
    "Включено": { "rich_text": {} },
    "Популярен": { "checkbox": {} },
    "Ред": { "number": { "format": "number" } }
  }
}
```
Record `id` as `NOTION_DB_USLUGI`.

- [ ] **Step 5: Create database "Отзиви"**

Use `notion-create-database`:
```json
{
  "parent": { "type": "page_id", "page_id": "<PARENT_PAGE_ID>" },
  "title": [{ "type": "text", "text": { "content": "Отзиви" } }],
  "properties": {
    "Име": { "title": {} },
    "Възраст": { "number": { "format": "number" } },
    "Текст": { "rich_text": {} },
    "Звезди": { "number": { "format": "number" } },
    "Резултат": { "rich_text": {} }
  }
}
```
Record `id` as `NOTION_DB_OTZIVI`.

- [ ] **Step 6: Create database "Галерия"**

Use `notion-create-database`:
```json
{
  "parent": { "type": "page_id", "page_id": "<PARENT_PAGE_ID>" },
  "title": [{ "type": "text", "text": { "content": "Галерия" } }],
  "properties": {
    "Заглавие": { "title": {} },
    "Снимка": { "files": {} },
    "Ред": { "number": { "format": "number" } }
  }
}
```
Record `id` as `NOTION_DB_GALERIA`.

- [ ] **Step 7: Update .env with all 5 database IDs**

Add to `.env` (keep existing NOTION_API_KEY and NOTION_DATABASE_ID):
```
NOTION_DB_TEXTS=<id from Step 2>
NOTION_DB_PREDIMSTVA=<id from Step 3>
NOTION_DB_USLUGI=<id from Step 4>
NOTION_DB_OTZIVI=<id from Step 5>
NOTION_DB_GALERIA=<id from Step 6>
```

- [ ] **Step 8: Update env.example**

Add same keys without values to `env.example`:
```
NOTION_DB_TEXTS=
NOTION_DB_PREDIMSTVA=
NOTION_DB_USLUGI=
NOTION_DB_OTZIVI=
NOTION_DB_GALERIA=
```

---

### Task 2: Populate databases with current content

**Files:** None (Notion data only via MCP)

- [ ] **Step 1: Populate "Текстове" (25 records)**

Use `notion-create-pages` for each record in the `NOTION_DB_TEXTS` database.

Page structure for each record:
```json
{
  "parent": { "database_id": "<NOTION_DB_TEXTS>" },
  "properties": {
    "Ключ": { "title": [{ "text": { "content": "<KEY>" } }] },
    "Съдържание": { "rich_text": [{ "text": { "content": "<VALUE>" } }] }
  }
}
```

Create these 25 records:

| Ключ | Съдържание |
|------|------------|
| HERO_LABEL | Автоинструктор · София |
| HERO_H1_LINE1 | Шофьорски |
| HERO_H1_LINE2 | уроци без |
| HERO_H1_ACCENT | стрес |

> **Note:** The spec listed `HERO_TITLE` as a single key. The plan splits it into three keys (`HERO_H1_LINE1`, `HERO_H1_LINE2`, `HERO_H1_ACCENT`) so Михаил can change each line of the h1 independently from Notion without touching code. The italic orange accent word on the last line is always the `HERO_H1_ACCENT` key.
| HERO_SUBTITLE | Реални условия. Реална кола. Без театър — само знания, които остават. |
| HERO_CAR_NAME | Hyundai i30 2018 G |
| HERO_CAR_COMPANY | Крами-98 ЕООД |
| TRUST_1_NUM | 15+ |
| TRUST_1_LABEL | години зад волана и пред ученика |
| TRUST_2_NUM | Б + С |
| TRUST_2_LABEL | категории, за които подготвям |
| TRUST_3_NUM | 18– |
| TRUST_3_LABEL | до 60+ години — всяка възраст |
| TRUST_4_NUM | 1ви |
| TRUST_4_LABEL | опит при реални условия на пътя |
| CTA_TITLE | Готов ли си да тръгнеш? |
| CTA_TEXT | Обади се или запази час онлайн. Отговарям лично — без ботове, без чакане. |
| CTA_PHONE | +359896270674 |
| ABOUT_NAME | Михаил Гребенаров |
| ABOUT_ROLE | Автоинструктор · Крами-98 ЕООД |
| ABOUT_TEXT | Шофирам и преподавам от години. Знам, че воланът е нещо, което се учи с търпение — не с напрежение. Работя с хора от 18 до 60+ и подхождам към всеки индивидуално. |
| FOOTER_COPYRIGHT | © 2025 Крами-98 ЕООД · Всички права запазени |
| FOOTER_INSTAGRAM | # |
| FOOTER_FACEBOOK | # |
| NAV_CTA_TEXT | Запази час |

- [ ] **Step 2: Populate "Предимства" (4 records)**

Use `notion-create-pages` for each in `NOTION_DB_PREDIMSTVA`:

```json
{
  "parent": { "database_id": "<NOTION_DB_PREDIMSTVA>" },
  "properties": {
    "Заглавие": { "title": [{ "text": { "content": "Реален Sofia трафик" } }] },
    "Описание": { "rich_text": [{ "text": { "content": "Практикуваш там, където после ще шофираш — не на пусти площадки." } }] },
    "Ред": { "number": 1 }
  }
}
```

Create all 4:
1. Ред: 1 · Заглавие: "Реален Sofia трафик" · Описание: "Практикуваш там, където после ще шофираш — не на пусти площадки."
2. Ред: 2 · Заглавие: "Спокоен темп, ясни обяснения" · Описание: "Без крещене, без паника. Правя грешката разбираема, не срамна."
3. Ред: 3 · Заглавие: "Гъвкаво разписание" · Описание: "Сутрин, следобед, уикенд — намираме час, който ти пасва."
4. Ред: 4 · Заглавие: "Проследяваш напредъка си" · Описание: "След всеки урок знаеш точно какво е наред и какво следва."

- [ ] **Step 3: Populate "Услуги" (2 records)**

Record 1 (Категория Б):
```json
{
  "parent": { "database_id": "<NOTION_DB_USLUGI>" },
  "properties": {
    "Наименование": { "title": [{ "text": { "content": "Категория Б" } }] },
    "Цена": { "rich_text": [{ "text": { "content": "45 лв. / час" } }] },
    "Описание": { "rich_text": [{ "text": { "content": "Лична кола и градско шофиране. За начинаещи и опреснители от 18 до 60+ години." } }] },
    "Включено": { "rich_text": [{ "text": { "content": "1 час обучение\nРеален Sofia трафик\nГъвкав час\nОбратна връзка след урок" } }] },
    "Популярен": { "checkbox": true },
    "Ред": { "number": 1 }
  }
}
```

Record 2 (Категория С):
```json
{
  "parent": { "database_id": "<NOTION_DB_USLUGI>" },
  "properties": {
    "Наименование": { "title": [{ "text": { "content": "Категория С" } }] },
    "Цена": { "rich_text": [{ "text": { "content": "60 лв. / час" } }] },
    "Описание": { "rich_text": [{ "text": { "content": "Камиони и тежкотоварни превозни средства. За шофьори с опит или нови в категорията." } }] },
    "Включено": { "rich_text": [{ "text": { "content": "1 час обучение\nАвтомагистрали и градски трафик\nПрофесионална консултация" } }] },
    "Популярен": { "checkbox": false },
    "Ред": { "number": 2 }
  }
}
```

- [ ] **Step 4: Populate "Отзиви" (3 sample records)**

Create 3 pages in `NOTION_DB_OTZIVI`:

1. Име: "Иван Петров" · Възраст: 24 · Звезди: 5 · Резултат: "Взе изпита от 1-ви опит" · Текст: "Михаил обясни всичко спокойно и ясно. Без паника, без крещене — само знания. Взех изпита от първи път."
2. Име: "Мария Георгиева" · Възраст: 45 · Звезди: 5 · Резултат: "Категория Б" · Текст: "Страхотен инструктор. Подхожда индивидуално към всеки. Препоръчвам особено на по-възрастните."
3. Име: "Георги Димитров" · Възраст: 31 · Звезди: 5 · Резултат: "Категория С" · Текст: "Гъвкаво разписание, реални пътища, спокоен темп. Точно това ми трябваше за категория С."

Use same `notion-create-pages` structure with matching property names.

---

### Task 3: Set up file structure and extract CSS

**Files:**
- Create: `lib/render.js` (empty placeholder)
- Create: `lib/notion.js` (empty placeholder)
- Create: `lib/images.js` (empty placeholder)
- Create: `tests/render.test.js` (empty placeholder)
- Create: `templates/style.css`
- Create: `.gitignore`
- Modify: `package.json`

- [ ] **Step 1: Create directories**

```bash
mkdir -p lib tests .github/workflows
```

- [ ] **Step 2: Create placeholder files**

```bash
echo "" > lib/render.js
echo "" > lib/notion.js
echo "" > lib/images.js
echo "" > tests/render.test.js
```

- [ ] **Step 3: Create .gitignore**

Delete the existing `gitignore` file (without dot) and create a proper `.gitignore`:

On Windows (PowerShell): `Remove-Item gitignore`  
On macOS/Linux: `rm gitignore`

Contents of new `.gitignore`:
```
node_modules/
dist/
.env
.superpowers/
```

- [ ] **Step 4: Create templates/style.css**

Write `templates/style.css` with the full CSS (extracted from `mihail_avto_instruktor_website.html` lines 6–469, minus the old `.cat-*` and `.brief-*` classes, plus new section styles):

```css
@import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:wght@400;500&display=swap');

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

:root {
  --bg: #F5F2EC;
  --text: #1A1916;
  --accent: #D4591A;
  --muted: #6B6860;
  --line: rgba(26,25,22,0.12);
  --serif: 'Instrument Serif', Georgia, serif;
  --sans: 'DM Sans', sans-serif;
}

body {
  background: var(--bg);
  color: var(--text);
  font-family: var(--sans);
  font-size: 16px;
  line-height: 1.6;
  max-width: 390px;
  margin: 0 auto;
  -webkit-font-smoothing: antialiased;
}

/* NAV */
nav { display: flex; justify-content: space-between; align-items: center; padding: 20px 24px 18px; border-bottom: 0.5px solid var(--line); }
.nav-logo { font-family: var(--serif); font-size: 18px; letter-spacing: -0.3px; }
.nav-cta { font-family: var(--sans); font-size: 13px; font-weight: 500; color: var(--accent); text-decoration: none; border: 1px solid var(--accent); padding: 7px 14px; border-radius: 2px; letter-spacing: 0.02em; }

/* HERO */
.hero { padding: 48px 24px 0; position: relative; }
.hero-label { font-family: var(--sans); font-size: 11px; font-weight: 500; letter-spacing: 0.12em; text-transform: uppercase; color: var(--muted); margin-bottom: 20px; display: flex; align-items: center; gap: 10px; }
.hero-label::before { content: ''; display: inline-block; width: 24px; height: 1px; background: var(--accent); }
h1 { font-family: var(--serif); font-size: 46px; line-height: 1.05; letter-spacing: -1px; font-weight: 400; margin-bottom: 10px; }
h1 em { font-style: italic; color: var(--accent); }
.hero-sub { font-size: 15px; color: var(--muted); line-height: 1.55; margin-top: 16px; max-width: 280px; }

/* CAR BLOCK */
.car-block { margin: 36px 0 0; position: relative; background: #EAE6DE; border-radius: 4px; overflow: hidden; aspect-ratio: 4/3; display: flex; align-items: flex-end; }
.car-caption { position: relative; z-index: 2; background: var(--text); color: var(--bg); font-family: var(--sans); font-size: 12px; padding: 10px 16px; width: 100%; display: flex; justify-content: space-between; align-items: center; }
.car-caption strong { font-weight: 500; }
.car-caption span { color: rgba(245,242,236,0.5); font-size: 11px; }

/* TRUST BAR */
.trust-bar { padding: 28px 24px; display: grid; grid-template-columns: 1fr 1fr; gap: 0; border-bottom: 0.5px solid var(--line); }
.trust-item { padding: 16px 0; border-bottom: 0.5px solid var(--line); }
.trust-item:nth-child(odd) { border-right: 0.5px solid var(--line); padding-right: 20px; }
.trust-item:nth-child(even) { padding-left: 20px; }
.trust-item:nth-child(3), .trust-item:nth-child(4) { border-bottom: none; }
.trust-num { font-family: var(--serif); font-size: 36px; line-height: 1; letter-spacing: -1px; font-weight: 400; }
.trust-num sup { font-size: 18px; vertical-align: super; color: var(--accent); }
.trust-label { font-size: 12px; color: var(--muted); margin-top: 4px; line-height: 1.4; }

/* SECTION (shared) */
.section { padding: 48px 24px; border-bottom: 0.5px solid var(--line); }
.section-tag { font-size: 10px; font-weight: 500; letter-spacing: 0.15em; text-transform: uppercase; color: var(--muted); margin-bottom: 24px; }
h2 { font-family: var(--serif); font-size: 32px; line-height: 1.1; letter-spacing: -0.5px; font-weight: 400; margin-bottom: 24px; }

/* ПРЕДИМСТВА */
.feature-list { list-style: none; display: flex; flex-direction: column; gap: 0; }
.feature-item { display: grid; grid-template-columns: 32px 1fr; gap: 12px; align-items: start; padding: 16px 0; border-bottom: 0.5px solid var(--line); }
.feature-item:last-child { border-bottom: none; }
.feature-num { font-family: var(--serif); font-size: 13px; color: var(--accent); margin-top: 1px; }
.feature-text strong { display: block; font-size: 15px; font-weight: 500; margin-bottom: 2px; }
.feature-text p { font-size: 13px; color: var(--muted); line-height: 1.5; }

/* УСЛУГИ — Вариант C (популярна изпъква + малки карти) */
.c-featured { background: var(--text); color: var(--bg); padding: 24px 20px; border-radius: 2px; margin-bottom: 10px; }
.c-feat-badge { font-size: 9px; font-weight: 500; letter-spacing: 0.12em; text-transform: uppercase; color: var(--accent); margin-bottom: 12px; }
.c-feat-name { font-family: var(--serif); font-size: 26px; letter-spacing: -0.5px; line-height: 1.1; margin-bottom: 8px; }
.c-feat-desc { font-size: 13px; opacity: 0.7; line-height: 1.5; margin-bottom: 16px; }
.c-feat-row { display: flex; justify-content: space-between; align-items: flex-end; }
.c-feat-price { font-family: var(--serif); font-size: 36px; letter-spacing: -1.5px; }
.c-feat-included { font-size: 10px; opacity: 0.5; list-style: none; display: flex; flex-direction: column; gap: 3px; text-align: right; }
.c-feat-included li::before { content: '✓ '; }
.c-secondary { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.c-sec-card { border: 0.5px solid var(--line); padding: 16px 14px; border-radius: 2px; }
.c-sec-name { font-family: var(--serif); font-size: 18px; margin-bottom: 4px; }
.c-sec-desc { font-size: 11px; color: var(--muted); line-height: 1.4; margin-bottom: 10px; }
.c-sec-price { font-family: var(--serif); font-size: 20px; letter-spacing: -0.5px; color: var(--accent); }

/* ОТЗИВИ — Вариант B (карти с автор) */
.b-cards { display: flex; flex-direction: column; gap: 10px; }
.b-card { border: 0.5px solid var(--line); padding: 18px 16px; border-radius: 2px; }
.b-card-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px; }
.b-stars { color: var(--accent); font-size: 12px; letter-spacing: 1px; }
.b-result-tag { font-size: 9px; font-weight: 500; letter-spacing: 0.1em; text-transform: uppercase; color: var(--text); background: #E8E4DC; padding: 3px 7px; border-radius: 1px; max-width: 130px; text-align: right; line-height: 1.4; }
.b-text { font-size: 13px; color: var(--muted); line-height: 1.55; margin-bottom: 10px; }
.b-author { display: flex; gap: 10px; align-items: center; }
.b-avatar { width: 28px; height: 28px; border-radius: 50%; background: var(--text); display: flex; align-items: center; justify-content: center; color: var(--bg); font-family: var(--serif); font-size: 13px; flex-shrink: 0; }
.b-name { font-size: 12px; font-weight: 500; }
.b-age { font-size: 11px; color: var(--muted); }

/* ГАЛЕРИЯ — Вариант C (пълна ширина, наредени) */
.c-stack { display: flex; flex-direction: column; gap: 10px; }
.c-photo { position: relative; border-radius: 2px; overflow: hidden; }
.c-photo img { width: 100%; display: block; object-fit: cover; aspect-ratio: 4/3; }
.c-label { background: var(--text); color: var(--bg); font-family: var(--sans); font-size: 12px; padding: 10px 14px; }

/* CTA */
.cta-section { padding: 56px 24px 48px; border-bottom: 0.5px solid var(--line); }
.cta-section h2 { margin-bottom: 8px; }
.cta-section p { font-size: 15px; color: var(--muted); margin-bottom: 32px; line-height: 1.55; }
.cta-primary { display: flex; align-items: center; justify-content: space-between; background: var(--text); color: var(--bg); padding: 18px 20px; border-radius: 2px; text-decoration: none; margin-bottom: 10px; font-weight: 500; font-size: 15px; }
.cta-primary .arrow { font-family: var(--serif); font-size: 22px; opacity: 0.6; }
.cta-secondary { display: flex; align-items: center; justify-content: space-between; background: transparent; color: var(--text); padding: 18px 20px; border-radius: 2px; text-decoration: none; font-size: 15px; border: 0.5px solid var(--line); }
.cta-secondary .arrow { font-size: 18px; opacity: 0.4; }

/* ABOUT */
.about-section { padding: 48px 24px; border-bottom: 0.5px solid var(--line); }
.about-name { font-family: var(--serif); font-size: 22px; font-style: italic; margin-bottom: 4px; }
.about-role { font-size: 12px; color: var(--muted); letter-spacing: 0.05em; text-transform: uppercase; margin-bottom: 20px; }
.about-text { font-size: 15px; color: var(--muted); line-height: 1.65; }
.about-divider { width: 32px; height: 1px; background: var(--accent); margin: 20px 0; }

/* FOOTER */
footer { padding: 32px 24px; display: flex; flex-direction: column; gap: 16px; }
.footer-logo { font-family: var(--serif); font-size: 20px; letter-spacing: -0.3px; }
.footer-links { display: flex; flex-direction: column; gap: 10px; }
.footer-link { font-size: 13px; color: var(--muted); text-decoration: none; display: flex; align-items: center; gap: 8px; }
.footer-bottom { font-size: 11px; color: var(--muted); padding-top: 16px; border-top: 0.5px solid var(--line); opacity: 0.6; }
```

- [ ] **Step 5: Add test script to package.json**

Replace `package.json` contents:
```json
{
  "name": "mihail-website",
  "version": "1.0.0",
  "description": "Личен уебсайт с Notion като CMS",
  "scripts": {
    "build": "node build.js",
    "test": "node --test tests/render.test.js",
    "clean": "node -e \"const fs=require('fs');fs.rmSync('./dist',{recursive:true,force:true});console.log('dist/ изчистен');\"",
    "rebuild": "npm run clean && npm run build"
  },
  "dependencies": {
    "@notionhq/client": "^2.2.15",
    "dotenv": "^16.4.5"
  },
  "engines": {
    "node": ">=18.0.0"
  }
}
```

- [ ] **Step 6: Initialize git and make first commit**

```bash
git init
git add templates/style.css lib/ tests/ .gitignore package.json
git commit -m "chore: set up file structure for Notion CMS"
```

---

### Task 4: Write lib/render.js (TDD)

**Files:**
- Modify: `tests/render.test.js`
- Modify: `lib/render.js`

- [ ] **Step 1: Write failing tests in tests/render.test.js**

```javascript
const { test } = require('node:test');
const assert = require('node:assert');
const {
  renderStars,
  renderTrustBar,
  renderPredimstva,
  renderUslugi,
  renderOtzivi,
  renderGaleria,
} = require('../lib/render');

test('renderStars: 5 stars', () => {
  assert.strictEqual(renderStars(5), '★★★★★');
});
test('renderStars: 3 stars', () => {
  assert.strictEqual(renderStars(3), '★★★☆☆');
});
test('renderStars: 0 stars', () => {
  assert.strictEqual(renderStars(0), '☆☆☆☆☆');
});

test('renderTrustBar: renders 4 items', () => {
  const texts = {
    TRUST_1_NUM: '15+', TRUST_1_LABEL: 'години',
    TRUST_2_NUM: 'Б+С', TRUST_2_LABEL: 'категории',
    TRUST_3_NUM: '18–', TRUST_3_LABEL: 'до 60+',
    TRUST_4_NUM: '1ви', TRUST_4_LABEL: 'опит',
  };
  const html = renderTrustBar(texts);
  assert.ok(html.includes('15+'), 'should include TRUST_1_NUM');
  assert.ok(html.includes('години'), 'should include TRUST_1_LABEL');
  assert.ok(html.includes('Б+С'), 'should include TRUST_2_NUM');
  assert.ok(html.includes('1ви'), 'should include TRUST_4_NUM');
  assert.ok(html.includes('trust-bar'), 'should have trust-bar class');
});

test('renderPredimstva: numbers and titles', () => {
  const items = [
    { title: 'Реален трафик', description: 'Практикуваш...' },
    { title: 'Спокоен темп', description: 'Без крещене...' },
  ];
  const html = renderPredimstva(items);
  assert.ok(html.includes('01'), 'should include item number 01');
  assert.ok(html.includes('Реален трафик'), 'should include first title');
  assert.ok(html.includes('02'), 'should include item number 02');
  assert.ok(html.includes('Спокоен темп'), 'should include second title');
});
test('renderPredimstva: empty returns empty string', () => {
  assert.strictEqual(renderPredimstva([]), '');
});

test('renderUslugi: popular item in featured block', () => {
  const uslugi = [
    { name: 'Кат. Б', price: '45 лв.', description: 'Лична кола', included: ['1 час', 'Трафик'], popular: true },
    { name: 'Кат. С', price: '60 лв.', description: 'Камиони', included: ['1 час'], popular: false },
  ];
  const html = renderUslugi(uslugi);
  assert.ok(html.includes('c-featured'), 'popular item should use c-featured');
  assert.ok(html.includes('Най-търсена'), 'should show popular badge');
  assert.ok(html.includes('45 лв.'), 'should include popular price');
  assert.ok(html.includes('c-secondary'), 'should render non-popular items');
  assert.ok(html.includes('Кат. С'), 'should include non-popular item name');
});
test('renderUslugi: no popular shows all as small cards', () => {
  const uslugi = [
    { name: 'Кат. Б', price: '45 лв.', description: 'Desc', included: [], popular: false },
    { name: 'Кат. С', price: '60 лв.', description: 'Desc', included: [], popular: false },
  ];
  const html = renderUslugi(uslugi);
  assert.ok(!html.includes('c-featured'), 'should not have featured block when no popular');
  assert.ok(html.includes('c-secondary'), 'should render all as small cards');
  assert.ok(html.includes('Кат. Б') && html.includes('Кат. С'), 'should render both items');
});
test('renderUslugi: empty returns empty string', () => {
  assert.strictEqual(renderUslugi([]), '');
});

test('renderOtzivi: renders cards with stars and author initial', () => {
  const otzivi = [
    { name: 'Иван Петров', age: 24, text: 'Страхотен!', stars: 5, result: 'Взе изпита' },
  ];
  const html = renderOtzivi(otzivi);
  assert.ok(html.includes('b-card'), 'should render b-card');
  assert.ok(html.includes('★★★★★'), 'should render 5 stars');
  assert.ok(html.includes('Страхотен!'), 'should include review text');
  assert.ok(html.includes('Иван Петров'), 'should include author name');
  assert.ok(html.includes('>И<'), 'should render author initial in avatar');
  assert.ok(html.includes('Взе изпита'), 'should include result');
});
test('renderOtzivi: empty returns empty string', () => {
  assert.strictEqual(renderOtzivi([]), '');
});

test('renderGaleria: renders photos with captions', () => {
  const galeria = [{ title: 'Hyundai i30', localPath: 'images/abc123.jpg' }];
  const html = renderGaleria(galeria);
  assert.ok(html.includes('c-photo'), 'should render c-photo');
  assert.ok(html.includes('images/abc123.jpg'), 'should include image path');
  assert.ok(html.includes('Hyundai i30'), 'should include caption');
});
test('renderGaleria: empty returns empty string', () => {
  assert.strictEqual(renderGaleria([]), '');
});
```

- [ ] **Step 2: Run tests — confirm all fail**

```bash
npm test
```

Expected: `Cannot find module '../lib/render'` or similar — all tests fail.

- [ ] **Step 3: Implement lib/render.js**

```javascript
function renderStars(n) {
  return '★'.repeat(n) + '☆'.repeat(5 - n);
}

function renderTrustBar(texts) {
  const items = [1, 2, 3, 4].map(i => ({
    num: texts[`TRUST_${i}_NUM`] || '',
    label: texts[`TRUST_${i}_LABEL`] || '',
  }));
  return `<div class="trust-bar">${items.map(({ num, label }) => `
  <div class="trust-item">
    <div class="trust-num">${num.replace(/(ви|ра|ти)$/, '<sup>$1</sup>')}</div>
    <div class="trust-label">${label}</div>
  </div>`).join('')}
</div>`;
}

function renderPredimstva(items) {
  if (!items.length) return '';
  return `<ul class="feature-list">${items.map((item, i) => `
  <li class="feature-item">
    <span class="feature-num">${String(i + 1).padStart(2, '0')}</span>
    <div class="feature-text">
      <strong>${item.title}</strong>
      <p>${item.description}</p>
    </div>
  </li>`).join('')}
</ul>`;
}

function renderServiceCard(u) {
  return `<div class="c-sec-card">
  <div class="c-sec-name">${u.name}</div>
  <div class="c-sec-desc">${u.description}</div>
  <div class="c-sec-price">${u.price}</div>
</div>`;
}

function renderUslugi(uslugi) {
  if (!uslugi.length) return '';
  const popular = uslugi.find(u => u.popular);
  const others = uslugi.filter(u => !u.popular);
  if (!popular) {
    return `<div class="c-secondary">${uslugi.map(renderServiceCard).join('')}</div>`;
  }
  return `<div class="c-featured">
  <div class="c-feat-badge">⭐ Най-търсена</div>
  <div class="c-feat-name">${popular.name}</div>
  <div class="c-feat-desc">${popular.description}</div>
  <div class="c-feat-row">
    <div class="c-feat-price">${popular.price}</div>
    ${popular.included.length ? `<ul class="c-feat-included">${popular.included.map(item => `<li>${item}</li>`).join('')}</ul>` : ''}
  </div>
</div>${others.length ? `\n<div class="c-secondary">${others.map(renderServiceCard).join('')}</div>` : ''}`;
}

function renderOtzivi(otzivi) {
  if (!otzivi.length) return '';
  return `<div class="b-cards">${otzivi.map(o => `
  <div class="b-card">
    <div class="b-card-top">
      <div class="b-stars">${renderStars(o.stars)}</div>
      ${o.result ? `<div class="b-result-tag">${o.result}</div>` : ''}
    </div>
    <div class="b-text">&ldquo;${o.text}&rdquo;</div>
    <div class="b-author">
      <div class="b-avatar">${o.name.charAt(0)}</div>
      <div>
        <div class="b-name">${o.name}</div>
        <div class="b-age">${o.age} години</div>
      </div>
    </div>
  </div>`).join('')}
</div>`;
}

function renderGaleria(galeria) {
  if (!galeria.length) return '';
  return `<div class="c-stack">${galeria.map(g => `
  <div class="c-photo">
    <img src="${g.localPath}" alt="${g.title}" loading="lazy">
    <div class="c-label">${g.title}</div>
  </div>`).join('')}
</div>`;
}

module.exports = {
  renderStars,
  renderTrustBar,
  renderPredimstva,
  renderUslugi,
  renderOtzivi,
  renderGaleria,
};
```

- [ ] **Step 4: Run tests — confirm all pass**

```bash
npm test
```

Expected: All 13 tests pass (`✓ 13 tests`).

- [ ] **Step 5: Commit**

```bash
git add lib/render.js tests/render.test.js
git commit -m "feat: add HTML render functions with full test coverage"
```

---

### Task 5: Write lib/notion.js and lib/images.js

**Files:**
- Modify: `lib/notion.js`
- Modify: `lib/images.js`

- [ ] **Step 1: Write lib/notion.js**

```javascript
function getPlainText(richText) {
  if (!richText || !Array.isArray(richText)) return '';
  return richText.map(t => t.plain_text || '').join('');
}

async function fetchAll(notion, dbId, opts = {}) {
  const pages = [];
  let cursor;
  while (true) {
    const res = await notion.databases.query({
      database_id: dbId,
      start_cursor: cursor,
      page_size: 100,
      ...opts,
    });
    pages.push(...res.results);
    if (!res.has_more) break;
    cursor = res.next_cursor;
  }
  return pages;
}

async function fetchTexts(notion, dbId) {
  const pages = await fetchAll(notion, dbId);
  const result = {};
  for (const page of pages) {
    const key = getPlainText(page.properties['Ключ']?.title);
    const value = getPlainText(page.properties['Съдържание']?.rich_text);
    if (key) result[key] = value;
  }
  return result;
}

async function fetchPredimstva(notion, dbId) {
  const pages = await fetchAll(notion, dbId, {
    sorts: [{ property: 'Ред', direction: 'ascending' }],
  });
  return pages.map(page => ({
    title: getPlainText(page.properties['Заглавие']?.title),
    description: getPlainText(page.properties['Описание']?.rich_text),
  })).filter(p => p.title);
}

async function fetchUslugi(notion, dbId) {
  const pages = await fetchAll(notion, dbId, {
    sorts: [{ property: 'Ред', direction: 'ascending' }],
  });
  return pages.map(page => ({
    name: getPlainText(page.properties['Наименование']?.title),
    price: getPlainText(page.properties['Цена']?.rich_text),
    description: getPlainText(page.properties['Описание']?.rich_text),
    included: getPlainText(page.properties['Включено']?.rich_text)
      .split('\n').filter(Boolean),
    popular: page.properties['Популярен']?.checkbox === true,
  })).filter(u => u.name);
}

async function fetchOtzivi(notion, dbId) {
  const pages = await fetchAll(notion, dbId);
  return pages.map(page => ({
    name: getPlainText(page.properties['Име']?.title),
    age: page.properties['Възраст']?.number ?? 0,
    text: getPlainText(page.properties['Текст']?.rich_text),
    stars: page.properties['Звезди']?.number ?? 5,
    result: getPlainText(page.properties['Резултат']?.rich_text),
  })).filter(o => o.name && o.text);
}

async function fetchGaleria(notion, dbId) {
  const pages = await fetchAll(notion, dbId, {
    sorts: [{ property: 'Ред', direction: 'ascending' }],
  });
  return pages.map(page => {
    const files = page.properties['Снимка']?.files || [];
    const file = files[0];
    const url = file?.type === 'file'
      ? file.file.url
      : (file?.external?.url || null);
    return {
      title: getPlainText(page.properties['Заглавие']?.title),
      url,
      pageId: page.id,
    };
  }).filter(g => g.title && g.url);
}

module.exports = { fetchTexts, fetchPredimstva, fetchUslugi, fetchOtzivi, fetchGaleria };
```

- [ ] **Step 2: Write lib/images.js**

```javascript
const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

function downloadImage(url, destPath) {
  return new Promise((resolve, reject) => {
    const proto = url.startsWith('https') ? https : http;
    const dir = path.dirname(destPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const file = fs.createWriteStream(destPath);
    proto.get(url, res => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        file.close();
        try { fs.unlinkSync(destPath); } catch (_) {}
        return downloadImage(res.headers.location, destPath).then(resolve).catch(reject);
      }
      res.pipe(file);
      file.on('finish', () => { file.close(); resolve(destPath); });
    }).on('error', err => {
      try { fs.unlinkSync(destPath); } catch (_) {}
      reject(err);
    });
  });
}

function imageExtension(url) {
  const match = url.split('?')[0].match(/\.(jpg|jpeg|png|gif|webp|avif)$/i);
  return match ? match[0].toLowerCase() : '.jpg';
}

module.exports = { downloadImage, imageExtension };
```

- [ ] **Step 3: Commit**

```bash
git add lib/notion.js lib/images.js
git commit -m "feat: add Notion fetchers and image download utility"
```

---

### Task 6: Rewrite build.js

**Files:**
- Modify: `build.js` (complete rewrite)

- [ ] **Step 1: Write new build.js**

```javascript
require('dotenv').config();
const { Client } = require('@notionhq/client');
const fs = require('fs');
const path = require('path');

const { fetchTexts, fetchPredimstva, fetchUslugi, fetchOtzivi, fetchGaleria } = require('./lib/notion');
const { renderTrustBar, renderPredimstva, renderUslugi, renderOtzivi, renderGaleria } = require('./lib/render');
const { downloadImage, imageExtension } = require('./lib/images');

const DIST_DIR = path.join(__dirname, 'dist');
const IMAGES_DIR = path.join(DIST_DIR, 'images');

function validateEnv() {
  const required = [
    'NOTION_API_KEY',
    'NOTION_DB_TEXTS',
    'NOTION_DB_PREDIMSTVA',
    'NOTION_DB_USLUGI',
    'NOTION_DB_OTZIVI',
    'NOTION_DB_GALERIA',
  ];
  for (const key of required) {
    if (!process.env[key]) {
      console.error(`❌ Липсва ${key} в .env файла`);
      process.exit(1);
    }
  }
}

async function processGaleria(rawGaleria) {
  if (!fs.existsSync(IMAGES_DIR)) fs.mkdirSync(IMAGES_DIR, { recursive: true });
  const result = [];
  for (const g of rawGaleria) {
    const slug = g.pageId.replace(/-/g, '').slice(0, 8);
    const ext = imageExtension(g.url);
    const filename = `${slug}${ext}`;
    const destPath = path.join(IMAGES_DIR, filename);
    try {
      await downloadImage(g.url, destPath);
      result.push({ title: g.title, localPath: `images/${filename}` });
      console.log(`  ✓ Снимка: ${g.title}`);
    } catch (err) {
      console.warn(`  ⚠️  Пропусната снимка "${g.title}": ${err.message}`);
    }
  }
  return result;
}

function copyPictures() {
  const src = path.join(__dirname, 'pictures');
  const dest = path.join(DIST_DIR, 'pictures');
  if (!fs.existsSync(src)) return;
  if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
  for (const file of fs.readdirSync(src)) {
    fs.copyFileSync(path.join(src, file), path.join(dest, file));
  }
}

function buildHtml({ texts, predimstva, uslugi, otzivi, galeria, css }) {
  const t = key => texts[key] || '';
  const phone = t('CTA_PHONE').replace(/\s/g, '');
  const ig = t('FOOTER_INSTAGRAM');
  const fb = t('FOOTER_FACEBOOK');

  return `<!DOCTYPE html>
<html lang="bg">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${t('ABOUT_NAME')} — Автоинструктор София</title>
<meta name="description" content="Шофьорски уроци в реални условия. ${t('ABOUT_NAME')}, ${t('ABOUT_ROLE')}.">
<style>${css}</style>
</head>
<body>

<nav>
  <span class="nav-logo">${t('ABOUT_NAME')}</span>
  <a class="nav-cta" href="tel:${phone}">${t('NAV_CTA_TEXT')}</a>
</nav>

<section class="hero">
  <p class="hero-label">${t('HERO_LABEL')}</p>
  <h1>${t('HERO_H1_LINE1')}<br>${t('HERO_H1_LINE2')}<br><em>${t('HERO_H1_ACCENT')}</em></h1>
  <p class="hero-sub">${t('HERO_SUBTITLE')}</p>
  <div class="car-block">
    <img src="pictures/kola.jpg" alt="${t('HERO_CAR_NAME')}" style="width:100%;height:100%;object-fit:cover;position:absolute;top:0;left:0;">
    <div class="car-caption">
      <strong>${t('HERO_CAR_NAME')}</strong>
      <span>${t('HERO_CAR_COMPANY')}</span>
    </div>
  </div>
</section>

${renderTrustBar(texts)}

<section class="section">
  <p class="section-tag">Как работя</p>
  <h2>Не те учим наизуст. Учим те да шофираш.</h2>
  ${renderPredimstva(predimstva)}
</section>

<section class="section">
  <p class="section-tag">Услуги</p>
  <h2>Какво предлагам</h2>
  ${renderUslugi(uslugi)}
</section>

${otzivi.length ? `<section class="section">
  <p class="section-tag">Отзиви</p>
  <h2>Какво казват курсистите</h2>
  ${renderOtzivi(otzivi)}
</section>` : ''}

${galeria.length ? `<section class="section">
  <p class="section-tag">Галерия</p>
  <h2>Колата и аз</h2>
  ${renderGaleria(galeria)}
</section>` : ''}

<section class="cta-section">
  <p class="section-tag">Следващата стъпка</p>
  <h2>${t('CTA_TITLE')}</h2>
  <p>${t('CTA_TEXT')}</p>
  <a class="cta-primary" href="tel:${phone}">
    <span>Обади се сега</span>
    <span class="arrow">→</span>
  </a>
  <a class="cta-secondary" href="tel:${phone}">
    <span>Запази час ↗</span>
    <span class="arrow">›</span>
  </a>
</section>

<section class="about-section">
  <p class="about-name">${t('ABOUT_NAME')}</p>
  <p class="about-role">${t('ABOUT_ROLE')}</p>
  <div class="about-divider"></div>
  <p class="about-text">${t('ABOUT_TEXT')}</p>
</section>

<footer>
  <div class="footer-logo">${t('ABOUT_NAME')}</div>
  <div class="footer-links">
    <a class="footer-link" href="tel:${phone}">☎ ${t('CTA_PHONE')}</a>
    ${ig && ig !== '#' ? `<a class="footer-link" href="${ig}">◎ Instagram</a>` : ''}
    ${fb && fb !== '#' ? `<a class="footer-link" href="${fb}">◎ Facebook</a>` : ''}
  </div>
  <div class="footer-bottom">${t('FOOTER_COPYRIGHT')}</div>
</footer>

</body>
</html>`;
}

async function build() {
  console.log('\n🔨 Стартира Notion CMS build...\n');
  validateEnv();

  const notion = new Client({ auth: process.env.NOTION_API_KEY });
  if (!fs.existsSync(DIST_DIR)) fs.mkdirSync(DIST_DIR, { recursive: true });

  const css = fs.readFileSync(path.join(__dirname, 'templates', 'style.css'), 'utf8');

  console.log('📡 Fetch от Notion...');
  const [texts, predimstva, uslugi, otzivi, rawGaleria] = await Promise.all([
    fetchTexts(notion, process.env.NOTION_DB_TEXTS),
    fetchPredimstva(notion, process.env.NOTION_DB_PREDIMSTVA),
    fetchUslugi(notion, process.env.NOTION_DB_USLUGI),
    fetchOtzivi(notion, process.env.NOTION_DB_OTZIVI),
    fetchGaleria(notion, process.env.NOTION_DB_GALERIA),
  ]);

  console.log('🖼  Изтегляне на снимки от Галерия...');
  const galeria = await processGaleria(rawGaleria);

  copyPictures();

  const html = buildHtml({ texts, predimstva, uslugi, otzivi, galeria, css });
  fs.writeFileSync(path.join(DIST_DIR, 'index.html'), html, 'utf8');

  console.log(`\n✨ Build завършен!`);
  console.log(`   Текстове:    ${Object.keys(texts).length} ключа`);
  console.log(`   Предимства:  ${predimstva.length}`);
  console.log(`   Услуги:      ${uslugi.length}`);
  console.log(`   Отзиви:      ${otzivi.length}`);
  console.log(`   Галерия:     ${galeria.length} снимки\n`);
}

build().catch(err => {
  console.error('\n❌ Build грешка:', err.message);
  if (err.code === 'unauthorized') console.error('   → Провери NOTION_API_KEY');
  else if (err.code === 'object_not_found') console.error('   → Провери database ID и дали интеграцията е добавена към базата');
  process.exit(1);
});
```

- [ ] **Step 2: Run build to verify**

```bash
npm run build
```

Expected output:
```
🔨 Стартира Notion CMS build...

📡 Fetch от Notion...
🖼  Изтегляне на снимки от Галерия...

✨ Build завършен!
   Текстове:    25 ключа
   Предимства:  4
   Услуги:      2
   Отзиви:      3
   Галерия:     0 снимки
```

Verify `dist/index.html` was generated.

- [ ] **Step 3: Open dist/index.html in browser and check each section**

Open the file directly in a browser. Verify:
- [ ] Nav shows "Михаил Гребенаров" and "Запази час" button
- [ ] Hero h1 shows "Шофьорски / уроци без / *стрес*" with italic orange accent
- [ ] Trust bar shows all 4 stats (15+, Б+С, 18–, 1ви)
- [ ] "Как работя" shows 4 numbered items
- [ ] Услуги: Категория Б appears as large dark featured block with "⭐ Най-търсена" badge; Категория С appears as small card below
- [ ] Отзиви: 3 cards each with stars, result badge, quoted text, avatar with initial, name and age
- [ ] Footer shows phone number

- [ ] **Step 4: Commit**

```bash
git add build.js
git commit -m "feat: rewrite build.js to generate site from Notion CMS"
```

---

### Task 7: GitHub Actions workflow and deploy

**Files:**
- Create: `.github/workflows/deploy.yml`

- [ ] **Step 1: Create .github/workflows/deploy.yml**

```yaml
name: Build and Deploy

on:
  schedule:
    - cron: '0 * * * *'
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm test

      - name: Build site
        env:
          NOTION_API_KEY: ${{ secrets.NOTION_API_KEY }}
          NOTION_DB_TEXTS: ${{ secrets.NOTION_DB_TEXTS }}
          NOTION_DB_PREDIMSTVA: ${{ secrets.NOTION_DB_PREDIMSTVA }}
          NOTION_DB_USLUGI: ${{ secrets.NOTION_DB_USLUGI }}
          NOTION_DB_OTZIVI: ${{ secrets.NOTION_DB_OTZIVI }}
          NOTION_DB_GALERIA: ${{ secrets.NOTION_DB_GALERIA }}
        run: npm run build

      - name: Upload Pages artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: dist/

  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    needs: build
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

- [ ] **Step 2: Configure GitHub Pages source**

In the GitHub repo (**Settings → Pages → Source**): select **GitHub Actions**.

- [ ] **Step 3: Add GitHub Secrets**

In **Settings → Secrets and variables → Actions → New repository secret**, add:

| Secret name | Value |
|---|---|
| `NOTION_API_KEY` | (from .env) |
| `NOTION_DB_TEXTS` | (from .env) |
| `NOTION_DB_PREDIMSTVA` | (from .env) |
| `NOTION_DB_USLUGI` | (from .env) |
| `NOTION_DB_OTZIVI` | (from .env) |
| `NOTION_DB_GALERIA` | (from .env) |

- [ ] **Step 4: Push to GitHub and verify first deploy**

```bash
git add .github/workflows/deploy.yml
git commit -m "ci: add GitHub Actions build and deploy workflow"
git push -u origin main
```

Go to the **Actions** tab in GitHub. A workflow run should start immediately on push. Verify both `build` and `deploy` jobs succeed.

- [ ] **Step 5: Test manual trigger**

In **Actions → Build and Deploy → Run workflow**: click the button. Verify the site is rebuilt and redeployed.

- [ ] **Step 6: Verify live site**

Open the GitHub Pages URL. Verify the full site looks correct — same design, all sections populated from Notion.
