#!/usr/bin/env node
/**
 * Проверка авто-типографа на корпусе реальных строк сайта.
 *
 * Типограф имеет право менять только оформление. Он не вправе:
 *  - разрывать слово вставкой пробела (в том числе неразрывного);
 *  - добавлять или терять цифры и буквы;
 *  - не быть идемпотентным: повторная обработка не должна менять текст.
 *
 * Корпус: все строки из src/lib/copy/*.ts, подписи из src/lib/*.ts,
 * заголовки и тела материалов src/content/blog/*.md плюс набор
 * заведомо опасных фраз (союзы, сокращения, тире, кавычки, числа).
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { typesetText } from '../src/lib/typography.ts';

const root = fileURLToPath(new URL('..', import.meta.url));
const ru = /[а-яёА-ЯЁ]/;

const stringsIn = (text) => (text.match(/'[^'\n]*'|"[^"\n]*"|`[^`]*`/g) ?? []).map((s) => s.slice(1, -1));

const corpus = [];

for (const dir of ['src/lib/copy', 'src/lib']) {
  for (const file of readdirSync(join(root, dir))) {
    if (!file.endsWith('.ts')) continue;
    for (const line of stringsIn(readFileSync(join(root, dir, file), 'utf8'))) {
      if (ru.test(line) && line.length > 3) corpus.push([`${dir}/${file}`, line]);
    }
  }
}

for (const file of readdirSync(join(root, 'src/content/blog'))) {
  if (!file.endsWith('.md')) continue;
  const raw = readFileSync(join(root, 'src/content/blog', file), 'utf8');
  const body = raw.replace(/^---[\s\S]*?---/, '');
  for (const line of body.split('\n')) {
    const clean = line.replace(/^#+\s*/, '').trim();
    if (ru.test(clean) && clean.length > 3) corpus.push([`src/content/blog/${file}`, clean]);
  }
}

const tricky = [
  'Маркетинг, который начинается с продукта, а не с макета',
  'CPL снизился на 58 % за 3 мес. работы — при том же бюджете',
  'От 4 200 000 ₽ до 1,8 млн ₽: и т. д. в одном ряду',
  'Мы разобрали воронку: заявки, регистрации, первый платёж',
  'Правило «сначала цифры, потом гипотеза» работает и в B2B, и в B2C',
  'Тест 2 x 3 длился 14 дн., выборка — 12 500 человек',
  'Каналы: поиск, соцсети, ретаргет — и ни одного names-плейсхолдера',
  'Если ставка не сошлась, кампанию закрывают, а не «дожимают»',
];
for (const line of tricky) corpus.push(['tricky', line]);

/**
 * Последовательность букв и цифр — то, что типограф менять не обязан и не должен.
 * «x», «х» и «×» сводим к одному символу: правило умножения законно заменяет
 * букву на знак. Все остальные буквы сравниваются как есть.
 */
const skeleton = (s) => s.replace(/[×xх]/gi, 'X').replace(/[^\p{L}\p{N}]/gu, '');

const problems = [];

for (const [where, line] of corpus) {
  const once = typesetText(line);
  const twice = typesetText(once);

  if (skeleton(once) !== skeleton(line)) {
    problems.push(`${where}: потеряны или добавлены буквы/цифры\n  было:  ${line}\n  стало: ${once}`);
    continue;
  }

  const beforeWords = line.split(/[\s ]+/).filter(Boolean);
  const afterWords = once.split(/[\s ]+/).filter(Boolean);
  if (afterWords.length > beforeWords.length) {
    problems.push(`${where}: слово разорвано на части\n  было:  ${line}\n  стало: ${once}`);
    continue;
  }

  if (twice !== once) {
    problems.push(`${where}: не идемпотентно\n  pass1: ${once}\n  pass2: ${twice}`);
  }

  if (/ {2,}/.test(once)) {
    problems.push(`${where}: двойной пробел\n  ${once}`);
  }
}

if (problems.length) {
  console.error(`[typeset] найдено проблем: ${problems.length} из ${corpus.length} строк\n`);
  for (const problem of problems.slice(0, 25)) console.error(`— ${problem}\n`);
  process.exit(1);
}

console.log(`[typeset]OK проверено строк: ${corpus.length}. Буквы, цифры и границы слов на месте.`);
