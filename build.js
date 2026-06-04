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
