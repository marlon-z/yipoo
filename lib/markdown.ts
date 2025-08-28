export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\u4e00-\u9fff\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export interface HeadingItem {
  level: number;
  title: string;
  id: string;
}

export function extractHeadings(markdown: string): HeadingItem[] {
  const lines = markdown.split(/\r?\n/);
  const existing = new Set<string>();
  const out: HeadingItem[] = [];
  for (const line of lines) {
    const m = /^(#{1,6})\s+(.*)$/.exec(line);
    if (!m) continue;
    const level = m[1].length;
    const title = m[2].trim();
    if (!title) continue;
    let id = slugify(title);
    let unique = id;
    let i = 1;
    while (existing.has(unique)) { unique = `${id}-${i++}`; }
    existing.add(unique);
    out.push({ level, title, id: unique });
  }
  return out;
}

export function markdownToHtml(markdown: string): string {
  let html = markdown
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // code block
  html = html.replace(/```(\w+)?\n([\s\S]*?)```/gim, (_m, _lang, code) => {
    return `<pre><code>${code.replace(/\n/g, '\n')}</code></pre>`;
  });
  // headings
  html = html
    .replace(/^######\s+(.*)$/gim, '<h6>$1</h6>')
    .replace(/^#####\s+(.*)$/gim, '<h5>$1</h5>')
    .replace(/^####\s+(.*)$/gim, '<h4>$1</h4>')
    .replace(/^###\s+(.*)$/gim, '<h3>$1</h3>')
    .replace(/^##\s+(.*)$/gim, '<h2>$1</h2>')
    .replace(/^#\s+(.*)$/gim, '<h1>$1</h1>');
  // blockquote
  html = html.replace(/^>\s+(.*)$/gim, '<blockquote>$1</blockquote>');
  // bold/italic/inline code
  html = html
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`([^`]*)`/g, '<code>$1</code>');
  // links
  html = html.replace(/\[([^\]]+)\]\(([^\)]+)\)/g, '<a href="$2">$1</a>');
  // hr
  html = html.replace(/^---$/gim, '<hr>');
  // lists (basic)
  html = html
    .replace(/^(?:\*|\-)\s+(.*)$/gim, '<ul><li>$1</li></ul>')
    .replace(/^(\d+)\.\s+(.*)$/gim, '<ol><li>$2</li></ol>');
  // paragraphs
  html = html.replace(/^(?!<h\d|<ul>|<ol>|<li>|<pre>|<blockquote>|<hr>|<p>|<\/)(.+)$/gim, '<p>$1</p>');
  // line breaks
  html = html.replace(/\n/g, '<br>');
  return html;
}

export function countWords(text: string): number {
  if (!text) return 0;
  // Rough count: split by whitespace; count CJK characters separately
  const latin = text.trim().split(/\s+/).filter(Boolean).length;
  const cjk = (text.match(/[\u4e00-\u9fff]/g) || []).length;
  return latin + cjk;
}
