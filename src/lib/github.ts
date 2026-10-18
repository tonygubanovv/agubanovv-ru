/**
 * Клиент GitHub Contents API для админки. Единственный адрес, куда уходит токен:
 * api.github.com. Никакой проксированной аналитики и третьих сторон по построению.
 *
 * Требуемый токен — fine-grained PAT с permissions:
 *   Contents: Read and write (и Actions: Read-only для статуса деплоя)
 * на один репозиторий. Классический PAT: scope `repo` (+ workflow, если есть).
 */

const API = 'https://api.github.com';

export type ContentsItem = {
  name: string;
  path: string;
  sha: string;
  size: number;
  type: 'file' | 'dir';
  download_url?: string | null;
};

export type WorkflowRun = {
  id: number;
  name: string;
  status: string;
  conclusion: string | null;
  created_at: string;
  html_url: string;
  head_branch: string;
};

export class GitHubError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly docsUrl?: string,
  ) {
    super(message);
  }
}

export class GitHubRepo {
  constructor(
    private token: string,
    readonly repo: string,
    readonly branch: string,
  ) {}

  get owner() {
    return this.repo.split('/')[0];
  }

  get name() {
    return this.repo.split('/')[1];
  }

  private headers(extra: Record<string, string> = {}) {
    return {
      Authorization: `Bearer ${this.token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      ...extra,
    };
  }

  private async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const response = await fetch(`${API}${path}`, {
      ...init,
      headers: this.headers((init.headers as Record<string, string>) ?? {}),
    });

    if (response.status === 401) {
      throw new GitHubError('Токен не принят: проверьте, что он не истёк и у репозитория есть доступ.', 401);
    }
    if (response.status === 403) {
      const body = await response.json().catch(() => ({ message: '', documentation_url: '' }));
      throw new GitHubError(body.message || 'Доступ запрещён: у токена нет прав на запись в репозиторий.', 403, body.documentation_url);
    }
    if (response.status === 404) {
      throw new GitHubError('Путь или репозиторий не найдены. Проверьте owner/name и ветку.', 404);
    }
    if (response.status === 409) {
      throw new GitHubError('Файл изменился в репозитории после открытия. Перечитайте его и повторите.', 409);
    }
    if (!response.ok) {
      const body = await response.json().catch(() => ({ message: response.statusText }));
      throw new GitHubError(body.message || `Ошибка запроса ${response.status}`, response.status);
    }
    return (await response.json()) as T;
  }

  /** Проверяет токен и доступ к репо, возвращает логин владельца токена. */
  async verify() {
    const [user, repo] = await Promise.all([
      this.request<{ login: string }>('/user'),
      this.request<{ default_branch: string; permissions?: Record<string, boolean> }>(
        `/repos/${this.repo}`,
      ),
    ]);
    return {
      login: user.login,
      defaultBranch: repo.default_branch,
      canPush: repo.permissions?.push ?? true,
    };
  }

  async listDir(dir: string): Promise<ContentsItem[]> {
    const items = await this.request<ContentsItem[] | ContentsItem>(
      `/repos/${this.repo}/contents/${dir.replace(/^\/+/, '')}?ref=${this.branch}`,
    );
    return Array.isArray(items) ? items : [items];
  }

  async readFile(path: string): Promise<{ sha: string; text: string }> {
    const file = await this.request<{ sha: string; content?: string; encoding?: string }>(
      `/repos/${this.repo}/contents/${path.replace(/^\/+/, '')}?ref=${this.branch}`,
    );
    return { sha: file.sha, text: file.content ? decodeBase64(file.content) : '' };
  }

  async writeFile(path: string, content: string, message: string, sha?: string) {
    return this.putFile(path, encodeBase64(content), message, sha);
  }

  /** Обложки и прочее бинарное содержимое: base64 считается по байтам, без UTF-8. */
  async writeBinary(path: string, bytes: Uint8Array, message: string, sha?: string) {
    return this.putFile(path, encodeBytesBase64(bytes), message, sha);
  }

  private async putFile(path: string, base64: string, message: string, sha?: string) {
    return this.request<{ commit: { sha: string }; content: ContentsItem }>(
      `/repos/${this.repo}/contents/${path.replace(/^\/+/, '')}`,
      {
        method: 'PUT',
        body: JSON.stringify({ message, content: base64, branch: this.branch, ...(sha ? { sha } : {}) }),
      },
    );
  }

  async deleteFile(path: string, sha: string, message: string) {
    return this.request(
      `/repos/${this.repo}/contents/${path.replace(/^\/+/, '')}`,
      {
        method: 'DELETE',
        body: JSON.stringify({ message, sha, branch: this.branch }),
      },
    );
  }

  /** Последние прогоны CI — чтобы видеть, собрался ли сайт после публикации. */
  async recentRuns(perPage = 5): Promise<WorkflowRun[]> {
    const data = await this.request<{ workflow_runs: WorkflowRun[] }>(
      `/repos/${this.repo}/actions/runs?per_page=${perPage}&branch=${this.branch}`,
    );
    return data.workflow_runs ?? [];
  }
}

/** base64 → строка с кириллицей без mojibake. */
export function decodeBase64(base64: string) {
  const binary = atob(base64.replace(/\s/g, ''));
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder('utf-8').decode(bytes);
}

/** строка → base64 по байтам UTF-8 (btoa один ломает кириллицу). */
export function encodeBase64(text: string) {
  const bytes = new TextEncoder().encode(text);
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

export function encodeBytesBase64(bytes: Uint8Array) {
  let binary = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}
