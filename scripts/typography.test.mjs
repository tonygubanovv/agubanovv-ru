import test from 'node:test';
import assert from 'node:assert/strict';
import { parse } from 'parse5';
import { typographHtml } from '../src/utils/typography.ts';

function nodes(html) {
  const result = [];
  const walk = node => { result.push(node); node.childNodes?.forEach(walk); };
  walk(parse(html));
  return result;
}
const attr = (node, name) => node.attrs?.find(item => item.name === name)?.value;

test('Russian typography applies across inline markup and remains idempotent', () => {
  const result = typographHtml('<p>Он сказал: "Это <em>пример</em>" - и ушел... В <strong>блоге</strong>  есть текст.</p>');
  assert.match(result, /«Это <em>пример<\/em>»/u);
  assert.match(result, /—/u);
  assert.match(result, /ушел…/u);
  assert.match(result, /В\u00a0<strong>блоге<\/strong>/u);
  assert.equal(typographHtml(result), result);
});

test('Code, scripts, SVG, URLs, IDs and data attributes stay intact', () => {
  const source = '<code>const x = "a - b"; a &lt; b;</code><pre> a  -  b...</pre><script>const text = "a - b...";</script><svg><text>A  -  B...</text></svg><a id="v-b-loge" href="https://example.com/a--b?q=1&amp;n=2" data-value="a - b">Пример</a>';
  const result = typographHtml(source);
  assert.ok(result.includes('<code>const x = "a - b"; a &lt; b;</code>'));
  assert.ok(result.includes('<pre> a  -  b...</pre>'));
  assert.ok(result.includes('<script>const text = "a - b...";</script>'));
  assert.ok(result.includes('<svg><text>A  -  B...</text></svg>'));
  const link = nodes(result).find(node => node.tagName === 'a');
  assert.equal(attr(link, 'href'), 'https://example.com/a--b?q=1&n=2');
  assert.equal(attr(link, 'id'), 'v-b-loge');
  assert.equal(attr(link, 'data-value'), 'a - b');
});

test('Readable metadata and JSON-LD are formatted without changing URLs or dates', () => {
  const result = typographHtml('<meta name="description" content="Текст в блоге - это &quot;пример&quot;..."><img alt="Фото в блоге"><button aria-label="Перейти в блог">Блог</button><script type="application/ld+json">{"@type":"BlogPosting","headline":"Текст в блоге - это пример...","url":"https://example.com/a--b","datePublished":"2026-10-22"}</script>');
  const all = nodes(result);
  assert.match(attr(all.find(node => node.tagName === 'meta'), 'content'), /в\u00a0блоге\u00a0— это «пример»…/u);
  assert.match(attr(all.find(node => node.tagName === 'img'), 'alt'), /в\u00a0блоге/u);
  assert.match(attr(all.find(node => node.tagName === 'button'), 'aria-label'), /в\u00a0блог/u);
  const json = JSON.parse(all.find(node => node.tagName === 'script').childNodes[0].value);
  assert.match(json.headline, /в\u00a0блоге\u00a0— это пример…/u);
  assert.equal(json.url, 'https://example.com/a--b');
  assert.equal(json.datePublished, '2026-10-22');
});

test('Markdown contact references use one shared value and reject unset contacts', () => {
  const source = '<p><a href="contact:telegram">Telegram</a></p><footer><a href="contact:telegram">Написать</a></footer>';
  const targets = nodes(typographHtml(source, { telegram: 'https://t.me/example_test' })).filter(node => node.tagName === 'a').map(node => attr(node, 'href'));
  assert.deepEqual(targets, ['https://t.me/example_test', 'https://t.me/example_test']);
  assert.throws(() => typographHtml(source), /must be configured/);
  assert.throws(() => typographHtml(source, { telegram: 'javascript:alert(1)' }), /must be configured/);
});

test('Explicit verbatim text preserves punctuation and spaces while surrounding UI is formatted', () => {
  const source = '<h1 data-preserve-text="true">Исходный "заголовок" - без правок...</h1><div data-preserve-text="true"><p>Текст  в блоге - <strong>"как есть"</strong>...</p><ul><li>В первом пункте</li></ul></div><footer>Текст в подвале - с обработкой...</footer>';
  const before = nodes(source);
  const after = nodes(typographHtml(source));
  const text = node => node.nodeName === '#text' ? node.value : (node.childNodes ?? []).map(text).join('');
  for (const tag of ['h1', 'p', 'li']) assert.equal(text(after.find(node => node.tagName === tag)), text(before.find(node => node.tagName === tag)));
  assert.match(text(after.find(node => node.tagName === 'footer')), /в\u00a0подвале\u00a0—/u);
});

test('Email links show the configured address instead of a generic label', () => {
  const result = typographHtml('<p><a href="contact:email">Написать на почту</a></p><a href="mailto:owner@example.com?subject=Hello">Почта</a>', { email: 'mailto:owner@example.com' });
  const links = nodes(result).filter(node => node.tagName === 'a');
  assert.deepEqual(links.map(node => node.childNodes.map(child => child.value ?? '').join('')), ['owner@example.com', 'owner@example.com']);
  assert.deepEqual(links.map(node => attr(node, 'href')), ['mailto:owner@example.com', 'mailto:owner@example.com?subject=Hello']);
});

test('External links open safely in a new tab, including verbatim content and contact aliases', () => {
  const source = '<div data-preserve-text="true"><p><a href="https://other.example/source" rel="nofollow">Исходный  текст...</a></p></div><a href="contact:telegram">Telegram</a><a href="//other.example/">Источник</a><a href="/blog/">Блог</a><a href="https://site.example/blog/">Внутренняя</a><a href="contact:email">Почта</a>';
  const output = typographHtml(source, { telegram: 'https://t.me/example', email: 'mailto:owner@example.com' }, 'https://site.example');
  const links = nodes(output).filter(node => node.tagName === 'a');
  for (const link of links.slice(0, 3)) {
    assert.equal(attr(link, 'target'), '_blank');
    assert.ok(attr(link, 'rel').includes('noopener'));
    assert.ok(attr(link, 'rel').includes('noreferrer'));
  }
  assert.ok(attr(links[0], 'rel').includes('nofollow'));
  assert.equal(links[0].childNodes[0].value, 'Исходный  текст...');
  for (const link of links.slice(3)) assert.equal(attr(link, 'target'), undefined);
  assert.equal(typographHtml(output, {}, 'https://site.example'), output);
});
