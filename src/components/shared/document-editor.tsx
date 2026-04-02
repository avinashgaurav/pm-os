'use client';

import { useState } from 'react';
import { Plus, FileDown, ArrowLeft, Sparkles, Copy, Pencil, Save, Loader2 } from 'lucide-react';
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
import { getOutputName } from '@/lib/output-names';
import { generateWithAI, buildModulePrompt, getApiKey, setApiKey, hasApiKey } from '@/lib/ai';
import type { BaseDocument, CategorySlug, ModuleTemplate } from '@/types';

interface DocumentEditorProps {
  category: CategorySlug;
  moduleSlug: string;
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
  const [generating, setGenerating] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showKeyInput, setShowKeyInput] = useState(false);
  const [keyInput, setKeyInput] = useState('');

  if (!mod) return <div className="text-muted-foreground">Module not found</div>;

  const outputName = getOutputName(moduleSlug, mod.name);
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
    setActiveDocId(null); setTitle(''); setContent({}); setGeneratedOutput('');
    setEditingOutput(false); setErrors({}); setStep('input');
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

    const apiKey = getApiKey();
    if (!apiKey) {
      setShowKeyInput(true);
      toast.error('Add your API key to generate with AI');
      return;
    }

    setGenerating(true);
    try {
      const sections = activeTemplate.sections.map(s => ({ label: s.label, value: content[s.key] || '' }));
      const { system, user } = buildModulePrompt(category, moduleSlug, outputName, title, sections);
      const output = await generateWithAI(apiKey, system, user);
      setGeneratedOutput(output);
      setStep('output');
      toast.success(`${outputName} generated with AI`);

      // Auto-save
      const saveContent = { ...content, _output: output };
      if (activeDocId) {
        await updateDocument(activeDocId, { title, content: saveContent });
      } else {
        const doc = await createDocument({ title, category, moduleSlug, tags: [], content: saveContent });
        setActiveDocId(doc.id);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Generation failed';
      toast.error(msg);
    }
    setGenerating(false);
  };

  const handleSave = async () => {
    if (!title.trim()) { toast.error('Title required'); return; }
    const saveContent = { ...content, _output: generatedOutput };
    if (activeDocId) {
      await updateDocument(activeDocId, { title, content: saveContent });
    } else {
      const doc = await createDocument({ title, category, moduleSlug, tags: [], content: saveContent });
      setActiveDocId(doc.id);
    }
    toast.success('Saved');
  };

  const handleSelect = (doc: BaseDocument) => {
    setActiveDocId(doc.id); setTitle(doc.title); setErrors({});
    const { _output, _generatedOutput, ...inputFields } = doc.content;
    setContent(inputFields);
    const output = _output || _generatedOutput || '';
    if (output) { setGeneratedOutput(output); setStep('output'); }
    else { setGeneratedOutput(''); setStep('input'); }
  };

  const handleDelete = async (id: string) => {
    await deleteDocument(id);
    if (activeDocId === id) { setActiveDocId(null); setStep('list'); }
    toast.success('Deleted');
  };

  const handleExportMd = () => {
    const text = generatedOutput;
    const blob = new Blob([text], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url;
    a.download = `${(title || outputName).replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}.md`;
    a.click(); URL.revokeObjectURL(url);
    toast.success('Exported as Markdown');
  };

  const handleCopy = () => { navigator.clipboard.writeText(generatedOutput); toast.success('Copied'); };

  const filledCount = activeTemplate.sections.filter(s => content[s.key]?.trim()).length;

  return (
    <div>
      <PageHeader title={mod.name} description={mod.description}
        actions={<Button size="sm" onClick={handleNew} className="gap-1.5"><Plus className="h-3.5 w-3.5" /> New {outputName}</Button>} />

      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
        {/* Saved list */}
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">Saved ({documents.length})</h3>
          {documents.length === 0 ? (
            <div className="glass-card rounded-xl p-6 text-center">
              <p className="text-sm font-medium mb-1">{mod.name}</p>
              <p className="text-xs text-muted-foreground mb-4">{mod.description}</p>
              <Button size="sm" onClick={handleNew}>Create Your First {outputName}</Button>
            </div>
          ) : (
            <ScrollArea className="max-h-[calc(100vh-280px)]">
              <div className="space-y-1.5 pr-2">
                {documents.map(doc => (
                  <DocumentCard key={doc.id} document={doc} isActive={doc.id === activeDocId}
                    onClick={() => handleSelect(doc)} onStar={() => toggleStar(doc.id)}
                    onDelete={() => handleDelete(doc.id)}
                    onExport={() => { downloadMarkdown(doc); toast.success('Exported'); }} />
                ))}
              </div>
            </ScrollArea>
          )}
        </div>

        {/* Main */}
        <div>
          {step === 'list' && (
            <div className="glass-card rounded-2xl flex items-center justify-center min-h-[450px]">
              <div className="text-center p-8 max-w-md">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 mx-auto mb-4">
                  <Sparkles className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{mod.name}</h3>
                <p className="text-sm text-muted-foreground mb-2">{mod.description}</p>
                <p className="text-xs text-muted-foreground/70 mb-5">Fill in the form, then AI generates a professional {outputName.toLowerCase()} ready to share.</p>
                <Button onClick={handleNew} className="gap-1.5"><Plus className="h-3.5 w-3.5" /> Create {outputName}</Button>
                {!hasApiKey() && (
                  <p className="text-[10px] text-muted-foreground/50 mt-3 cursor-pointer hover:text-muted-foreground" onClick={() => setShowKeyInput(true)}>
                    Requires API key — click to set up
                  </p>
                )}
              </div>
            </div>
          )}

          {step === 'input' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <button onClick={() => {
                  if (title.trim() || filledCount > 0) { if (!confirm('You have unsaved changes. Leave?')) return; }
                  setStep('list');
                }} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
                  <ArrowLeft className="h-3.5 w-3.5" /> Back
                </button>
                <span className="text-xs text-muted-foreground">{filledCount}/{activeTemplate.sections.length} completed</span>
              </div>

              <div id="field-title" className="glass-card rounded-xl p-5">
                <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Title *</Label>
                <Input value={title} onChange={e => { setTitle(e.target.value); setErrors(p => ({...p, title: ''})); }}
                  placeholder={`Name your ${outputName.toLowerCase()}...`}
                  className={`mt-2 text-lg font-semibold h-11 border-0 bg-transparent px-0 focus-visible:ring-0 ${errors.title ? 'ring-2 ring-destructive/50 rounded' : ''}`} />
                {errors.title && <p className="text-xs text-destructive mt-1">{errors.title}</p>}
              </div>

              {activeTemplate.sections.map(section => (
                <div key={section.key} id={`field-${section.key}`} className="glass-card rounded-xl p-5">
                  <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                    {section.label}{section.required && <span className="text-destructive ml-0.5">*</span>}
                  </Label>
                  <p className="text-[11px] text-muted-foreground/70 mt-0.5 mb-2">{section.placeholder}</p>
                  {section.type === 'text' ? (
                    <Input value={content[section.key] || ''}
                      onChange={e => { setContent(p => ({...p, [section.key]: e.target.value})); setErrors(p => ({...p, [section.key]: ''})); }}
                      className={`border-0 bg-muted/50 focus-visible:ring-1 focus-visible:ring-primary/30 ${errors[section.key] ? 'ring-2 ring-destructive/50' : ''}`} />
                  ) : (
                    <Textarea value={content[section.key] || ''}
                      onChange={e => { setContent(p => ({...p, [section.key]: e.target.value})); setErrors(p => ({...p, [section.key]: ''})); }}
                      rows={4} className={`border-0 bg-muted/50 focus-visible:ring-1 focus-visible:ring-primary/30 resize-y min-h-[80px] ${errors[section.key] ? 'ring-2 ring-destructive/50' : ''}`} />
                  )}
                  {errors[section.key] && <p className="text-xs text-destructive mt-1">{errors[section.key]}</p>}
                </div>
              ))}

              <div className="flex items-center gap-3 justify-between pt-2">
                <div className="flex items-center gap-2">
                  {!hasApiKey() && (
                    <button onClick={() => setShowKeyInput(true)} className="text-[10px] text-primary hover:underline">Set up API key</button>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <Button variant="outline" size="sm" onClick={handleSave} disabled={!title.trim()} className="gap-1.5">
                    <Save className="h-3.5 w-3.5" /> Save Draft
                  </Button>
                  <Button onClick={handleGenerate} disabled={generating || !title.trim()} className="gap-2 px-6">
                    {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                    {generating ? 'Generating...' : `Generate ${outputName}`}
                  </Button>
                </div>
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
                  <Button variant="outline" size="sm" onClick={handleCopy} className="gap-1.5"><Copy className="h-3.5 w-3.5" /> Copy</Button>
                  <Button variant="outline" size="sm" onClick={() => setEditingOutput(!editingOutput)} className="gap-1.5">
                    <Pencil className="h-3.5 w-3.5" /> {editingOutput ? 'Preview' : 'Edit'}
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleExportMd} className="gap-1.5"><FileDown className="h-3.5 w-3.5" /> Export</Button>
                  <Button size="sm" onClick={handleSave} className="gap-1.5"><Save className="h-3.5 w-3.5" /> Save</Button>
                </div>
              </div>

              <div className="glass-card rounded-2xl p-6 min-h-[400px]">
                <div className="flex items-center gap-2 mb-4 pb-3 border-b border-border">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <span className="text-xs font-semibold uppercase tracking-widest text-primary">AI-Generated {outputName}</span>
                </div>
                {editingOutput ? (
                  <Textarea value={generatedOutput} onChange={e => setGeneratedOutput(e.target.value)}
                    className="min-h-[350px] font-mono text-sm border-0 bg-transparent px-0 focus-visible:ring-0 resize-y" />
                ) : (
                  <div className="space-y-1">
                    {generatedOutput.split('\n').map((line, i) => {
                      if (line.startsWith('# ')) return <h1 key={i} className="text-xl font-bold mb-3 mt-0">{line.slice(2)}</h1>;
                      if (line.startsWith('## ')) return <h2 key={i} className="text-base font-semibold text-primary mt-6 mb-2">{line.slice(3)}</h2>;
                      if (line.startsWith('### ')) return <h3 key={i} className="text-sm font-semibold mt-4 mb-1">{line.slice(4)}</h3>;
                      if (line.startsWith('---')) return <Separator key={i} className="my-4" />;
                      if (line.startsWith('- [ ] ')) return <p key={i} className="text-sm pl-4 mb-1 flex items-center gap-2"><span className="w-3.5 h-3.5 rounded border border-border inline-block shrink-0" />{line.slice(6)}</p>;
                      if (line.startsWith('- **')) {
                        const m = line.match(/^- \*\*(.+?)\*\*:?\s*(.*)/);
                        if (m) return <p key={i} className="text-sm mb-1 pl-4"><span className="font-semibold">{m[1]}</span>{m[2] ? `: ${m[2]}` : ''}</p>;
                      }
                      if (line.startsWith('- ') || line.startsWith('* ')) return <p key={i} className="text-sm text-foreground/90 pl-4 mb-1">• {line.slice(2)}</p>;
                      if (line.match(/^\d+\./)) return <p key={i} className="text-sm text-foreground/90 pl-4 mb-1">{line}</p>;
                      if (line.startsWith('**') && line.endsWith('**')) return <p key={i} className="text-sm font-semibold mt-3 mb-1">{line.replace(/\*\*/g, '')}</p>;
                      if (line.startsWith('> ')) return <p key={i} className="text-sm text-muted-foreground border-l-2 border-primary/30 pl-3 mb-2 italic">{line.slice(2)}</p>;
                      if (line.trim() === '') return <div key={i} className="h-2" />;
                      return <p key={i} className="text-sm text-foreground/90 mb-1.5 leading-relaxed">{line.replace(/\*\*(.+?)\*\*/g, (_, t) => `<strong>${t}</strong>`).split('<strong>').map((part, j) => {
                        if (j === 0) return part;
                        const [bold, rest] = part.split('</strong>');
                        return <span key={j}><strong className="font-semibold">{bold}</strong>{rest}</span>;
                      })}</p>;
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
