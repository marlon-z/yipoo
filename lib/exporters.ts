
"use client";

import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkRehype from 'remark-rehype';
import rehypeStringify from 'rehype-stringify';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeSlug from 'rehype-slug';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import rehypeHighlight from 'rehype-highlight';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { Document, Packer, Paragraph, HeadingLevel, TextRun } from 'docx';

export async function renderHtml(
  markdown: string,
  options?: { title?: string; math?: boolean; highlight?: boolean }
): Promise<string> {
  let p = unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype, { allowDangerousHtml: true });
  if (options?.math) {
    p = p.use(remarkMath).use(rehypeKatex);
  }
  p = p.use(rehypeSlug).use(rehypeAutolinkHeadings);
  if (options?.highlight) {
    p = p.use(rehypeHighlight);
  }
  const file = await p.use(rehypeStringify, { allowDangerousHtml: true }).process(markdown);
  const body = String(file);
  const title = options?.title ?? '导出';
  const katexCss = options?.math ? '<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css"/>' : '';
  const highlightCss = options?.highlight ? '<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/highlight.js@11.9.0/styles/github.min.css"/>' : '';
  const html = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"/>${katexCss}${highlightCss}<title>${title}</title></head><body>${body}</body></html>`;
  return html;
}

export async function renderPdf(markdown: string): Promise<Uint8Array> {
  // Minimal, text-only PDF: convert markdown to plain text and write line by line
  const text = markdown
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/`([^`]+)`/g, '$1');

  const pdfDoc = await PDFDocument.create();
  let page = pdfDoc.addPage([595.28, 841.89]); // A4
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontSize = 12;
  const margin = 50;
  const maxWidth = page.getWidth() - margin * 2;

  let x = margin;
  let y = page.getHeight() - margin;

  const paragraphs = text.split(/\n\n+/);
  for (const para of paragraphs) {
    const words = para.split(/\s+/);
    let line = '';
    for (const w of words) {
      const candidate = line ? line + ' ' + w : w;
      const width = font.widthOfTextAtSize(candidate, fontSize);
      if (width > maxWidth) {
        page.drawText(line, { x, y, size: fontSize, font, color: rgb(0, 0, 0) });
        y -= fontSize * 1.5;
        if (y < margin) {
          page = pdfDoc.addPage([595.28, 841.89]);
          y = page.getHeight() - margin;
          x = margin;
        }
        line = w;
      } else {
        line = candidate;
      }
    }
    if (line) {
      page.drawText(line, { x, y, size: fontSize, font, color: rgb(0, 0, 0) });
      y -= fontSize * 1.5;
      if (y < margin) {
        page = pdfDoc.addPage([595.28, 841.89]);
        y = page.getHeight() - margin;
        x = margin;
      }
    }
    y -= fontSize * 0.75;
  }

  const bytes = await pdfDoc.save();
  return bytes;
}

export async function renderDocx(markdown: string): Promise<Blob> {
  const lines = markdown.split(/\r?\n/);
  const paragraphs: Paragraph[] = [];
  for (const line of lines) {
    const m = /^(#{1,6})\s+(.*)$/.exec(line);
    if (m) {
      const level = m[1].length;
      const text = m[2];
      const headingLevel = (
        level === 1 ? HeadingLevel.HEADING_1 :
        level === 2 ? HeadingLevel.HEADING_2 :
        level === 3 ? HeadingLevel.HEADING_3 :
        level === 4 ? HeadingLevel.HEADING_4 :
        level === 5 ? HeadingLevel.HEADING_5 : HeadingLevel.HEADING_6
      );
      paragraphs.push(new Paragraph({ text, heading: headingLevel }));
    } else if (line.trim() === '') {
      paragraphs.push(new Paragraph({ text: '' }));
    } else {
      // Very basic inline formatting
      const runs: TextRun[] = [];
      let rest = line;
      const bold = /\*\*(.*?)\*\*/g;
      const italic = /\*(.*?)\*/g;
      const code = /`([^`]+)`/g;
      // strip formatting for now
      rest = rest.replace(bold, '$1').replace(italic, '$1').replace(code, '$1');
      runs.push(new TextRun(rest));
      paragraphs.push(new Paragraph({ children: runs }));
    }
  }
  const doc = new Document({
    sections: [{ properties: {}, children: paragraphs }],
  });
  const blob = await Packer.toBlob(doc);
  return blob;
}
