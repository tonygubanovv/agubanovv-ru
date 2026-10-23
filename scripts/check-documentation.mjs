/** Only rendered site content belongs in the Pages artifact. */
export function isDocumentationPath(value) {
  let path;
  try { path = decodeURIComponent(value).replaceAll('\\', '/').replace(/^\/+/, '').toLowerCase(); }
  catch { return true; }
  return /^(?:docs|agents|specs|prompts|\.qoder|\.git|src|scripts|content)(?:\/|$)/.test(path)
    || /\.(?:md|mdx)$/.test(path)
    || /(?:^|\/)(?:agents|readme)(?:\.html?|\/index\.html)?$/.test(path);
}
