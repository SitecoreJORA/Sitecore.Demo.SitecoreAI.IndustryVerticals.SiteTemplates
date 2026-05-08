/**
 * Sanitized HTML for datasheet text blocks (aligned with schott-datasheet-editor).
 */

const ALLOWED_TAGS = new Set([
  'B',
  'STRONG',
  'I',
  'EM',
  'U',
  'S',
  'STRIKE',
  'SUB',
  'SUP',
  'UL',
  'OL',
  'LI',
  'P',
  'BR',
  'A',
  'DIV',
  'SPAN',
  'H4',
  'H5',
  'H6',
]);

const ALLOWED_ATTRS: Record<string, Set<string>> = {
  A: new Set(['href', 'target', 'rel']),
};

export function looksLikeHtml(s: string): boolean {
  return /<(b|strong|i|em|u|ul|ol|li|p|br|a|div|span|h[1-6])\b/i.test(s);
}

export function sanitizeHtml(html: string): string {
  if (typeof document === 'undefined') return html;
  const tmpl = document.createElement('template');
  tmpl.innerHTML = html;
  sanitizeNode(tmpl.content);
  return tmpl.innerHTML;
}

function sanitizeNode(node: Node): void {
  const children = Array.from(node.childNodes);
  for (const child of children) {
    if (child.nodeType === 1) {
      const el = child as Element;
      if (!ALLOWED_TAGS.has(el.tagName)) {
        sanitizeNode(el);
        const parent = el.parentNode;
        if (parent) {
          while (el.firstChild) parent.insertBefore(el.firstChild, el);
          parent.removeChild(el);
        }
        continue;
      }
      const allowed = ALLOWED_ATTRS[el.tagName] || new Set<string>();
      Array.from(el.attributes).forEach((attr) => {
        const name = attr.name.toLowerCase();
        if (!allowed.has(name)) {
          el.removeAttribute(attr.name);
          return;
        }
        if (name === 'href') {
          const val = attr.value.trim().toLowerCase();
          if (val.startsWith('javascript:') || val.startsWith('data:')) {
            el.removeAttribute(attr.name);
          }
        }
      });
      sanitizeNode(el);
    } else if (child.nodeType === 8) {
      child.parentNode?.removeChild(child);
    }
  }
}

export function plainTextToHtml(text: string): string {
  if (!text) return '';
  const escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
  const lines = escaped.split(/\r?\n/);
  return lines.map((l) => `<div>${l || '<br>'}</div>`).join('');
}

export function toSafeHtml(raw: string): string {
  const input = raw || '';
  const asHtml = looksLikeHtml(input) ? input : plainTextToHtml(input);
  return sanitizeHtml(asHtml);
}
