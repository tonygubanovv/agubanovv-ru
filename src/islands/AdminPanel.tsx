import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { GitHubRepo, type WorkflowRun } from '@/lib/github';
import { typesetHtml } from '@/lib/typography-dom';
import { calloutsToHtml, directiveCheatSheet } from '@/lib/directives';
import { decoratePreviewHtml, previewFootnotes } from '@/lib/prose-preview';
import { describeNormalization, normalizeProse } from '@/lib/prose-normalize';
import { topics, publish } from '@/lib/site-config';
import {
  draftFileName,
  emptyDraft,
  parseFile,
  serializeDraft,
  validateDraft,
  type Draft,
  type Metric,
} from '@/lib/post-schema';
import { slugify } from '@/lib/utils';

const SESSION = 'site.admin.session.v1';

type Session = { token: string; repo: string; branch: string; contentDir: string; coverDir: string };
type FileRow = { name: string; path: string; sha: string; size: number; draft: Draft | null; failed?: string };

const loadSession = (): Session | null => {
  try {
    const raw = localStorage.getItem(SESSION);
    return raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    return null;
  }
};

const guessSession = (): Session => ({
  token: '',
  repo: publish.repo,
  branch: publish.branch,
  contentDir: publish.contentDir,
  coverDir: publish.coverDir,
});

marked.setOptions({ gfm: true, breaks: false });

export default function AdminPanel() {
  const [session, setSession] = useState<Session | null>(null);
  const [draftSession, setDraftSession] = useState<Session>(guessSession);
  const [remember, setRemember] = useState(true);
  const [repo, setRepo] = useState<GitHubRepo | null>(null);
  const [rows, setRows] = useState<FileRow[]>([]);
  const [view, setView] = useState<'login' | 'library'>('login');
  const [editor, setEditor] = useState<{ draft: Draft; sha?: string; isNew: boolean } | null>(null);
  const [runs, setRuns] = useState<WorkflowRun[]>([]);
  const [message, setMessage] = useState<{ level: 'ok' | 'error' | 'info'; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const saved = loadSession();
    if (saved?.token && saved?.repo) {
      setSession(saved);
      setDraftSession(saved);
      setRepo(new GitHubRepo(saved.token, saved.repo, saved.branch));
      setView('library');
    }
  }, []);

  const notify = (level: 'ok' | 'error' | 'info', text: string) => {
    setMessage({ level, text });
    if (level === 'ok') window.setTimeout(() => setMessage(null), 5000);
  };

  const connect = async () => {
    if (!draftSession.token.trim() || !draftSession.repo.includes('/')) {
      notify('error', 'Нужны токен и репозиторий в формате owner/name.');
      return;
    }
    setBusy(true);
    const candidate = new GitHubRepo(draftSession.token.trim(), draftSession.repo.trim(), draftSession.branch);
    try {
      const who = await candidate.verify();
      if (!who.canPush) notify('info', `Вошли как ${who.login}, но прав на запись нет — публиковать не получится.`);
      setRepo(candidate);
      setSession(draftSession);
      setView('library');
      if (remember)
        localStorage.setItem(SESSION, JSON.stringify({ ...draftSession, token: draftSession.token.trim() }));
      notify('ok', `Подключено: ${draftSession.repo} (${who.login}).`);
    } catch (error) {
      notify('error', (error as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const forget = () => {
    localStorage.removeItem(SESSION);
    setSession(null);
    setRepo(null);
    setRows([]);
    setView('login');
    setDraftSession({ ...guessSession(), token: '' });
  };

  const loadLibrary = async (client = repo) => {
    if (!client || !session) return;
    setBusy(true);
    try {
      const items = (await client.listDir(session.contentDir)).filter(
        (item) => item.type === 'file' && /\.(md|mdx)$/.test(item.name),
      );
      const parsed = await mapLimit(items, 6, async (item) => {
        const slug = item.name.replace(/\.(md|mdx)$/, '');
        try {
          const file = await client.readFile(item.path);
          return { ...item, slug, draft: parseFile(file.text, slug) } as FileRow & { slug: string };
        } catch (error) {
          return { ...item, draft: null, failed: (error as Error).message } as FileRow;
        }
      });
      setRows(
        (parsed as FileRow[]).sort(
          (a, b) => (b.draft?.date ?? '').localeCompare(a.draft?.date ?? '') || a.name.localeCompare(b.name),
        ),
      );
      setRuns(await client.recentRuns(4).catch(() => []));
    } catch (error) {
      notify('error', (error as Error).message);
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    if (view === 'library' && repo && rows.length === 0) void loadLibrary();
  }, [view, repo]);

  const commit = async (next: Draft, publishNow?: boolean) => {
    if (!client() || !session) return;
    const draft: Draft = publishNow === undefined ? next : { ...next, draft: !publishNow };
    const errors = validateDraft(draft);
    if (errors.length) {
      notify('error', `Не хватает полей: ${errors.map((error) => error.field).join(', ')}.`);
      return;
    }
    setBusy(true);
    const path = `${session.contentDir.replace(/\/+$/, '')}/${draftFileName(draft)}`;
    const fixes = describeNormalization(draft.body, normalizeProse(draft.body));
    try {
      const result = await client()!.writeFile(
        path,
        serializeDraft(draft),
        commitMessage(draft, editor?.isNew ?? true),
        editor?.sha,
      );
      notify(
        'ok',
        `${publishNow === false ? 'Черновик сохранён' : 'Опубликовано'}: ${path}${
          fixes.length ? `. Поправлено автоматически: ${fixes.join('; ').toLowerCase()}.` : ''
        }`,
      );
      setEditor({ draft, sha: result.content.sha, isNew: false });
      setSession(session);
      await loadLibrary();
    } catch (error) {
      const github = error as { status?: number };
      if (github.status === 409) {
        notify('error', 'Файл изменился в репозитории. Перечитайте его кнопкой ниже и повторите правку.');
      } else {
        notify('error', (error as Error).message);
      }
    } finally {
      setBusy(false);
    }
  };

  const client = () => (session ? new GitHubRepo(session.token, session.repo, session.branch) : null);

  const remove = async (row: FileRow) => {
    if (!client() || !confirm(`Удалить ${row.name} из репозитория? Действие видно в истории коммитов.`)) return;
    setBusy(true);
    try {
      await client()!.deleteFile(row.path, row.sha, `chore(blog): remove ${row.name.replace(/\.[a-z]+$/, '')}`);
      notify('ok', `${row.name} удалён.`);
      await loadLibrary();
    } catch (error) {
      notify('error', (error as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const openDraft = async (row: FileRow) => {
    if (!row.draft) {
      notify('error', row.failed ?? 'Файл не разобрался.');
      return;
    }
    setEditor({ draft: row.draft, sha: row.sha, isNew: false });
  };

  if (view === 'login') {
    return (
      <LoginScreen
        session={draftSession}
        setSession={setDraftSession}
        remember={remember}
        setRemember={setRemember}
        onConnect={connect}
        busy={busy}
        message={message}
      />
    );
  }

  if (editor) {
    return (
      <Editor
        state={editor}
        setState={setEditor}
        onChange={(draft) => setEditor({ ...editor, draft })}
        onSave={(draft) => commit(draft, true)}
        onSaveDraft={(draft) => commit(draft, false)}
        onClose={() => {
          setEditor(null);
          void loadLibrary();
        }}
        busy={busy}
        message={message}
        coverDir={session?.coverDir ?? 'public/images/covers'}
        client={client}
        notify={notify}
      />
    );
  }

  return (
    <div class="admin">
      <header class="admin-bar glass">
        <div>
          <p class="eyebrow">Публикация</p>
          <h1 class="admin-h1">Библиотека материалов</h1>
          <p class="admin-repo">
            {session?.repo} · ветка {session?.branch} · {session?.contentDir}
          </p>
        </div>
        <div class="admin-bar-actions">
          <button
            class="btn btn-primary btn-sm"
            type="button"
            onClick={() => setEditor({ draft: emptyDraft('article'), isNew: true })}
          >
            Новая статья
          </button>
          <button
            class="btn btn-ghost btn-sm"
            type="button"
            onClick={() => setEditor({ draft: emptyDraft('case'), isNew: true })}
          >
            Новый кейс
          </button>
          <button class="btn btn-quiet btn-sm" type="button" onClick={() => loadLibrary()} disabled={busy}>
            Обновить
          </button>
          <button class="btn btn-quiet btn-sm" type="button" onClick={forget}>
            Выйти
          </button>
        </div>
      </header>

      {message && (
        <p class="admin-notice" data-level={message.level}>
          {message.text}
        </p>
      )}

      <section class="admin-deploy" aria-label="Статус сборки">
        <p class="eyebrow">GitHub Actions</p>
        {runs.length === 0 ? (
          <p class="admin-muted">Прогоны ещё не появлялись — или у токена нет доступа к Actions.</p>
        ) : (
          <ul>
            {runs.map((run) => (
              <li key={run.id}>
                <a href={run.html_url} target="_blank" rel="noreferrer">
                  <span data-state={run.conclusion ?? run.status}>{run.name}</span>
                  <span class="run-meta">{new Date(run.created_at).toLocaleString('ru-RU')}</span>
                </a>
              </li>
            ))}
          </ul>
        )}
      </section>

      <table class="admin-table">
        <thead>
          <tr>
            <th>Материал</th>
            <th>Тип</th>
            <th>Статус</th>
            <th>Дата</th>
            <th aria-label="Действия" />
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr>
              <td colspan={5} class="admin-muted">
                {busy ? 'Читаю репозиторий…' : 'В папке пока нет материалов. Создайте первый.'}
              </td>
            </tr>
          )}
          {rows.map((row) => (
            <tr key={row.path}>
              <td>
                <span class="row-title">{row.draft?.title ?? row.name}</span>
                <span class="row-path">{row.name}</span>
              </td>
              <td>{row.draft?.kind === 'case' ? 'Кейс' : 'Статья'}</td>
              <td>
                <span class="chip" data-state={row.draft?.draft ? 'draft' : 'live'}>
                  {row.draft?.draft ? 'Черновик' : 'Опубликован'}
                </span>
              </td>
              <td class="num">{row.draft?.date ?? '—'}</td>
              <td class="row-actions">
                <button class="btn btn-quiet btn-sm" type="button" onClick={() => openDraft(row)}>
                  Править
                </button>
                <button class="btn btn-quiet btn-sm" type="button" onClick={() => remove(row)}>
                  Удалить
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function commitMessage(draft: Draft, isNew: boolean) {
  const action = draft.draft ? 'draft' : 'publish';
  const verb = isNew ? 'add' : 'update';
  return `chore(blog): ${verb} ${draftFileName(draft).replace(/\.md$/, '')} (${action})`;
}

async function mapLimit<T, R>(items: T[], limit: number, worker: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = [];
  let cursor = 0;
  const runners = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (cursor < items.length) {
      const index = cursor++;
      results[index] = await worker(items[index]);
    }
  });
  await Promise.all(runners);
  return results;
}

function LoginScreen(props: {
  session: Session;
  setSession: (next: Session) => void;
  remember: boolean;
  setRemember: (value: boolean) => void;
  onConnect: () => void;
  busy: boolean;
  message: { level: string; text: string } | null;
}) {
  const { session, setSession, remember, setRemember, onConnect, busy, message } = props;
  const field = (key: keyof Session) => (event: Event) =>
    setSession({ ...session, [key]: (event.target as HTMLInputElement).value });

  return (
    <div class="admin admin-login">
      <header class="admin-bar glass">
        <div>
          <p class="eyebrow">Публикация</p>
          <h1 class="admin-h1">Подключение к репозиторию</h1>
        </div>
      </header>

      <div class="login-grid">
        <form
          class="surface login-form"
          onSubmit={(event) => {
            event.preventDefault();
            onConnect();
          }}
        >
          <label class="field">
            <span>Токен GitHub</span>
            <input
              class="input"
              type="password"
              value={session.token}
              onInput={field('token')}
              placeholder="github_pat_…"
              autocomplete="off"
            />
          </label>
          <details class="login-advanced">
            <summary>Настройки репозитория</summary>
            <label class="field">
              <span>Репозиторий</span>
              <input class="input" value={session.repo} onInput={field('repo')} placeholder="owner/digital-marketer" />
            </label>
            <div class="login-row">
              <label class="field">
                <span>Ветка</span>
                <input class="input" value={session.branch} onInput={field('branch')} />
              </label>
              <label class="field">
                <span>Папка материалов</span>
                <input class="input" value={session.contentDir} onInput={field('contentDir')} />
              </label>
            </div>
          </details>
          <label class="switch">
            <input type="checkbox" checked={remember} onChange={() => setRemember(!remember)} />
            <span class="switch-track" />
            <span>Запомнить на этом компьютере</span>
          </label>
          <button class="btn btn-primary" type="submit" disabled={busy}>
            {busy ? 'Проверяю…' : 'Подключить'}
          </button>
          {message && (
            <p class="admin-notice" data-level={message.level}>
              {message.text}
            </p>
          )}
        </form>

        <aside class="login-notes">
          <h2>Первое подключение</h2>
          <ol>
            <li>
              <a
                href={
                  'https://github.com/settings/personal-access-tokens/new?' +
                  new URLSearchParams({
                    name: 't-gubanov.ru admin',
                    target_name: publish.repo.split('/')[0],
                    expires_in: '90',
                    contents: 'write',
                    actions: 'read',
                  })
                }
                target="_blank"
                rel="noopener noreferrer"
              >
                Создайте токен на GitHub
              </a>
              .
            </li>
            <li>Выберите Only select repositories → tgbnv-ru и нажмите Generate token.</li>
            <li>Скопируйте токен в поле слева и нажмите «Подключить».</li>
          </ol>
          <p>
            Адрес репозитория и остальные настройки уже заполнены. Токен вставляйте только здесь, в чат его отправлять
            не нужно.
          </p>
        </aside>
      </div>
    </div>
  );
}

function Editor(props: {
  state: { draft: Draft; sha?: string; isNew: boolean };
  setState: (next: { draft: Draft; sha?: string; isNew: boolean }) => void;
  onChange: (draft: Draft) => void;
  onSave: (draft: Draft) => void;
  onSaveDraft: (draft: Draft) => void;
  onClose: () => void;
  busy: boolean;
  coverDir: string;
  client: () => GitHubRepo | null;
  notify: (level: 'ok' | 'error' | 'info', text: string) => void;
  message: { level: string; text: string } | null;
}) {
  const { state, onChange, onSave, onSaveDraft, onClose, busy, coverDir, client, notify, message } = props;
  const draft = state.draft;
  const [tab, setTab] = useState<'write' | 'preview'>('write');
  const previewRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  const update = (patch: Partial<Draft>) => onChange({ ...draft, ...patch });

  /** Вставка блока директивы по курсору: кнопка вместо того, чтобы помнить синтаксис. */
  const insertDirective = (syntax: string) => {
    const block = syntax.startsWith(':::');
    const snippet = block ? `${syntax}\n\nТекст блока.\n\n:::\n` : syntax;
    const area = bodyRef.current;
    const body = draft.body ?? '';

    if (!area) {
      update({ body: `${block && body.trim() ? `${body.trimEnd()}\n\n` : body}${snippet}` });
      return;
    }

    const start = area.selectionStart;
    const end = area.selectionEnd;
    const before = body.slice(0, start);
    const after = body.slice(end);
    const pad = block && before && !before.endsWith('\n\n') ? (before.endsWith('\n') ? '\n' : '\n\n') : '';
    const tail = block && after && !after.startsWith('\n') ? '\n' : '';
    const next = `${before}${pad}${snippet}${tail}${after}`;
    update({ body: next });

    const caret = (before + pad + snippet).length;
    requestAnimationFrame(() => {
      area.focus();
      area.setSelectionRange(caret, caret);
    });
  };

  const errors = useMemo(() => validateDraft(draft), [draft]);
  const preview = useMemo(() => {
    // Предпросмотр показывает ровно тот текст, который уйдёт в репозиторий,
    // поэтому нормализация применяется до разметки директив.
    const html = marked.parse(previewFootnotes(calloutsToHtml(normalizeProse(draft.body)))) as string;
    return DOMPurify.sanitize(typesetHtml(decoratePreviewHtml(html)));
  }, [draft.body]);

  useEffect(() => {
    if (previewRef.current && tab === 'preview') previewRef.current.innerHTML = preview;
  }, [preview, tab]);

  const listField = (key: 'tags' | 'channels' | 'related') => (event: Event) =>
    update({
      [key]: (event.target as HTMLTextAreaElement).value
        .split(',')
        .map((part) => part.trim())
        .filter(Boolean),
    } as Partial<Draft>);

  const updateMetric = (index: number, patch: Partial<Metric>) =>
    update({ metrics: draft.metrics.map((metric, i) => (i === index ? { ...metric, ...patch } : metric)) });

  const addMetric = () => update({ metrics: [...draft.metrics, { value: '', label: '', trend: 'up' }] });

  const uploadCover = async (event: Event) => {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    if (file.size > 900_000) {
      notify('error', 'Файл больше 900 КБ: через Contents API такие не проходят. Уменьшите или сконвертируйте в webp.');
      return;
    }
    const bytes = new Uint8Array(await file.arrayBuffer());
    const extension = file.type.includes('png') ? 'png' : file.type.includes('jpeg') ? 'jpg' : 'webp';
    const name = `${draft.slug || slugify(draft.title || 'cover')}.${extension}`;
    const path = `${coverDir.replace(/\/+$/, '')}/${name}`;
    try {
      await client()?.writeBinary(path, bytes, `chore(blog): upload cover ${name}`);
      const publicUrl = `/${coverDir.replace(/^public\//, '').replace(/\/+$/, '')}/${name}`;
      update({ cover: { src: publicUrl, alt: draft.cover?.alt || draft.title || 'Обложка материала' } });
      notify('ok', `Обложка загружена: ${path}`);
    } catch (error) {
      notify('error', (error as Error).message);
    }
  };

  return (
    <div class="admin editor">
      <header class="admin-bar glass">
        <div>
          <p class="eyebrow">{draft.kind === 'case' ? 'Кейс' : 'Статья'}</p>
          <h1 class="admin-h1">{draft.title || 'Новый материал'}</h1>
          <p class="admin-repo">{state.isNew ? 'новый файл' : draftFileName(draft)}</p>
        </div>
        <div class="admin-bar-actions">
          <button class="btn btn-quiet btn-sm" type="button" onClick={onClose}>
            К списку
          </button>
          <button
            class="btn btn-ghost btn-sm"
            type="button"
            disabled={busy || errors.length > 0}
            onClick={() => onSaveDraft(draft)}
          >
            Сохранить черновик
          </button>
          <button
            class="btn btn-primary btn-sm"
            type="button"
            disabled={busy || errors.length > 0}
            onClick={() => onSave(draft)}
          >
            Опубликовать
          </button>
        </div>
      </header>

      {errors.length > 0 && (
        <ul class="admin-issues" data-level="error">
          {errors.map((error) => (
            <li>
              <span>{error.field}</span> {error.text}
            </li>
          ))}
        </ul>
      )}
      {message && (
        <p class="admin-notice" data-level={message.level}>
          {message.text}
        </p>
      )}

      <div class="editor-grid">
        <div class="editor-form surface">
          <fieldset>
            <legend>Основное</legend>
            <label class="field">
              <span>Заголовок</span>
              <input
                class="input"
                value={draft.title}
                onInput={(e) => update({ title: (e.target as HTMLInputElement).value })}
              />
            </label>
            <label class="field">
              <span>Slug файла</span>
              <input
                class="input"
                value={draft.slug}
                onInput={(e) => update({ slug: slugify((e.target as HTMLInputElement).value) })}
                placeholder="пусто — соберётся из заголовка"
              />
            </label>
            <label class="field">
              <span>Лид (анонс и сниппет)</span>
              <textarea
                class="textarea"
                rows={3}
                value={draft.dek}
                onInput={(e) => update({ dek: (e.target as HTMLTextAreaElement).value })}
              />
            </label>
            <label class="field">
              <span>Тип материала</span>
              <div class="segment">
                <button
                  type="button"
                  aria-pressed={draft.kind === 'article'}
                  onClick={() => update({ kind: 'article', metrics: [] })}
                >
                  Статья
                </button>
                <button type="button" aria-pressed={draft.kind === 'case'} onClick={() => update({ kind: 'case' })}>
                  Кейс
                </button>
              </div>
            </label>
          </fieldset>

          <fieldset>
            <legend>Классификация</legend>
            <div class="editor-row">
              <label class="field">
                <span>Тема</span>
                <select
                  class="select"
                  value={draft.topic}
                  onChange={(e) => update({ topic: (e.target as HTMLSelectElement).value })}
                >
                  {topics.map((topic) => (
                    <option value={topic.slug}>{topic.title}</option>
                  ))}
                </select>
              </label>
              <label class="field">
                <span>Дата</span>
                <input
                  class="input"
                  type="date"
                  value={draft.date}
                  onInput={(e) => update({ date: (e.target as HTMLInputElement).value })}
                />
              </label>
            </div>
            <label class="field">
              <span>Теги (через запятую, до 6)</span>
              <textarea class="textarea" rows={1} value={draft.tags.join(', ')} onInput={listField('tags')} />
            </label>
            <label class="field">
              <span>Каналы (через запятую)</span>
              <textarea class="textarea" rows={1} value={draft.channels.join(', ')} onInput={listField('channels')} />
            </label>
            <label class="field">
              <span>Связанные slug (через запятую)</span>
              <textarea class="textarea" rows={1} value={draft.related.join(', ')} onInput={listField('related')} />
            </label>
            <div class="editor-checks">
              <label class="switch">
                <input
                  type="checkbox"
                  checked={draft.featured}
                  onChange={() => update({ featured: !draft.featured })}
                />
                <span class="switch-track" />
                <span>Показывать на главной</span>
              </label>
              <label class="switch">
                <input type="checkbox" checked={draft.noindex} onChange={() => update({ noindex: !draft.noindex })} />
                <span class="switch-track" />
                <span>Не индексировать</span>
              </label>
            </div>
          </fieldset>

          {draft.kind === 'case' && (
            <fieldset>
              <legend>Данные кейса</legend>
              <label class="field">
                <span>Контекст (отрасль и масштаб, без имён)</span>
                <input
                  class="input"
                  value={draft.context ?? ''}
                  onInput={(e) => update({ context: (e.target as HTMLInputElement).value })}
                />
              </label>
              <div class="editor-row">
                <label class="field">
                  <span>Длительность</span>
                  <input
                    class="input"
                    value={draft.duration ?? ''}
                    onInput={(e) => update({ duration: (e.target as HTMLInputElement).value })}
                  />
                </label>
                <label class="field">
                  <span>Роль</span>
                  <input
                    class="input"
                    value={draft.role ?? ''}
                    onInput={(e) => update({ role: (e.target as HTMLInputElement).value })}
                  />
                </label>
                <label class="field">
                  <span>Бюджет (опционально)</span>
                  <input
                    class="input"
                    value={draft.budget ?? ''}
                    onInput={(e) => update({ budget: (e.target as HTMLInputElement).value })}
                  />
                </label>
              </div>

              <p class="metrics-title">Метрики (до 4)</p>
              {draft.metrics.map((metric, index) => (
                <div class="metric-row" key={index}>
                  <input
                    class="input"
                    value={metric.value}
                    placeholder="×2,1"
                    onInput={(e) => updateMetric(index, { value: (e.target as HTMLInputElement).value })}
                  />
                  <input
                    class="input"
                    value={metric.label}
                    placeholder="конверсия в оплату"
                    onInput={(e) => updateMetric(index, { label: (e.target as HTMLInputElement).value })}
                  />
                  <input
                    class="input"
                    value={metric.note ?? ''}
                    placeholder="пояснение"
                    onInput={(e) => updateMetric(index, { note: (e.target as HTMLInputElement).value })}
                  />
                  <select
                    class="select"
                    value={metric.trend}
                    onChange={(e) =>
                      updateMetric(index, { trend: (e.target as HTMLSelectElement).value as Metric['trend'] })
                    }
                  >
                    <option value="up">рост</option>
                    <option value="down">снижение</option>
                    <option value="flat">без изменения</option>
                  </select>
                  <button
                    class="btn btn-quiet btn-sm"
                    type="button"
                    onClick={() => update({ metrics: draft.metrics.filter((_, i) => i !== index) })}
                  >
                    Убрать
                  </button>
                </div>
              ))}
              {draft.metrics.length < 4 && (
                <button class="btn btn-ghost btn-sm" type="button" onClick={addMetric}>
                  Добавить метрику
                </button>
              )}
            </fieldset>
          )}

          <fieldset>
            <legend>SEO и обложка</legend>
            <label class="field">
              <span>SEO title (до 68)</span>
              <input
                class="input"
                value={draft.seo.title ?? ''}
                onInput={(e) => update({ seo: { ...draft.seo, title: (e.target as HTMLInputElement).value } })}
              />
            </label>
            <label class="field">
              <span>SEO description (до 190)</span>
              <input
                class="input"
                value={draft.seo.description ?? ''}
                onInput={(e) => update({ seo: { ...draft.seo, description: (e.target as HTMLInputElement).value } })}
              />
            </label>
            <div class="cover-row">
              <label class="field">
                <span>Обложка (webp/png/jpg до 900 КБ)</span>
                <input class="input" type="file" accept="image/webp,image/png,image/jpeg" onChange={uploadCover} />
              </label>
              <label class="field">
                <span>Alt обложки</span>
                <input
                  class="input"
                  value={draft.cover?.alt ?? ''}
                  onInput={(e) =>
                    update({ cover: { src: draft.cover?.src ?? '', alt: (e.target as HTMLInputElement).value } })
                  }
                />
              </label>
            </div>
            {draft.cover?.src && <p class="cover-current">Текущий путь: {draft.cover.src}</p>}
          </fieldset>
        </div>

        <div class="editor-body">
          <div class="editor-tabs segment" role="group" aria-label="Режим тела материала">
            <button type="button" aria-pressed={tab === 'write'} onClick={() => setTab('write')}>
              Markdown
            </button>
            <button type="button" aria-pressed={tab === 'preview'} onClick={() => setTab('preview')}>
              Превью
            </button>
          </div>

          {tab === 'write' ? (
            <>
              <div class="editor-help">
                <div class="editor-shortcuts" role="group" aria-label="Вставить блок">
                  {directiveCheatSheet.map((item) => (
                    <button
                      class="chip chip-button"
                      type="button"
                      title={item.what}
                      onClick={() => insertDirective(item.syntax)}
                    >
                      {item.syntax}
                    </button>
                  ))}
                </div>
                <p>
                  Таблицы — GitHub-синтаксис, задачи — <code>- [ ]</code>, сноска — <code>[^1]</code> и определение{' '}
                  <code>[^1]: …</code>, подпись картинки — <code>![alt](/путь.svg "Текст")</code>. При сохранении формат
                  правится сам: старые заголовки через пробел переводятся в скобки.
                </p>
              </div>
              <textarea
                ref={bodyRef}
                class="textarea editor-textarea"
                value={draft.body}
                onInput={(e) => update({ body: (e.target as HTMLTextAreaElement).value })}
                spellcheck={false}
              />
            </>
          ) : (
            <div class="prose editor-preview" ref={previewRef} />
          )}
        </div>
      </div>
    </div>
  );
}
