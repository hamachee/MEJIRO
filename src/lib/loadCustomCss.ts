/**
 * Lets a portable install (MEJIRO.html opened via file://) be restyled by
 * dropping a custom.css file next to it — the whole point of a single-file
 * build is that "next to it" is a real, browsable folder a user controls.
 * Appended after the app's own inlined stylesheet, so same-specificity
 * rules in custom.css win by normal cascade order — no !important needed.
 *
 * Skipped entirely outside file:// so hosted deployments (GitHub Pages)
 * never issue a request for a file nobody there could ever add.
 */
export function loadCustomCss(): void {
  if (location.protocol !== 'file:') return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = 'custom.css';
  document.head.appendChild(link);
}
