/**
 * Локальный способ завести материал, не открывая админку:
 *   node scripts/new-post.mjs "Заголовок" --kind=case --topic=growth
 * Файл создаётся черновиком и проходит ту же схему, что и вадминка.
 */
import { writeFile } from 'node:fs/promises';
import { slugify } from './slugify.mjs';

const [title = '', ...rest] = process.argv.slice(2);
const arg = (name, fallback) => rest.find((item) => item.startsWith(`--${name}=`))?.split('=')[1] ?? fallback;

const kind = arg('kind', 'article');
const topic = arg('topic', 'positioning');
const slug = slugify(title);

if (!title || !slug) {
  console.error('Использование: node scripts/new-post.mjs "Заголовок" --kind=article|case --topic=<slug>');
  process.exit(1);
}

const today = new Date().toISOString().slice(0, 10);
const front = [
  `kind: ${kind}`,
  `title: "${title}"`,
  'dek: >-',
  '  Один абзац на 40-240 символов: что это за материал и зачем его читать.',
  `topic: ${topic}`,
  'tags: []',
  `date: ${today}`,
  'draft: true',
  'channels: []',
  ...(kind === 'case'
    ? [
        'context: Отрасль и масштаб, без имён клиентов',
        'duration: 3 месяца',
        'role: Product marketing',
        'metrics:',
        '  - value: "000 ₽"',
        '    label: "стоимость заявки"',
        '    trend: down',
      ]
    : []),
  'seo: {}',
].join('\n');

const body =
  kind === 'case'
    ? ['## Ситуация на входе', '', '', '## Что посчитали', '', ':::note Техзадание на данные', '', ':::', '', '## Результат', '', ':::takeaway', '', ':::'].join('\n')
    : ['## Почему это важно', '', '', '## Метод', '', '', '## Частые ошибки', '', ':::warn', '', ':::', ''].join('\n');

const path = `src/content/blog/${slug}.md`;
await writeFile(path, `---\n${front}\n---\n\n${body}\n`, 'utf8');
console.log(`Создан черновик: ${path}`);
