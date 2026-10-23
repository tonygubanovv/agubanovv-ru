import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseSeoTable, seoPath } from '../src/utils/seoTable.ts';

const header = '| Адрес | Title | Description | Ключевые фразы |\n| --- | --- | --- | --- |\n';
test('owner can leave keywords empty or use punctuation in metadata', () => {
  const pages = parseSeoTable(header + '| / | Тест &#124; пример | Описание, с запятой | |\n| /blog/ | Блог | Статьи | SEO, GEO |');
  assert.deepEqual(pages.get('/'), { title: 'Тест | пример', description: 'Описание, с запятой', keywords: '' });
  assert.equal(pages.get('/blog/').keywords, 'SEO, GEO');
});
test('invalid table edits fail with an actionable location', () => {
  for (const row of ['| / | | Текст | |', '| blog | Блог | Текст | |', '| / | Блог | Текст | лишняя | ячейка |', '| / | Блог | Текст |']) {
    assert.throws(() => parseSeoTable(header + row), /content\/seo.md, строка 3:/);
  }
  assert.throws(() => parseSeoTable(header + '| / | Один | Текст | |\n| / | Два | Текст | |'), /повторяется/);
  assert.throws(() => parseSeoTable(header), /пуста/);
});
test('metadata address matching keeps page paths and 404 stable', () => {
  assert.equal(seoPath(''), '/');
  assert.equal(seoPath('blog/example/'), '/blog/example/');
  assert.equal(seoPath('/legal/privacy/'), '/legal/privacy/');
  assert.equal(seoPath('404.html'), '/404.html');
});

test('visual editor table output preserves escaped pipes, backslashes and aligned headers', () => {
  const table = String.raw`| Адрес | Title | Description | Ключевые фразы |
| :---: | ---: | :--- | --- |
| / | Блог \| Антон Губанов | Путь C:\\folder | |
| /blog/ | Блог &#124; автор | Описание | GEO |`;
  const pages = parseSeoTable(table);
  assert.equal(pages.get('/').title, 'Блог | Антон Губанов');
  assert.equal(pages.get('/').description, String.raw`Путь C:\folder`);
  assert.equal(pages.get('/blog/').title, 'Блог | автор');
});
