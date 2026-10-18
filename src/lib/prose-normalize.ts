/**
 * Нормализация markdown перед сохранением из админки. AST-ретрайд через
 * remark не подходит: он экранирует «[ ]» в задачах и «[^1]» в сносках, то есть
 * ломает то, ради чего эти записи делались. Здесь только направленные правки.
 *
 * Правила совпадают с проверками scripts/check-content.mjs.
 */
import { CALLOUT_KINDS } from './directives';

const KIND_NAMES = Object.keys(CALLOUT_KINDS);

/** Вне блоков ``` — чтобы не править код и примеры. */
function outsideCode(source: string, edit: (text: string) => string) {
  const parts = source.split(/(```[\s\S]*?```|~~~[\s\S]*?~~~)/g);
  return parts
    .map((part, index) => (index % 2 === 1 ? part : edit(part)))
    .join('');
}

/** Один шаг нормализации: правка и формулировка для отчёта в админке. */
const STEPS: ReadonlyArray<{ what: string; edit: (text: string) => string; code?: boolean }> = [
  {
    // Вложенных контейнеров сайт не поддерживает: ::: всегда с начала строки.
    what: 'директивы сдвинуты к началу строки',
    code: false,
    edit: (text) => text.replace(/^[ \t]{1,3}(?=:::)/gm, ''),
  },
  {
    what: 'заголовки директив переведены в формат :::note[Текст]',
    code: false,
    edit: (text) =>
      text.replace(/^(:{3})([a-z][a-z-]*)[ \t]+(\S[^\n]*)$/gim, (match, fence, name, label) =>
        KIND_NAMES.includes(name) && !/^\[|\{/.test(label) ? `${fence}${name}[${label.trim()}]` : match,
      ),
  },
  {
    what: 'снято экранирование перед [ ] и [^1]',
    code: false,
    edit: (text) => text.replace(/\\\[([ xX^])/g, '[$1'),
  },
  {
    what: 'маркеры списков приведены к дефису',
    code: false,
    edit: (text) => text.replace(/^([ \t]*)\*[ \t]+/gm, '$1- '),
  },
  {
    what: 'убраны двойные пробелы в тексте',
    code: false,
    edit: (text) => text.replace(/([^\s]) {2,}([^\s])/g, '$1 $2'),
  },
  {
    what: 'убраны пробелы в конце строк',
    code: false,
    edit: (text) => text.replace(/[ \t]+$/gm, ''),
  },
  {
    what: 'схлопнуты пустые строки',
    code: true,
    edit: (text) => text.replace(/\n{3,}/g, '\n\n'),
  },
];

export function normalizeProse(source: string) {
  const text = source.replace(/\r\n/g, '\n');
  const result = STEPS.reduce(
    (acc, step) => (step.code ? step.edit(acc) : outsideCode(acc, step.edit)),
    text,
  );
  return result.replace(/\n+$/, '\n');
}

/** Что именно поправилось — чтобы админка показала список, а не молчала. */
export function describeNormalization(before: string, after: string) {
  if (before === after) return [];
  let text = before.replace(/\r\n/g, '\n');
  const applied: string[] = [];
  for (const step of STEPS) {
    const next = step.code ? step.edit(text) : outsideCode(text, step.edit);
    if (next !== text) applied.push(step.what);
    text = next;
  }
  return applied.length ? applied : ['изменён формат текста'];
}
