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
