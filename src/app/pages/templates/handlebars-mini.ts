/**
 * Handlebars-mini: hỗ trợ tập con cú pháp Handlebars dùng cho preview mẫu hoá đơn.
 *
 * Hỗ trợ:
 *  - `{{var}}`  → giá trị primitive (escape HTML)
 *  - `{{a.b.c}}` → đường dẫn nested
 *  - `{{@index}}` (1-based) trong block `{{#each items}}…{{/each}}`
 *  - `{{this}}` trong each (giá trị primitive của item hiện tại)
 *  - `{{#each path}}…{{/each}}`
 *
 * Đây là bản client-side phục vụ preview thiết kế mẫu. Render thực tế
 * trên BE dùng Handlebars.Net để đảm bảo nhất quán.
 */

type Context = Record<string, unknown>;

export function renderHandlebars(template: string, context: Context): string {
  if (!template) {
    return '';
  }
  return renderBlock(template, [context]);
}

function renderBlock(template: string, scopeStack: Context[]): string {
  const eachRegex = /\{\{#each\s+([^}]+?)\}\}([\s\S]*?)\{\{\/each\}\}/g;

  let output = '';
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = eachRegex.exec(template)) !== null) {
    output += interpolate(template.slice(lastIndex, match.index), scopeStack);

    const path = match[1].trim();
    const inner = match[2];
    const collection = resolvePath(path, scopeStack);
    if (Array.isArray(collection)) {
      collection.forEach((item, index) => {
        const itemScope: Context = isObject(item)
          ? { ...item, '@index': index + 1, this: item }
          : { '@index': index + 1, this: item };
        output += renderBlock(inner, [...scopeStack, itemScope]);
      });
    }

    lastIndex = match.index + match[0].length;
  }

  output += interpolate(template.slice(lastIndex), scopeStack);
  return output;
}

function interpolate(template: string, scopeStack: Context[]): string {
  return template.replace(/\{\{\s*([^#/][^}]*?)\s*\}\}/g, (_, expr: string) => {
    const path = expr.trim();
    const value = resolvePath(path, scopeStack);
    if (value === null || value === undefined) {
      return '';
    }
    return escapeHtml(String(value));
  });
}

function resolvePath(path: string, scopeStack: Context[]): unknown {
  if (path === 'this') {
    const top = scopeStack[scopeStack.length - 1];
    return (top as Context)['this'] ?? top;
  }
  if (path === '@index') {
    const top = scopeStack[scopeStack.length - 1];
    return top['@index'];
  }

  const segments = path.split('.');
  for (let i = scopeStack.length - 1; i >= 0; i--) {
    const root = scopeStack[i];
    if (root && segments[0] in (root as object)) {
      let cur: unknown = root;
      for (const seg of segments) {
        if (cur && typeof cur === 'object' && seg in (cur as Record<string, unknown>)) {
          cur = (cur as Record<string, unknown>)[seg];
        } else {
          cur = undefined;
          break;
        }
      }
      if (cur !== undefined) {
        return cur;
      }
    }
  }
  return undefined;
}

function isObject(value: unknown): value is Context {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
