'use client';

import { useRef, useState } from 'react';
import {
  Plus,
  FileDown,
  ArrowLeft,
  Sparkles,
  Copy,
  Pencil,
  Save,
  Loader2,
  ChevronDown,
  Square,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { PageHeader } from './page-header';
import { DocumentCard } from './document-card';
import { useDocuments } from '@/hooks/use-documents';
import { downloadMarkdown, downloadPdf, type PdfTheme } from '@/lib/export';
import { getModule } from '@/lib/constants';
import { getTemplate } from '@/lib/templates';
import { getOutputName } from '@/lib/output-names';
import Link from 'next/link';
import {
  generateStreamWithAI,
  buildModulePrompt,
  hasAIPreference,
  AIError,
  formatUsage,
  type Usage,
} from '@/lib/ai';
import type { BaseDocument, CategorySlug, ModuleTemplate } from '@/types';

interface DocumentEditorProps {
  category: CategorySlug;
  moduleSlug: string;
}

// Pure helper — kept at module scope so it isn't recreated on every render
// and can be unit-tested independently.
function tailoredErrorMessage(err: unknown): string {
  if (err instanceof AIError) {
    switch (err.kind) {
      case 'auth':
        return 'Auth failed — check your API key in Settings.';
      case 'rate_limit': {
        const secs = err.retryAfterMs ? Math.ceil(err.retryAfterMs / 1000) : null;
        return secs
          ? `Rate limited — try again in ${secs}s.`
          : 'Rate limited — try again in a moment.';
      }
      case 'network':
        return 'Network error reaching the AI provider — check your connection.';
      case 'server':
        return 'Provider is having a bad time — try again, or switch provider in Settings.';
      case 'model':
        return err.message || 'Model rejected the request.';
      case 'aborted':
        return 'Cancelled.';
    }
  }
  return err instanceof Error ? err.message : 'Generation failed';
}

export function DocumentEditor({ category, moduleSlug }: DocumentEditorProps) {
  const mod = getModule(category, moduleSlug);
  const template = getTemplate(category, moduleSlug);
  const { documents, createDocument, updateDocument, deleteDocument, toggleStar } = useDocuments(
    category,
    moduleSlug
  );

  const [activeDocId, setActiveDocId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState<Record<string, string>>({});
  const [step, setStep] = useState<'list' | 'input' | 'output'>('list');
  const [generatedOutput, setGeneratedOutput] = useState('');
  const [lastUsage, setLastUsage] = useState<Usage | null>(null);
  const [editingOutput, setEditingOutput] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const abortRef = useRef<AbortController | null>(null);

  if (!mod) return <div className="text-muted-foreground">Module not found</div>;

  const outputName = getOutputName(moduleSlug, mod.name);
  const activeTemplate: ModuleTemplate = template || {
    moduleSlug,
    category,
    sections: [
      {
        key: 'context',
        label: 'Context & Background',
        placeholder: 'What is the context? What problem or opportunity are you addressing?',
        type: 'textarea' as const,
        required: true,
      },
      {
        key: 'inputs',
        label: 'Key Inputs',
        placeholder: 'What information, data, or research do you have?',
        type: 'textarea' as const,
      },
      {
        key: 'goals',
        label: 'Goals & Objectives',
        placeholder: 'What are you trying to achieve?',
        type: 'textarea' as const,
      },
      {
        key: 'constraints',
        label: 'Constraints & Considerations',
        placeholder: 'Any limitations, timelines, or constraints?',
        type: 'textarea' as const,
      },
    ],
  };

  const handleNew = () => {
    setActiveDocId(null);
    setTitle('');
    setContent({});
    setGeneratedOutput('');
    setEditingOutput(false);
    setErrors({});
    setStep('input');
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!title.trim()) newErrors['title'] = 'Title is required';
    for (const s of activeTemplate.sections) {
      if (s.required && !content[s.key]?.trim()) newErrors[s.key] = `${s.label} is required`;
    }
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      toast.error('Please fill in required fields');
      const el = document.getElementById(`field-${Object.keys(newErrors)[0]}`);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return false;
    }
    return true;
  };

  const handleGenerate = async () => {
    if (!validate()) return;

    if (!hasAIPreference()) {
      toast.error('Choose an AI provider in Settings first');
      return;
    }

    const controller = new AbortController();
    abortRef.current = controller;
    setGenerating(true);
    setStep('output');

    // Snapshot the previously displayed output so we can restore it if Stop
    // fires before any delta arrives (zero-delta abort against an existing
    // saved doc would otherwise blank the user's prior work).
    const priorOutput = generatedOutput;
    let firstDelta = true;

    let finalOutput = '';
    let aborted = false;
    let streamErrored = false;
    try {
      const sections = activeTemplate.sections.map((s) => ({
        label: s.label,
        value: content[s.key] || '',
      }));
      const { system, user } = buildModulePrompt(category, moduleSlug, outputName, title, sections);
      const result = await generateStreamWithAI(system, user, {
        signal: controller.signal,
        onDelta: (_chunk, full) => {
          if (firstDelta) {
            // Clear prior output only once the new stream actually produces
            // something. Until then, prior output stays on screen.
            firstDelta = false;
          }
          setGeneratedOutput(full);
        },
      });
      finalOutput = result.text;
      if (result.usage) setLastUsage(result.usage);
      aborted = controller.signal.aborted;
      if (!aborted) toast.success(`${outputName} generated with AI`);
    } catch (err: unknown) {
      streamErrored = true;
      toast.error(tailoredErrorMessage(err));
    }

    // Persist whatever we received — full result or partial after Stop. Stay
    // in the generating state until persistence completes so a re-click of
    // Generate can't race the save.
    if (finalOutput) {
      const saveContent = { ...content, _output: finalOutput };
      try {
        if (activeDocId) {
          await updateDocument(activeDocId, { title, content: saveContent });
        } else {
          const doc = await createDocument({
            title,
            category,
            moduleSlug,
            tags: [],
            content: saveContent,
          });
          setActiveDocId(doc.id);
        }
      } catch {
        // Persistence failure is non-fatal — the output is in state.
      }
      if (aborted) toast.success(`Stopped — saved partial ${outputName}`);
    } else if (aborted || streamErrored) {
      // No tokens arrived. Restore the prior output so we don't clobber the
      // user's previously saved result with an empty string.
      setGeneratedOutput(priorOutput);
      if (!priorOutput) setStep('input');
    }

    abortRef.current = null;
    setGenerating(false);
  };

  const handleStop = () => {
    abortRef.current?.abort();
  };

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error('Title required');
      return;
    }
    const saveContent = { ...content, _output: generatedOutput };
    if (activeDocId) {
      await updateDocument(activeDocId, { title, content: saveContent });
    } else {
      const doc = await createDocument({
        title,
        category,
        moduleSlug,
        tags: [],
        content: saveContent,
      });
      setActiveDocId(doc.id);
    }
    toast.success('Saved');
  };

  const handleSelect = (doc: BaseDocument) => {
    setActiveDocId(doc.id);
    setTitle(doc.title);
    setErrors({});
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

  const buildExportDoc = (): BaseDocument => {
    const saved = activeDocId ? documents.find((d) => d.id === activeDocId) : undefined;
    const now = new Date().toISOString();
    return {
      id: activeDocId || 'preview',
      title: title || outputName,
      category,
      moduleSlug,
      createdAt: saved?.createdAt ?? now,
      updatedAt: saved?.updatedAt ?? now,
      tags: saved?.tags ?? [],
      starred: false,
      archived: false,
      content: { ...content, _output: generatedOutput },
    };
  };

  const handleExportMd = () => {
    downloadMarkdown(buildExportDoc());
    toast.success('Exported as Markdown');
  };

  const handleExportPdf = (theme: PdfTheme) => {
    try {
      downloadPdf(buildExportDoc(), theme);
      toast.success(theme === 'premium' ? 'Exported as PDF — Premium' : 'Exported as PDF');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'PDF export failed';
      toast.error(msg);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedOutput);
    toast.success('Copied');
  };

  const filledCount = activeTemplate.sections.filter((s) => content[s.key]?.trim()).length;

  return (
    <div>
      <PageHeader
        title={mod.name}
        description={mod.description}
        actions={
          <Button size="sm" onClick={handleNew} className="gap-1.5">
            <Plus className="h-3.5 w-3.5" /> New {outputName}
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
            <div className="surface hairline rounded-xl p-6 text-center">
              <p className="text-sm font-medium mb-1">{mod.name}</p>
              <p className="text-xs text-muted-foreground mb-4">{mod.description}</p>
              <Button size="sm" onClick={handleNew}>
                Create Your First {outputName}
              </Button>
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

        {/* Main */}
        <div>
          {step === 'list' && (
            <div className="surface hairline rounded-xl flex items-center justify-center min-h-[450px]">
              <div className="text-center p-8 max-w-md">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 mx-auto mb-4">
                  <Sparkles className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{mod.name}</h3>
                <p className="text-sm text-muted-foreground mb-2">{mod.description}</p>
                <p className="text-xs text-muted-foreground/70 mb-5">
                  Fill in the form, then AI generates a professional {outputName.toLowerCase()}{' '}
                  ready to share.
                </p>
                <Button onClick={handleNew} className="gap-1.5">
                  <Plus className="h-3.5 w-3.5" /> Create {outputName}
                </Button>
                {!hasAIPreference() && (
                  <Link
                    href="/settings"
                    className="text-[10px] text-muted-foreground/50 mt-3 inline-block hover:text-muted-foreground"
                  >
                    Pick an AI provider in Settings
                  </Link>
                )}
              </div>
            </div>
          )}

          {step === 'input' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => {
                    if (title.trim() || filledCount > 0) {
                      if (!confirm('You have unsaved changes. Leave?')) return;
                    }
                    setStep('list');
                  }}
                  className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ArrowLeft className="h-3.5 w-3.5" /> Back
                </button>
                <span className="text-xs text-muted-foreground">
                  {filledCount}/{activeTemplate.sections.length} completed
                </span>
              </div>

              <div id="field-title" className="surface hairline rounded-xl p-5">
                <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  Title *
                </Label>
                <Input
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    setErrors((p) => ({ ...p, title: '' }));
                  }}
                  placeholder={`Name your ${outputName.toLowerCase()}...`}
                  className={`mt-2 text-lg font-semibold h-11 border-0 bg-transparent px-0 focus-visible:ring-0 ${errors.title ? 'ring-2 ring-destructive/50 rounded' : ''}`}
                />
                {errors.title && <p className="text-xs text-destructive mt-1">{errors.title}</p>}
              </div>

              {activeTemplate.sections.map((section) => (
                <div
                  key={section.key}
                  id={`field-${section.key}`}
                  className="surface hairline rounded-xl p-5"
                >
                  <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                    {section.label}
                    {section.required && <span className="text-destructive ml-0.5">*</span>}
                  </Label>
                  <p className="text-[11px] text-muted-foreground/70 mt-0.5 mb-2">
                    {section.placeholder}
                  </p>
                  {section.type === 'text' ? (
                    <Input
                      value={content[section.key] || ''}
                      onChange={(e) => {
                        setContent((p) => ({ ...p, [section.key]: e.target.value }));
                        setErrors((p) => ({ ...p, [section.key]: '' }));
                      }}
                      className={`border-0 bg-muted/50 focus-visible:ring-1 focus-visible:ring-primary/30 ${errors[section.key] ? 'ring-2 ring-destructive/50' : ''}`}
                    />
                  ) : (
                    <Textarea
                      value={content[section.key] || ''}
                      onChange={(e) => {
                        setContent((p) => ({ ...p, [section.key]: e.target.value }));
                        setErrors((p) => ({ ...p, [section.key]: '' }));
                      }}
                      rows={4}
                      className={`border-0 bg-muted/50 focus-visible:ring-1 focus-visible:ring-primary/30 resize-y min-h-[80px] ${errors[section.key] ? 'ring-2 ring-destructive/50' : ''}`}
                    />
                  )}
                  {errors[section.key] && (
                    <p className="text-xs text-destructive mt-1">{errors[section.key]}</p>
                  )}
                </div>
              ))}

              <div className="flex items-center gap-3 justify-between pt-2">
                <div className="flex items-center gap-2">
                  {!hasAIPreference() && (
                    <Link href="/settings" className="text-[10px] text-primary hover:underline">
                      Pick a provider in Settings
                    </Link>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSave}
                    disabled={!title.trim()}
                    className="gap-1.5"
                  >
                    <Save className="h-3.5 w-3.5" /> Save Draft
                  </Button>
                  <div
                    className={
                      generating ? 'ai-generating rounded-lg inline-block' : 'inline-block'
                    }
                  >
                    <Button
                      onClick={handleGenerate}
                      disabled={generating || !title.trim()}
                      className="gap-2 px-6"
                    >
                      {generating ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Sparkles className="h-4 w-4" />
                      )}
                      {generating ? 'Generating...' : `Generate ${outputName}`}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 'output' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <button
                  onClick={() => setStep('input')}
                  disabled={generating}
                  className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ArrowLeft className="h-3.5 w-3.5" /> Edit Inputs
                </button>
                <div className="flex items-center gap-2 flex-wrap">
                  {generating && (
                    <Button variant="outline" size="sm" onClick={handleStop} className="gap-1.5">
                      <Square className="h-3 w-3 fill-current" /> Stop
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopy}
                    disabled={generating}
                    className="gap-1.5"
                  >
                    <Copy className="h-3.5 w-3.5" /> Copy
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditingOutput(!editingOutput)}
                    disabled={generating}
                    className="gap-1.5"
                  >
                    <Pencil className="h-3.5 w-3.5" /> {editingOutput ? 'Preview' : 'Edit'}
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      render={
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={generating}
                          className="gap-1.5"
                        />
                      }
                    >
                      <FileDown className="h-3.5 w-3.5" /> Export{' '}
                      <ChevronDown className="h-3 w-3 opacity-60" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={handleExportMd}>Markdown (.md)</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => handleExportPdf('default')}>
                        PDF — Default
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleExportPdf('premium')}>
                        PDF — Premium
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <Button size="sm" onClick={handleSave} disabled={generating} className="gap-1.5">
                    <Save className="h-3.5 w-3.5" /> Save
                  </Button>
                </div>
              </div>

              <div
                className={`surface hairline rounded-xl p-6 min-h-[400px] ${generating ? 'ai-generating' : ''}`}
              >
                <div className="flex items-center justify-between gap-2 mb-4 pb-3 border-b border-border">
                  <div className="flex items-center gap-2">
                    <Sparkles
                      className={`h-4 w-4 text-foreground/70 ${generating ? 'animate-pulse' : ''}`}
                    />
                    <span className="ai-gradient-text text-xs font-semibold uppercase tracking-widest">
                      {generating ? 'Streaming' : 'AI-Generated'} {outputName}
                    </span>
                  </div>
                  {!generating && lastUsage && (
                    <span
                      title={`${lastUsage.model} · ${lastUsage.inputTokens.toLocaleString()} in / ${lastUsage.outputTokens.toLocaleString()} out`}
                      className="text-[10px] font-mono text-muted-foreground tabular-nums"
                    >
                      {formatUsage(lastUsage)}
                    </span>
                  )}
                </div>
                {editingOutput ? (
                  <Textarea
                    value={generatedOutput}
                    onChange={(e) => setGeneratedOutput(e.target.value)}
                    className="min-h-[350px] font-mono text-sm border-0 bg-transparent px-0 focus-visible:ring-0 resize-y"
                  />
                ) : (
                  <div className="space-y-1">
                    {generatedOutput.split('\n').map((line, i) => {
                      if (line.startsWith('# '))
                        return (
                          <h1 key={i} className="text-xl font-bold mb-3 mt-0">
                            {line.slice(2)}
                          </h1>
                        );
                      if (line.startsWith('## '))
                        return (
                          <h2 key={i} className="text-base font-semibold text-primary mt-6 mb-2">
                            {line.slice(3)}
                          </h2>
                        );
                      if (line.startsWith('### '))
                        return (
                          <h3 key={i} className="text-sm font-semibold mt-4 mb-1">
                            {line.slice(4)}
                          </h3>
                        );
                      if (line.startsWith('---')) return <Separator key={i} className="my-4" />;
                      if (line.startsWith('- [ ] '))
                        return (
                          <p key={i} className="text-sm pl-4 mb-1 flex items-center gap-2">
                            <span className="w-3.5 h-3.5 rounded border border-border inline-block shrink-0" />
                            {line.slice(6)}
                          </p>
                        );
                      if (line.startsWith('- **')) {
                        const m = line.match(/^- \*\*(.+?)\*\*:?\s*(.*)/);
                        if (m)
                          return (
                            <p key={i} className="text-sm mb-1 pl-4">
                              <span className="font-semibold">{m[1]}</span>
                              {m[2] ? `: ${m[2]}` : ''}
                            </p>
                          );
                      }
                      if (line.startsWith('- ') || line.startsWith('* '))
                        return (
                          <p key={i} className="text-sm text-foreground/90 pl-4 mb-1">
                            • {line.slice(2)}
                          </p>
                        );
                      if (line.match(/^\d+\./))
                        return (
                          <p key={i} className="text-sm text-foreground/90 pl-4 mb-1">
                            {line}
                          </p>
                        );
                      if (line.startsWith('**') && line.endsWith('**'))
                        return (
                          <p key={i} className="text-sm font-semibold mt-3 mb-1">
                            {line.replace(/\*\*/g, '')}
                          </p>
                        );
                      if (line.startsWith('> '))
                        return (
                          <p
                            key={i}
                            className="text-sm text-muted-foreground border-l-2 border-primary/30 pl-3 mb-2 italic"
                          >
                            {line.slice(2)}
                          </p>
                        );
                      if (line.trim() === '') return <div key={i} className="h-2" />;
                      return (
                        <p key={i} className="text-sm text-foreground/90 mb-1.5 leading-relaxed">
                          {line
                            .replace(/\*\*(.+?)\*\*/g, (_, t) => `<strong>${t}</strong>`)
                            .split('<strong>')
                            .map((part, j) => {
                              if (j === 0) return part;
                              const [bold, rest] = part.split('</strong>');
                              return (
                                <span key={j}>
                                  <strong className="font-semibold">{bold}</strong>
                                  {rest}
                                </span>
                              );
                            })}
                        </p>
                      );
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
