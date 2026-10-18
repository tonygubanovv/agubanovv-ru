import '../styles/utm.css';
import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import {
  MEDIUMS,
  PARAM_KEYS,
  SOURCES,
  buildUrl,
  expand,
  labelOf,
  validateParam,
  validateUrl,
  type Issue,
  type ParamKey,
} from '@/lib/utm';

type Params = Record<ParamKey, string>;
type Preset = { id: string; name: string; base: string; params: Params };

const EMPTY: Params = { utm_source: '', utm_medium: '', utm_campaign: '', utm_term: '', utm_content: '' };
const STORAGE = 'site.utm.presets.v1';

const readPresets = (): Preset[] => {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE) ?? '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export default function UtmBuilder() {
  const [base, setBase] = useState('https://');
  const [params, setParams] = useState<Params>(EMPTY);
  const [mode, setMode] = useState<'single' | 'batch'>('single');
  const [axis, setAxis] = useState<'utm_source' | 'utm_content'>('utm_source');
  const [batchRaw, setBatchRaw] = useState('');
  const [presets, setPresets] = useState<Preset[]>([]);
  const [feedback, setFeedback] = useState('');
  const statusRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => setPresets(readPresets()), []);

  const lines = useMemo(
    () =>
      batchRaw
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean),
    [batchRaw],
  );
  const links = useMemo(
    () => (mode === 'single' ? [buildUrl(base, params)] : expand(base, params, lines, axis)),
    [base, params, mode, lines, axis],
  );

  const issues = useMemo<Issue[]>(() => {
    const found: Issue[] = [...validateUrl(base)];
    for (const key of PARAM_KEYS) {
      const issue = validateParam(key, params[key]);
      if (issue) found.push(issue);
    }
    if (mode === 'batch' && lines.length === 0) {
      found.push({
        level: 'error',
        field: 'batch',
        text: `Список пуст: впишите по одному значению ${labelOf(axis)} на строку.`,
      });
    }
    return found;
  }, [base, params, mode, lines, axis]);

  const errors = issues.filter((issue) => issue.level === 'error');

  const set = (key: ParamKey) => (event: Event) =>
    setParams({ ...params, [key]: (event.target as HTMLInputElement).value });

  const persist = (next: Preset[]) => {
    setPresets(next);
    try {
      localStorage.setItem(STORAGE, JSON.stringify(next));
    } catch {
      notify('Браузер запретил сохранение — пресеты живут только до перезагрузки.');
    }
  };

  const notify = (text: string) => {
    setFeedback(text);
    if (statusRef.current) statusRef.current.textContent = text;
    window.setTimeout(() => setFeedback(''), 2600);
  };

  const copy = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      notify(`${label} скопирован.`);
    } catch {
      notify('Копирование недоступно — выделите текст вручную.');
    }
  };

  const savePreset = () => {
    const name = params.utm_campaign || 'без названия';
    const id = `${Date.now()}`;
    persist([...presets, { id, name, base, params }]);
    notify(`Пресет «${name}» сохранён в этом браузере.`);
  };

  const tsv = links.join('\n');

  return (
    <div class="utm">
      <div class="utm-panel">
        <label class="field">
          <span>Адрес посадки</span>
          <input class="input" type="url" value={base} onInput={(e) => setBase((e.target as HTMLInputElement).value)} />
        </label>

        <div class="utm-grid">
          <label class="field">
            <span>utm_source</span>
            <input
              class="input"
              list="utm-sources"
              value={params.utm_source}
              onInput={set('utm_source')}
              placeholder="tg_ads"
            />
          </label>

          <label class="field">
            <span>utm_medium</span>
            <select class="select" value={params.utm_medium} onChange={set('utm_medium')}>
              <option value="">— выбрать —</option>
              {MEDIUMS.map((medium) => (
                <option value={medium.value}>
                  {medium.value} · {medium.label}
                </option>
              ))}
            </select>
          </label>

          <label class="field">
            <span>utm_campaign</span>
            <input
              class="input"
              value={params.utm_campaign}
              onInput={set('utm_campaign')}
              placeholder="2026_invoice_m10_activation"
            />
          </label>
        </div>

        <details class="utm-advanced">
          <summary>Дополнительные метки</summary>
          <div class="utm-grid">
            <label class="field">
              <span>utm_term</span>
              <input class="input" value={params.utm_term} onInput={set('utm_term')} placeholder="Ключевое слово" />
            </label>

            <label class="field">
              <span>utm_content</span>
              <input class="input" value={params.utm_content} onInput={set('utm_content')} placeholder="creative_a" />
            </label>
          </div>
        </details>

        <datalist id="utm-sources">
          {SOURCES.map((source) => (
            <option value={source} />
          ))}
        </datalist>

        <div class="utm-modes" role="group" aria-label="Режим сборки">
          <div class="segment">
            <button type="button" aria-pressed={mode === 'single'} onClick={() => setMode('single')}>
              Одна ссылка
            </button>
            <button type="button" aria-pressed={mode === 'batch'} onClick={() => setMode('batch')}>
              Пакет по списку
            </button>
          </div>

          {mode === 'batch' && (
            <div class="segment">
              <button type="button" aria-pressed={axis === 'utm_source'} onClick={() => setAxis('utm_source')}>
                по source
              </button>
              <button type="button" aria-pressed={axis === 'utm_content'} onClick={() => setAxis('utm_content')}>
                по content
              </button>
            </div>
          )}
        </div>

        {mode === 'batch' && (
          <label class="field">
            <span>{`Список ${labelOf(axis)} — по одному на строку`}</span>
            <textarea
              class="textarea"
              rows={6}
              value={batchRaw}
              onInput={(e) => setBatchRaw((e.target as HTMLTextAreaElement).value)}
              placeholder={'tg_ads\nvk_ads\npartner_blog'}
            />
          </label>
        )}

        {base.trim() && Object.values(params).some(Boolean) && issues.length > 0 && (
          <ul class="utm-issues" aria-label="Проверка разметки">
            {issues.map((issue) => (
              <li data-level={issue.level}>
                <span class="utm-issue-field">{issue.field}</span>
                {issue.text}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div class="utm-result">
        <div class="utm-result-head">
          <div class="utm-actions">
            <button class="btn btn-quiet btn-sm" type="button" onClick={savePreset}>
              Сохранить пресет
            </button>
            <button
              class="btn btn-primary btn-sm"
              type="button"
              disabled={errors.length > 0 || links.length === 0}
              onClick={() => copy(mode === 'single' ? tsv : tsv, mode === 'single' ? 'URL' : `${links.length} ссылок`)}
            >
              {mode === 'single' ? 'Копировать ссылку' : 'Копировать список (TSV)'}
            </button>
          </div>
        </div>

        {mode === 'single' ? (
          <p class="utm-url" data-empty={String(!links[0])}>
            {links[0] || 'Заполните адрес и обязательные параметры'}
          </p>
        ) : (
          <ol class="utm-list">
            {links.map((link) => (
              <li>
                <code>{link}</code>
                <button
                  class="icon-mini"
                  type="button"
                  onClick={() => copy(link, 'URL')}
                  aria-label="Скопировать ссылку"
                >
                  ⧉
                </button>
              </li>
            ))}
          </ol>
        )}

        <p class="utm-status" ref={statusRef} role="status" aria-live="polite">
          {feedback}
        </p>

        {presets.length > 0 && (
          <div class="utm-presets">
            <p class="presets-title">Пресеты этого браузера</p>
            <ul>
              {presets.map((preset) => (
                <li key={preset.id}>
                  <button
                    class="preset-load"
                    type="button"
                    onClick={() => {
                      setBase(preset.base);
                      setParams(preset.params);
                    }}
                  >
                    <span class="preset-name">{preset.name}</span>
                    <span class="preset-meta">
                      {preset.params.utm_source || '—'} / {preset.params.utm_medium || '—'}
                    </span>
                  </button>
                  <button
                    class="icon-mini"
                    type="button"
                    aria-label={`Удалить пресет ${preset.name}`}
                    onClick={() => persist(presets.filter((item) => item.id !== preset.id))}
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
