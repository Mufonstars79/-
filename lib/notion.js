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
