'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Save, FileDown, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
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

export function DocumentEditor({ category, moduleSlug }: DocumentEditorProps) {
  const mod = getModule(category, moduleSlug);
  const template = getTemplate(category, moduleSlug);
  const { documents, createDocument, updateDocument, deleteDocument, toggleStar } =
    useDocuments(category, moduleSlug);

  const [activeDocId, setActiveDocId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState<Record<string, string>>({});
  const [isEditing, setIsEditing] = useState(false);

  const activeDoc = documents.find((d) => d.id === activeDocId);

  useEffect(() => {
    if (activeDoc) {
      setTitle(activeDoc.title);
      setContent(activeDoc.content);
    }
  }, [activeDoc]);

  const handleNew = useCallback(() => {
    setActiveDocId(null);
    setTitle('');
    setContent({});
    setIsEditing(true);
  }, []);

  const handleSave = useCallback(async () => {
    if (!title.trim()) {
      toast.error('Please enter a title');
      return;
    }
    if (activeDocId) {
      await updateDocument(activeDocId, { title, content });
      toast.success('Document updated');
    } else {
      const doc = await createDocument({
        title,
        category,
        moduleSlug,
        tags: [],
        content,
      });
      setActiveDocId(doc.id);
      toast.success('Document created');
    }
  }, [activeDocId, title, content, category, moduleSlug, createDocument, updateDocument]);

  const handleSelect = useCallback((doc: BaseDocument) => {
    setActiveDocId(doc.id);
    setTitle(doc.title);
    setContent(doc.content);
    setIsEditing(true);
  }, []);

  const handleDelete = useCallback(
    async (id: string) => {
      await deleteDocument(id);
      if (activeDocId === id) {
        setActiveDocId(null);
        setIsEditing(false);
      }
      toast.success('Document deleted');
    },
    [activeDocId, deleteDocument]
  );

  const handleExport = useCallback(
    (doc: BaseDocument) => {
      downloadMarkdown(doc);
      toast.success('Exported as Markdown');
    },
    []
  );

  if (!mod || !template) {
    return <div className="text-muted-foreground">Module not found</div>;
  }

  return (
    <div>
      <PageHeader
        title={mod.name}
        description={mod.description}
       
        actions={
          <Button size="sm" onClick={handleNew} className="gap-1.5">
            <Plus className="h-3.5 w-3.5" />
            New
          </Button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-6">
        {/* Document List */}
        <div className="space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
            Saved ({documents.length})
          </h3>
          {documents.length === 0 ? (
            <EmptyState
              title="No documents yet"
              description={`Create your first ${mod.name.toLowerCase()}`}
              actionLabel="Create New"
              onAction={handleNew}
            />
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

        {/* Editor */}
        <AnimatePresence mode="wait">
          {isEditing ? (
            <motion.div
              key="editor"
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] as const }}
              className="space-y-6"
            >
              {/* Editor Header */}
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setIsEditing(false)}
                  className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Back
                </button>
                <div className="flex items-center gap-2">
                  {activeDoc && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleExport(activeDoc)}
                      className="gap-1.5"
                    >
                      <FileDown className="h-3.5 w-3.5" />
                      Export
                    </Button>
                  )}
                  <Button size="sm" onClick={handleSave} className="gap-1.5">
                    <Save className="h-3.5 w-3.5" />
                    Save
                  </Button>
                </div>
              </div>

              {/* Title */}
              <div>
                <Label htmlFor="doc-title" className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  Title
                </Label>
                <Input
                  id="doc-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={`${mod.name} title...`}
                  className="mt-1.5 text-lg font-semibold h-11"
                />
              </div>

              {/* Sections */}
              <div className="space-y-5">
                {template.sections.map((section) => (
                  <div key={section.key}>
                    <Label
                      htmlFor={section.key}
                      className="text-xs font-semibold uppercase tracking-widest text-muted-foreground"
                    >
                      {section.label}
                      {section.required && (
                        <span className="text-destructive ml-0.5">*</span>
                      )}
                    </Label>
                    {section.type === 'text' ? (
                      <Input
                        id={section.key}
                        value={content[section.key] || ''}
                        onChange={(e) =>
                          setContent((prev) => ({ ...prev, [section.key]: e.target.value }))
                        }
                        placeholder={section.placeholder}
                        className="mt-1.5"
                      />
                    ) : (
                      <Textarea
                        id={section.key}
                        value={content[section.key] || ''}
                        onChange={(e) =>
                          setContent((prev) => ({ ...prev, [section.key]: e.target.value }))
                        }
                        placeholder={section.placeholder}
                        rows={5}
                        className="mt-1.5 resize-y min-h-[100px]"
                      />
                    )}
                  </div>
                ))}
              </div>

              {/* Bottom Save */}
              <div className="flex justify-end pt-4 border-t border-border">
                <Button onClick={handleSave} className="gap-1.5">
                  <Save className="h-3.5 w-3.5" />
                  Save Document
                </Button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center justify-center min-h-[400px]"
            >
              <EmptyState
                title="Select or create a document"
                description="Choose an existing document from the list or create a new one to get started."
                actionLabel="Create New"
                onAction={handleNew}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
