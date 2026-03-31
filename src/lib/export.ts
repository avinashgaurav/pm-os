import type { BaseDocument } from '@/types';

export function exportToMarkdown(doc: BaseDocument): string {
  const lines: string[] = [];
  lines.push(`# ${doc.title}`);
  lines.push('');
  lines.push(`> Created: ${new Date(doc.createdAt).toLocaleDateString()} | Updated: ${new Date(doc.updatedAt).toLocaleDateString()}`);
  if (doc.tags.length > 0) {
    lines.push(`> Tags: ${doc.tags.join(', ')}`);
  }
  lines.push('');

  for (const [key, value] of Object.entries(doc.content)) {
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
  a.download = `${doc.title.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}.md`;
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
