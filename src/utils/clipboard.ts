/** Copy plain text, including on browsers without the secure-context Clipboard API. */
export async function copyText(text: string): Promise<void> {
  if (navigator.clipboard?.writeText) {
    try { await navigator.clipboard.writeText(text); return; }
    catch { /* Fall back to a selected field while the user gesture is active. */ }
  }
  const focused = document.activeElement;
  const field = document.createElement('textarea');
  field.value = text;
  field.readOnly = true;
  field.style.cssText = 'position:fixed;top:0;left:0;opacity:0;pointer-events:none';
  document.body.append(field);
  try {
    field.select();
    if (!document.execCommand('copy')) throw new Error('Copy denied');
  } finally {
    field.remove();
    if (focused instanceof HTMLElement) focused.focus({ preventScroll: true });
  }
}
