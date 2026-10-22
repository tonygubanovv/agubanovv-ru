import test from 'node:test';
import assert from 'node:assert/strict';
import { parse, serialize } from 'parse5';
import { applyBlocks } from '../src/utils/blocks.ts';

const render = body => {
  const document = parse(`<div class="prose">${body}</div>`);
  applyBlocks(document);
  return serialize(document);
};

test('Quote marker becomes a card with the speaker under the words', () => {
  const result = render('<p>:::цитата Иван Иванов, руководитель отдела</p><p>Текст <strong>цитаты</strong>.</p><p>:::</p>');
  assert.match(result, /<blockquote class="quote">\s*<p>Текст <strong>цитаты<\/strong>\.<\/p>\s*<footer class="quote-by">\s*<span class="quote-name">Иван Иванов<\/span>\s*<span class="quote-role">руководитель отдела<\/span>\s*<\/footer>\s*<\/blockquote>/u);
  assert.doesNotMatch(result, /:::/u);
});

test('Markers work without blank lines, and a note carries text only', () => {
  const result = render('<p>:::note Важно\nПервый абзац.\n\nВторой абзац.\n:::</p>');
  assert.match(result, /<aside class="note"><span class="note-mark" aria-hidden="true"><\/span><div class="note-body"><p>Важно<\/p><p>Первый абзац\./u);
  assert.match(result, /Второй абзац\.<\/p><\/div><\/aside>/u);
  assert.doesNotMatch(result, /note-title/u);
  // Lines written straight under a marker stay one paragraph, and their words never grow together.
  assert.match(result, /Первый абзац\.\s+Второй абзац\./u);
});

test('An accent quote is the same card filled with the accent colour', () => {
  const result = render('<p>:::цитата-акцент Анна Петрова, основатель</p><p>Текст <em>цитаты</em>.</p><p>:::</p>');
  assert.match(result, /<blockquote class="quote accent">\s*<p>Текст <em>цитаты<\/em>\.<\/p>\s*<footer class="quote-by">\s*<span class="quote-name">Анна Петрова<\/span>\s*<span class="quote-role">основатель<\/span>/u);
  assert.match(render('<p>:::quote-accent Кто-то</p><p>Текст.</p><p>:::</p>'), /<blockquote class="quote accent">/u);
  // A bare :::акцент is not a block name: the card must stay a quote, so the old short word is not accepted.
  assert.match(render('<p>:::акцент Кто-то</p><p>Текст.</p><p>:::</p>'), /<p>:::акцент Кто-то<\/p>/u);
});

test('A picture with a caption becomes one figure, from an italic line or from the title', () => {
  const italic = render('<p><img src="/a.webp" alt="А"></p><p><em>Подпись курсивом.</em></p>');
  assert.equal(italic.match(/<figcaption>Подпись курсивом\.<\/figcaption>/gu)?.length, 1);
  assert.match(italic, /<figure><img src="\/a\.webp" alt="А">\s*<figcaption>/u);
  assert.doesNotMatch(italic, /<em>/u);
  const titled = render('<p><img src="/a.webp" alt="А" title="Подпись из title"></p>');
  assert.match(titled, /<figure><img src="\/a\.webp" alt="А">\s*<figcaption>Подпись из title<\/figcaption><\/figure>/u);
  assert.doesNotMatch(titled, /title="/u);
});

test('A broken marker stays on the page as the text he wrote', () => {
  const unclosed = render('<p>:::цитата Кто-то</p><p>Текст без конца.</p>');
  assert.match(unclosed, /<p>:::цитата Кто-то<\/p>/u);
  assert.match(unclosed, /<p>Текст без конца\.<\/p>/u);
  assert.doesNotMatch(unclosed, /blockquote/u);
  const unknown = render('<p>:::unknown Название</p><p>Текст.</p>');
  assert.match(unknown, /<p>:::unknown Название<\/p><p>Текст\.<\/p>/u);
  assert.doesNotMatch(unknown, /aside/u);
});

test('Only article content is rewritten, the rest of the page is untouched', () => {
  const outside = parse('<main><p>:::цитата Кто-то</p><p>Текст.</p><p>:::</p></main>');
  applyBlocks(outside);
  assert.match(serialize(outside), /<p>:::цитата Кто-то<\/p>/u);
  const code = render('<pre><code>:::цитата Кто-то\nТекст.\n:::</code></pre>');
  assert.match(code, /:::цитата Кто-то\nТекст\.\n:::/u);
  assert.doesNotMatch(code, /blockquote/u);
});
