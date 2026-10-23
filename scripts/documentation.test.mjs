import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isDocumentationPath } from './check-documentation.mjs';

test('documentation and source Markdown cannot become public build files', () => {
  for (const path of ['AGENTS.md', 'docs/agents/AGENTS.md', 'docs/index.html', '.qoder/rules/index.html', 'prompts/NEW_ARTICLE.html', 'README.html', 'blog/example/index.md', '/%64ocs/agents/index.html', 'CONTENT/seo.md']) {
    assert.equal(isDocumentationPath(path), true, path);
  }
});
test('rendered blog articles and normal public assets remain publishable', () => {
  for (const path of ['index.html', 'blog/llms-txt-useless/index.html', '_astro/image.webp', 'robots.txt', 'sitemap.xml', 'CNAME', 'blog/docs/index.html']) {
    assert.equal(isDocumentationPath(path), false, path);
  }
});
