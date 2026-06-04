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
    <div class="trust-num">${num}</div>
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
