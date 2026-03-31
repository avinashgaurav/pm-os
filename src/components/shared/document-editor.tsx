'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, FileDown, ArrowLeft, Sparkles, Copy, Pencil } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { PageHeader } from './page-header';
import { EmptyState } from './empty-state';
import { DocumentCard } from './document-card';
import { useDocuments } from '@/hooks/use-documents';
import { downloadMarkdown } from '@/lib/export';
import { getModule } from '@/lib/constants';
import { getTemplate } from '@/lib/templates';
import type { BaseDocument, CategorySlug, ModuleTemplate } from '@/types';

interface DocumentEditorProps {
  category: CategorySlug;
  moduleSlug: string;
}

function generateOutput(title: string, content: Record<string, string>, sections: ModuleTemplate['sections'], moduleName: string): string {
  const lines: string[] = [];
  lines.push(`# ${title || moduleName}`);
  lines.push('');

  for (const section of sections) {
    const val = content[section.key]?.trim();
    if (val) {
      lines.push(`## ${section.label}`);
      lines.push('');
      // Format bullet points if content has newlines
      const formatted = val.split('\n').map(line => {
        const trimmed = line.trim();
        if (!trimmed) return '';
        if (trimmed.startsWith('-') || trimmed.startsWith('•') || trimmed.startsWith('*')) return trimmed;
        return trimmed;
      }).join('\n');
      lines.push(formatted);
      lines.push('');
    }
  }

  lines.push('---');
  lines.push(`*Generated with PM OS — ${moduleName}*`);
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

  const activeDoc = documents.find((d) => d.id === activeDocId);

  useEffect(() => {
    if (activeDoc) {
      setTitle(activeDoc.title);
      setContent(activeDoc.content);
    }
  }, [activeDoc]);

  if (!mod) {
    return <div className="text-muted-foreground">Module not found</div>;
  }

  const activeTemplate = template || {
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

  const handleGenerate = async () => {
    if (!title.trim()) {
      toast.error('Enter a title first');
      return;
    }
    const output = generateOutput(title, content, activeTemplate.sections, mod.name);
    setGeneratedOutput(output);
    setStep('output');
    toast.success(`${mod.name} generated`);
  };

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error('Title required');
      return;
    }
    // Store the generated output in content under a special key
    const saveContent = { ...content, _generatedOutput: generatedOutput };
    if (activeDocId) {
      await updateDocument(activeDocId, { title, content: saveContent });
      toast.success('Updated');
    } else {
      const doc = await createDocument({ title, category, moduleSlug, tags: [], content: saveContent });
      setActiveDocId(doc.id);
      toast.success('Saved');
    }
  };

  const handleSelect = (doc: BaseDocument) => {
    setActiveDocId(doc.id);
    setTitle(doc.title);
    const { _generatedOutput, ...rest } = doc.content;
    setContent(rest);
    if (_generatedOutput) {
      setGeneratedOutput(_generatedOutput);
      setStep('output');
    } else {
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

  const handleExport = (doc: BaseDocument) => {
    downloadMarkdown(doc);
    toast.success('Exported as Markdown');
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedOutput);
    toast.success('Copied to clipboard');
  };

  // Calculate how many input fields are filled
  const filledCount = activeTemplate.sections.filter(s => content[s.key]?.trim()).length;
  const requiredFilled = activeTemplate.sections.filter(s => s.required).every(s => content[s.key]?.trim());

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
        {/* Left: Saved list */}
        <div className="space-y-2">
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
                    onExport={() => handleExport(doc)}
                  />
                ))}
              </div>
            </ScrollArea>
          )}
        </div>

        {/* Right: Editor area */}
        <AnimatePresence mode="wait">
          {step === 'list' && (
            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="glass-card rounded-2xl flex items-center justify-center min-h-[450px]">
              <div className="text-center p-8">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 mx-auto mb-4">
                  <Sparkles className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-base font-semibold mb-2">Generate a {mod.name}</h3>
                <p className="text-sm text-muted-foreground max-w-sm mb-4">{mod.description}</p>
                <Button onClick={handleNew} className="gap-1.5">
                  <Plus className="h-3.5 w-3.5" />
                  Get Started
                </Button>
              </div>
            </motion.div>
          )}

          {step === 'input' && (
            <motion.div key="input" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }} transition={{ duration: 0.2, ease: [0.22, 0.61, 0.36, 1] as const }}
              className="space-y-5">
              <div className="flex items-center justify-between">
                <button onClick={() => { setStep('list'); }} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
                  <ArrowLeft className="h-3.5 w-3.5" /> Back
                </button>
                <div className="text-xs text-muted-foreground">
                  {filledCount}/{activeTemplate.sections.length} fields completed
                </div>
              </div>

              {/* Title */}
              <div className="glass-card rounded-xl p-5">
                <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  Title *
                </Label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={`Name your ${mod.name.toLowerCase()}...`}
                  className="mt-2 text-lg font-semibold h-11 border-0 bg-transparent px-0 focus-visible:ring-0"
                />
              </div>

              {/* Input sections */}
              <div className="space-y-4">
                {activeTemplate.sections.map((section, i) => (
                  <motion.div key={section.key} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }} className="glass-card rounded-xl p-5">
                    <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                      {section.label}
                      {section.required && <span className="text-destructive ml-0.5">*</span>}
                    </Label>
                    {section.type === 'text' ? (
                      <Input
                        value={content[section.key] || ''}
                        onChange={(e) => setContent((prev) => ({ ...prev, [section.key]: e.target.value }))}
                        placeholder={section.placeholder}
                        className="mt-2 border-0 bg-transparent px-0 focus-visible:ring-0"
                      />
                    ) : (
                      <Textarea
                        value={content[section.key] || ''}
                        onChange={(e) => setContent((prev) => ({ ...prev, [section.key]: e.target.value }))}
                        placeholder={section.placeholder}
                        rows={4}
                        className="mt-2 border-0 bg-transparent px-0 focus-visible:ring-0 resize-y min-h-[80px]"
                      />
                    )}
                  </motion.div>
                ))}
              </div>

              {/* Generate button */}
              <div className="flex justify-end pt-2">
                <Button size="lg" onClick={handleGenerate} disabled={!title.trim()}
                  className="gap-2 px-8">
                  <Sparkles className="h-4 w-4" />
                  Generate {mod.name}
                </Button>
              </div>
            </motion.div>
          )}

          {step === 'output' && (
            <motion.div key="output" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }} transition={{ duration: 0.2, ease: [0.22, 0.61, 0.36, 1] as const }}
              className="space-y-4">
              <div className="flex items-center justify-between">
                <button onClick={() => setStep('input')} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
                  <ArrowLeft className="h-3.5 w-3.5" /> Edit Inputs
                </button>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={handleCopy} className="gap-1.5">
                    <Copy className="h-3.5 w-3.5" /> Copy
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setEditingOutput(!editingOutput)} className="gap-1.5">
                    <Pencil className="h-3.5 w-3.5" /> {editingOutput ? 'Preview' : 'Edit'}
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => {
                    if (activeDoc) handleExport(activeDoc);
                    else {
                      const blob = new Blob([generatedOutput], { type: 'text/markdown' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `${title.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}.md`;
                      a.click();
                      URL.revokeObjectURL(url);
                      toast.success('Exported');
                    }
                  }} className="gap-1.5">
                    <FileDown className="h-3.5 w-3.5" /> Export
                  </Button>
                  <Button size="sm" onClick={handleSave} className="gap-1.5">
                    Save {mod.name}
                  </Button>
                </div>
              </div>

              {/* Generated output */}
              <div className="glass-card rounded-2xl p-6 min-h-[400px]">
                <div className="flex items-center gap-2 mb-4 pb-3 border-b border-border">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <span className="text-xs font-semibold uppercase tracking-widest text-primary">Generated Output</span>
                </div>

                {editingOutput ? (
                  <Textarea
                    value={generatedOutput}
                    onChange={(e) => setGeneratedOutput(e.target.value)}
                    className="min-h-[350px] font-mono text-sm border-0 bg-transparent px-0 focus-visible:ring-0 resize-y"
                  />
                ) : (
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    {generatedOutput.split('\n').map((line, i) => {
                      if (line.startsWith('# ')) return <h1 key={i} className="text-xl font-bold mb-3 mt-0">{line.slice(2)}</h1>;
                      if (line.startsWith('## ')) return <h2 key={i} className="text-sm font-semibold uppercase tracking-widest text-primary mt-6 mb-2">{line.slice(3)}</h2>;
                      if (line.startsWith('---')) return <Separator key={i} className="my-4" />;
                      if (line.startsWith('*') && line.endsWith('*')) return <p key={i} className="text-xs text-muted-foreground italic mt-4">{line.slice(1, -1)}</p>;
                      if (line.startsWith('- ') || line.startsWith('• ')) return <p key={i} className="text-sm text-foreground/90 pl-4 mb-1">• {line.slice(2)}</p>;
                      if (line.trim() === '') return <div key={i} className="h-1" />;
                      return <p key={i} className="text-sm text-foreground/90 mb-1 leading-relaxed">{line}</p>;
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
