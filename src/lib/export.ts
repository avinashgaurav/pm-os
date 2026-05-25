import { jsPDF } from 'jspdf';
import type { BaseDocument } from '@/types';

// ─────────────────────────────────────────────────────────────────────────────
// Markdown export (unchanged)
// ─────────────────────────────────────────────────────────────────────────────
export function exportToMarkdown(doc: BaseDocument): string {
  const lines: string[] = [];
  lines.push(`# ${doc.title}`);
  lines.push('');
  lines.push(
    `> Created: ${new Date(doc.createdAt).toLocaleDateString()} | Updated: ${new Date(doc.updatedAt).toLocaleDateString()}`
  );
  if (doc.tags.length > 0) {
    lines.push(`> Tags: ${doc.tags.join(', ')}`);
  }
  lines.push('');

  for (const [key, value] of Object.entries(doc.content)) {
    // Internal keys (_output, _generatedOutput) hold the AI-rendered body — skip
    // them in the section list. _generatedOutput is a legacy alias kept for
    // backward compat with older saved documents.
    if (key.startsWith('_')) continue;
    if (value && value.trim()) {
      const label = key
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, (s) => s.toUpperCase())
        .trim();
      lines.push(`## ${label}`);
      lines.push('');
      lines.push(value);
      lines.push('');
    }
  }

  return lines.join('\n');
}

export function downloadMarkdown(doc: BaseDocument) {
  const md = exportToMarkdown(doc);
  const blob = new Blob([md], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${slugify(doc.title)}.md`;
  a.click();
  URL.revokeObjectURL(url);
}

export function downloadJSON(data: unknown, filename: string) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

// ─────────────────────────────────────────────────────────────────────────────
// PDF export — two themes.
// `default`: minimalist, near-black on white, helvetica throughout.
// `premium`: Ferrari — cream paper, red stripe header, deep red serif headings,
//            near-black helvetica body, generous margins, red footer rule.
//
// Both themes render `doc.content._output` (the AI-generated body) as the main
// deliverable. If the AI output is missing, we fall back to the input sections.
// ─────────────────────────────────────────────────────────────────────────────
export type PdfTheme = 'default' | 'premium';

interface ThemeSpec {
  pageBg?: [number, number, number];
  marginTop: number;
  marginBottom: number;
  marginLeft: number;
  marginRight: number;
  bodyFont: 'helvetica' | 'times';
  headingFont: 'helvetica' | 'times';
  bodyColor: [number, number, number];
  headingColor: [number, number, number];
  mutedColor: [number, number, number];
  ruleColor: [number, number, number];
  drawHeader: (doc: jsPDF, pageW: number) => void;
  drawFooter: (doc: jsPDF, pageW: number, pageH: number, pageNum: number) => void;
}

function getTheme(theme: PdfTheme): ThemeSpec {
  if (theme === 'premium') {
    return {
      pageBg: [245, 241, 232],
      marginTop: 28,
      marginBottom: 24,
      marginLeft: 28,
      marginRight: 28,
      bodyFont: 'helvetica',
      headingFont: 'times',
      bodyColor: [26, 26, 26],
      headingColor: [161, 19, 26],
      mutedColor: [120, 100, 80],
      ruleColor: [161, 19, 26],
      drawHeader: (d, pageW) => {
        d.setFillColor(161, 19, 26);
        d.rect(0, 0, pageW, 6, 'F');
      },
      drawFooter: (d, pageW, pageH, pageNum) => {
        d.setDrawColor(161, 19, 26);
        d.setLineWidth(0.3);
        d.line(28, pageH - 14, pageW - 28, pageH - 14);
        d.setFont('times', 'italic');
        d.setFontSize(9);
        d.setTextColor(161, 19, 26);
        d.text(String(pageNum), pageW - 28, pageH - 8, { align: 'right' });
      },
    };
  }
  return {
    marginTop: 20,
    marginBottom: 18,
    marginLeft: 20,
    marginRight: 20,
    bodyFont: 'helvetica',
    headingFont: 'helvetica',
    bodyColor: [17, 17, 17],
    headingColor: [17, 17, 17],
    mutedColor: [120, 120, 120],
    ruleColor: [220, 220, 220],
    drawHeader: () => {
      /* no-op */
    },
    drawFooter: (d, pageW, pageH, pageNum) => {
      d.setFont('helvetica', 'normal');
      d.setFontSize(8);
      d.setTextColor(120, 120, 120);
      d.text(String(pageNum), pageW - 20, pageH - 8, { align: 'right' });
    },
  };
}

function paintPageBg(d: jsPDF, theme: ThemeSpec, pageW: number, pageH: number) {
  if (theme.pageBg) {
    d.setFillColor(...theme.pageBg);
    d.rect(0, 0, pageW, pageH, 'F');
  }
  theme.drawHeader(d, pageW);
}

export function exportToPdf(doc: BaseDocument, theme: PdfTheme = 'default'): jsPDF {
  const pdf = new jsPDF({ unit: 'mm', format: 'letter' });
  const t = getTheme(theme);
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const contentW = pageW - t.marginLeft - t.marginRight;
  const maxY = pageH - t.marginBottom - 8; // reserve space for footer

  let y = t.marginTop;
  let pageNum = 1;

  paintPageBg(pdf, t, pageW, pageH);

  const newPage = () => {
    t.drawFooter(pdf, pageW, pageH, pageNum);
    pdf.addPage();
    pageNum += 1;
    paintPageBg(pdf, t, pageW, pageH);
    y = t.marginTop;
  };

  const ensureRoom = (h: number) => {
    if (y + h > maxY) newPage();
  };

  const writeWrapped = (
    text: string,
    opts: {
      font: 'helvetica' | 'times';
      style: 'normal' | 'bold' | 'italic';
      size: number;
      color: [number, number, number];
      lineGap: number;
      gapAfter: number;
      gapBefore?: number;
    }
  ) => {
    pdf.setFont(opts.font, opts.style);
    pdf.setFontSize(opts.size);
    pdf.setTextColor(...opts.color);
    const lines = pdf.splitTextToSize(text, contentW) as string[];
    let first = true;
    for (const line of lines) {
      ensureRoom(opts.lineGap + (first && opts.gapBefore ? opts.gapBefore : 0));
      if (first && opts.gapBefore) y += opts.gapBefore;
      pdf.text(line, t.marginLeft, y);
      y += opts.lineGap;
      first = false;
    }
    y += opts.gapAfter;
  };

  // Title page
  pdf.setFont(t.headingFont, 'bold');
  pdf.setFontSize(theme === 'premium' ? 30 : 22);
  pdf.setTextColor(...t.headingColor);
  const titleLines = pdf.splitTextToSize(doc.title || 'Untitled', contentW) as string[];
  for (const line of titleLines) {
    ensureRoom(theme === 'premium' ? 12 : 9);
    pdf.text(line, t.marginLeft, y);
    y += theme === 'premium' ? 12 : 9;
  }
  y += 2;

  pdf.setFont(t.bodyFont, theme === 'premium' ? 'italic' : 'normal');
  pdf.setFontSize(10);
  pdf.setTextColor(...t.mutedColor);
  const meta = `${new Date(doc.updatedAt).toLocaleDateString(undefined, { dateStyle: 'long' })}${doc.tags.length ? `  ·  ${doc.tags.join(', ')}` : ''}`;
  pdf.text(meta, t.marginLeft, y);
  y += 6;

  pdf.setDrawColor(...t.ruleColor);
  pdf.setLineWidth(theme === 'premium' ? 0.4 : 0.2);
  pdf.line(t.marginLeft, y, pageW - t.marginRight, y);
  y += theme === 'premium' ? 10 : 6;

  // Body — prefer AI output; fall back to input sections.
  const aiOutput = (doc.content._output || doc.content._generatedOutput || '').trim();
  if (aiOutput) {
    renderMarkdown(aiOutput);
  } else {
    for (const [key, value] of Object.entries(doc.content)) {
      if (key.startsWith('_') || !value || !value.trim()) continue;
      const label = key
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, (s) => s.toUpperCase())
        .trim();
      heading(label, 2);
      paragraph(value);
    }
  }

  // Final footer
  t.drawFooter(pdf, pageW, pageH, pageNum);

  function heading(text: string, level: 1 | 2 | 3) {
    const sizes = theme === 'premium' ? [20, 15, 12] : [16, 13, 11];
    const gaps = theme === 'premium' ? [8, 6, 5] : [6, 5, 4];
    const idx = level - 1;
    writeWrapped(text, {
      font: t.headingFont,
      style: 'bold',
      size: sizes[idx],
      color: t.headingColor,
      lineGap: gaps[idx],
      gapAfter: 3,
      // breathing room above h2 — applied after a page-break check so the gap
      // never disappears when a heading lands at the top of a new page
      gapBefore: level === 2 ? 3 : 0,
    });
  }

  function paragraph(text: string) {
    writeWrapped(text, {
      font: t.bodyFont,
      style: 'normal',
      size: 10.5,
      color: t.bodyColor,
      lineGap: 5,
      gapAfter: 3,
    });
  }

  function bullet(text: string, level = 0) {
    pdf.setFont(t.bodyFont, 'normal');
    pdf.setFontSize(10.5);
    pdf.setTextColor(...t.bodyColor);
    const indentStep = 5;
    const markerOffset = level * indentStep;
    const textOffset = markerOffset + 5;
    const lines = pdf.splitTextToSize(text, contentW - textOffset) as string[];
    const marker = level === 0 ? '•' : level === 1 ? '◦' : '▪';
    lines.forEach((line, i) => {
      ensureRoom(5);
      if (i === 0) pdf.text(marker, t.marginLeft + markerOffset, y);
      pdf.text(line, t.marginLeft + textOffset, y);
      y += 5;
    });
    y += 1;
  }

  function renderMarkdown(md: string) {
    const lines = md.split('\n');
    let seenContent = false;
    const docTitle = (doc.title || '').trim().toLowerCase();
    for (const raw of lines) {
      const line = raw.trimEnd();
      if (!line.trim()) {
        if (seenContent) y += 2;
        continue;
      }
      // Skip the AI output's leading `# Title` if it duplicates the doc title.
      if (
        !seenContent &&
        line.startsWith('# ') &&
        line.slice(2).trim().toLowerCase() === docTitle
      ) {
        seenContent = true;
        continue;
      }
      seenContent = true;
      const trimmed = line.trimStart();
      const indentLevel = Math.min(2, Math.floor((line.length - trimmed.length) / 2));
      if (trimmed.startsWith('# ')) {
        heading(trimmed.slice(2), 1);
      } else if (trimmed.startsWith('## ')) {
        heading(trimmed.slice(3), 2);
      } else if (trimmed.startsWith('### ')) {
        heading(trimmed.slice(4), 3);
      } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        // strip markdown bold inside bullets
        bullet(trimmed.slice(2).replace(/\*\*(.+?)\*\*/g, '$1'), indentLevel);
      } else if (/^\d+\.\s/.test(trimmed)) {
        bullet(trimmed.replace(/^\d+\.\s/, '').replace(/\*\*(.+?)\*\*/g, '$1'), indentLevel);
      } else if (trimmed.startsWith('> ')) {
        writeWrapped(line.slice(2), {
          font: t.bodyFont,
          style: 'italic',
          size: 10.5,
          color: t.mutedColor,
          lineGap: 5,
          gapAfter: 3,
        });
      } else if (line.startsWith('---')) {
        ensureRoom(6);
        pdf.setDrawColor(...t.ruleColor);
        pdf.setLineWidth(0.2);
        pdf.line(t.marginLeft, y, pageW - t.marginRight, y);
        y += 5;
      } else {
        paragraph(line.replace(/\*\*(.+?)\*\*/g, '$1'));
      }
    }
  }

  return pdf;
}

export function downloadPdf(doc: BaseDocument, theme: PdfTheme = 'default') {
  const pdf = exportToPdf(doc, theme);
  pdf.save(`${slugify(doc.title)}.pdf`);
}

function slugify(s: string) {
  return (s || 'untitled')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();
}
