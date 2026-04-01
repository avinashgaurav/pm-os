'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, FileDown, ArrowLeft, Sparkles, Copy, Pencil, Save } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { PageHeader } from './page-header';
import { DocumentCard } from './document-card';
import { useDocuments } from '@/hooks/use-documents';
import { downloadMarkdown } from '@/lib/export';
import { getModule } from '@/lib/constants';
import { getTemplate } from '@/lib/templates';
import type { BaseDocument, CategorySlug, ModuleTemplate, TemplateSection } from '@/types';

interface DocumentEditorProps {
  category: CategorySlug;
  moduleSlug: string;
}

// Smart generator — creates structured professional output from user inputs
function generateDocument(
  title: string,
  content: Record<string, string>,
  sections: TemplateSection[],
  moduleName: string
): string {
  const lines: string[] = [];
  const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  lines.push(`# ${title}`);
  lines.push(`> ${moduleName} | Generated ${date}`);
  lines.push('');

  for (const section of sections) {
    const val = content[section.key]?.trim();
    if (!val) continue;

    lines.push(`## ${section.label}`);
    lines.push('');

    // Smart formatting: detect lists, paragraphs, key-value pairs
    const inputLines = val.split('\n').filter(l => l.trim());

    for (const line of inputLines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('-') || trimmed.startsWith('•') || trimmed.startsWith('*')) {
        lines.push(trimmed);
      } else if (trimmed.includes(':') && trimmed.indexOf(':') < 30) {
        // Key-value pair like "Metric: DAU"
        const [key, ...rest] = trimmed.split(':');
        lines.push(`- **${key.trim()}**: ${rest.join(':').trim()}`);
      } else {
        lines.push(trimmed);
      }
    }
    lines.push('');
  }

  // Add a summary section
  const filledSections = sections.filter(s => content[s.key]?.trim());
  if (filledSections.length > 0) {
    lines.push('## Summary');
    lines.push('');
    lines.push(`This ${moduleName.toLowerCase()} covers ${filledSections.length} key areas:`);
    for (const s of filledSections) {
      const preview = content[s.key]!.trim().split('\n')[0].slice(0, 80);
      lines.push(`- **${s.label}**: ${preview}${content[s.key]!.trim().length > 80 ? '...' : ''}`);
    }
    lines.push('');
  }

  lines.push('---');
  lines.push(`*${moduleName} — PM OS*`);
  return lines.join('\n');
}

export function DocumentEditor({ category, moduleSlug }: DocumentEditorProps) {
  const mod = getModule(category, moduleSlug);
  const template = getTemplate(category, moduleSlug);
  const { documents, createDocument, updateDocument, deleteDocument, toggleStar } =
    useDocuments(category, moduleSlug);

  const [activeDocId, setActiveDocId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState<Record<string, string>>({});
  const [step, setStep] = useState<'list' | 'input' | 'output'>('list');
  const [generatedOutput, setGeneratedOutput] = useState('');
  const [editingOutput, setEditingOutput] = useState(false);

  if (!mod) {
    return <div className="text-muted-foreground">Module not found</div>;
  }

  const activeTemplate: ModuleTemplate = template || {
    moduleSlug, category,
    sections: [
      { key: 'context', label: 'Context & Background', placeholder: 'What is the context? What problem or opportunity are you addressing?', type: 'textarea' as const, required: true },
      { key: 'inputs', label: 'Key Inputs', placeholder: 'What information, data, or research do you have?', type: 'textarea' as const },
      { key: 'goals', label: 'Goals & Objectives', placeholder: 'What are you trying to achieve?', type: 'textarea' as const },
      { key: 'constraints', label: 'Constraints & Considerations', placeholder: 'Any limitations, timelines, or constraints?', type: 'textarea' as const },
    ],
  };

  const handleNew = () => {
    setActiveDocId(null);
    setTitle('');
    setContent({});
    setGeneratedOutput('');
    setEditingOutput(false);
    setStep('input');
  };

  const handleGenerate = () => {
    if (!title.trim()) {
      toast.error('Enter a title first');
      return;
    }
    const output = generateDocument(title, content, activeTemplate.sections, mod.name);
    setGeneratedOutput(output);
    setStep('output');
    toast.success(`${mod.name} generated`);
  };

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error('Title required');
      return;
    }
    const saveContent = { ...content, _output: generatedOutput };
    if (activeDocId) {
      await updateDocument(activeDocId, { title, content: saveContent });
      toast.success('Saved');
    } else {
      const doc = await createDocument({ title, category, moduleSlug, tags: [], content: saveContent });
      setActiveDocId(doc.id);
      toast.success('Saved');
    }
  };

  const handleSelect = (doc: BaseDocument) => {
    setActiveDocId(doc.id);
    setTitle(doc.title);
    // Separate output from input fields
    const { _output, _generatedOutput, ...inputFields } = doc.content;
    setContent(inputFields);
    const output = _output || _generatedOutput || '';
    if (output) {
      setGeneratedOutput(output);
      setStep('output');
    } else {
      setGeneratedOutput('');
      setStep('input');
    }
  };

  const handleDelete = async (id: string) => {
    await deleteDocument(id);
    if (activeDocId === id) {
      setActiveDocId(null);
      setStep('list');
    }
    toast.success('Deleted');
  };

  const handleExportMd = () => {
    const text = generatedOutput || generateDocument(title, content, activeTemplate.sections, mod.name);
    const blob = new Blob([text], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(title || mod.name).replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}.md`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Exported');
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedOutput);
    toast.success('Copied to clipboard');
  };

  const filledCount = activeTemplate.sections.filter(s => content[s.key]?.trim()).length;

  return (
    <div>
      <PageHeader
        title={mod.name}
        description={mod.description}
        actions={
          <Button size="sm" onClick={handleNew} className="gap-1.5">
            <Plus className="h-3.5 w-3.5" />
            New {mod.name}
          </Button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
        {/* Saved list */}
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
            Saved ({documents.length})
          </h3>
          {documents.length === 0 ? (
            <div className="glass-card rounded-xl p-6 text-center">
              <p className="text-sm text-muted-foreground mb-3">No {mod.name.toLowerCase()}s yet</p>
              <Button size="sm" variant="outline" onClick={handleNew}>Create First</Button>
            </div>
          ) : (
            <ScrollArea className="max-h-[calc(100vh-280px)]">
              <div className="space-y-1.5 pr-2">
                {documents.map((doc) => (
                  <DocumentCard
                    key={doc.id}
                    document={doc}
                    isActive={doc.id === activeDocId}
                    onClick={() => handleSelect(doc)}
                    onStar={() => toggleStar(doc.id)}
                    onDelete={() => handleDelete(doc.id)}
                    onExport={() => {
                      downloadMarkdown(doc);
                      toast.success('Exported');
                    }}
                  />
                ))}
              </div>
            </ScrollArea>
          )}
        </div>

        {/* Main area */}
        <div>
          {step === 'list' && (
            <div className="glass-card rounded-2xl flex items-center justify-center min-h-[450px]">
              <div className="text-center p-8">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 mx-auto mb-4">
                  <Sparkles className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-base font-semibold mb-2">{mod.name}</h3>
                <p className="text-sm text-muted-foreground max-w-sm mb-5">{mod.description}</p>
                <Button onClick={handleNew} className="gap-1.5">
                  <Plus className="h-3.5 w-3.5" /> Get Started
                </Button>
              </div>
            </div>
          )}

          {step === 'input' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <button onClick={() => setStep('list')} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
                  <ArrowLeft className="h-3.5 w-3.5" /> Back
                </button>
                <span className="text-xs text-muted-foreground">{filledCount}/{activeTemplate.sections.length} completed</span>
              </div>

              <div className="glass-card rounded-xl p-5">
                <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Title *</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)}
                  placeholder={`Name your ${mod.name.toLowerCase()}...`}
                  className="mt-2 text-lg font-semibold h-11 border-0 bg-transparent px-0 focus-visible:ring-0" />
              </div>

              {activeTemplate.sections.map((section, i) => (
                <div key={section.key} className="glass-card rounded-xl p-5">
                  <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                    {section.label}{section.required && <span className="text-destructive ml-0.5">*</span>}
                  </Label>
                  <p className="text-[11px] text-muted-foreground/70 mt-0.5 mb-2">{section.placeholder}</p>
                  {section.type === 'text' ? (
                    <Input value={content[section.key] || ''}
                      onChange={(e) => setContent((prev) => ({ ...prev, [section.key]: e.target.value }))}
                      className="border-0 bg-muted/50 focus-visible:ring-1 focus-visible:ring-primary/30" />
                  ) : (
                    <Textarea value={content[section.key] || ''}
                      onChange={(e) => setContent((prev) => ({ ...prev, [section.key]: e.target.value }))}
                      rows={4}
                      className="border-0 bg-muted/50 focus-visible:ring-1 focus-visible:ring-primary/30 resize-y min-h-[80px]" />
                  )}
                </div>
              ))}

              <div className="flex items-center gap-3 justify-end pt-2">
                <Button variant="outline" size="sm" onClick={handleSave} disabled={!title.trim()} className="gap-1.5">
                  <Save className="h-3.5 w-3.5" /> Save Draft
                </Button>
                <Button onClick={handleGenerate} disabled={!title.trim()} className="gap-2 px-6">
                  <Sparkles className="h-4 w-4" /> Generate {mod.name}
                </Button>
              </div>
            </div>
          )}

          {step === 'output' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <button onClick={() => setStep('input')} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
                  <ArrowLeft className="h-3.5 w-3.5" /> Edit Inputs
                </button>
                <div className="flex items-center gap-2 flex-wrap">
                  <Button variant="outline" size="sm" onClick={handleCopy} className="gap-1.5">
                    <Copy className="h-3.5 w-3.5" /> Copy
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setEditingOutput(!editingOutput)} className="gap-1.5">
                    <Pencil className="h-3.5 w-3.5" /> {editingOutput ? 'Preview' : 'Edit'}
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleExportMd} className="gap-1.5">
                    <FileDown className="h-3.5 w-3.5" /> Export .md
                  </Button>
                  <Button size="sm" onClick={handleSave} className="gap-1.5">
                    <Save className="h-3.5 w-3.5" /> Save
                  </Button>
                </div>
              </div>

              <div className="glass-card rounded-2xl p-6 min-h-[400px]">
                <div className="flex items-center gap-2 mb-4 pb-3 border-b border-border">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <span className="text-xs font-semibold uppercase tracking-widest text-primary">Generated {mod.name}</span>
                </div>

                {editingOutput ? (
                  <Textarea value={generatedOutput} onChange={(e) => setGeneratedOutput(e.target.value)}
                    className="min-h-[350px] font-mono text-sm border-0 bg-transparent px-0 focus-visible:ring-0 resize-y" />
                ) : (
                  <div className="space-y-1">
                    {generatedOutput.split('\n').map((line, i) => {
                      if (line.startsWith('# ')) return <h1 key={i} className="text-xl font-bold mb-2 mt-0">{line.slice(2)}</h1>;
                      if (line.startsWith('> ')) return <p key={i} className="text-xs text-muted-foreground border-l-2 border-primary/30 pl-3 mb-3">{line.slice(2)}</p>;
                      if (line.startsWith('## ')) return <h2 key={i} className="text-sm font-semibold uppercase tracking-widest text-primary mt-5 mb-2">{line.slice(3)}</h2>;
                      if (line.startsWith('---')) return <Separator key={i} className="my-4" />;
                      if (line.startsWith('*') && line.endsWith('*')) return <p key={i} className="text-[11px] text-muted-foreground italic">{line.slice(1, -1)}</p>;
                      if (line.startsWith('- **')) {
                        const match = line.match(/^- \*\*(.+?)\*\*:?\s*(.*)/);
                        if (match) return <p key={i} className="text-sm mb-1 pl-3"><span className="font-semibold">{match[1]}</span>{match[2] ? `: ${match[2]}` : ''}</p>;
                      }
                      if (line.startsWith('- ')) return <p key={i} className="text-sm text-foreground/90 pl-3 mb-1">• {line.slice(2)}</p>;
                      if (line.trim() === '') return <div key={i} className="h-1.5" />;
                      return <p key={i} className="text-sm text-foreground/90 mb-1 leading-relaxed">{line}</p>;
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
