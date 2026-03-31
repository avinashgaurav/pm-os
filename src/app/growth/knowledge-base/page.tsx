'use client';
import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, BookOpen, Brain, Library, Lightbulb } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageHeader } from '@/components/shared/page-header';
import { ScrollArea } from '@/components/ui/scroll-area';
import { knowledgeBaseData } from '@/lib/templates/knowledge-base-data';

const catConfig = {
  framework: { label: 'Frameworks', icon: Lightbulb, color: '#6366f1' },
  'mental-model': { label: 'Mental Models', icon: Brain, color: '#a855f7' },
  'book-summary': { label: 'Book Summaries', icon: BookOpen, color: '#22d3ee' },
};

export default function KnowledgeBasePage() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let items = knowledgeBaseData;
    if (category !== 'all') items = items.filter(i => i.category === category);
    if (search) {
      const q = search.toLowerCase();
      items = items.filter(i => i.title.toLowerCase().includes(q) || i.content.toLowerCase().includes(q) || i.tags.some(t => t.includes(q)));
    }
    return items;
  }, [search, category]);

  const selected = knowledgeBaseData.find(i => i.id === selectedId);

  return (
    <div>
      <PageHeader title="PM Knowledge Base" description="Frameworks, mental models, and book summaries for product managers" isNew />
      <div className="flex items-center gap-3 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search frameworks, models, books..." />
        </div>
        <div className="flex items-center gap-1">
          {[{ key: 'all', label: 'All' }, ...Object.entries(catConfig).map(([k, v]) => ({ key: k, label: v.label }))].map(c => (
            <button key={c.key} onClick={() => setCategory(c.key)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${category === c.key ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-accent'}`}>
              {c.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.5fr] gap-6">
        <ScrollArea className="max-h-[calc(100vh-280px)]">
          <div className="space-y-2 pr-2">
            <AnimatePresence>
              {filtered.map((item, i) => {
                const cc = catConfig[item.category];
                return (
                  <motion.button key={item.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}
                    onClick={() => setSelectedId(item.id)}
                    className={`w-full text-left rounded-lg border border-border p-3.5 hover:bg-accent/30 transition-colors ${selectedId === item.id ? 'border-primary/30 bg-primary/5' : ''}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-sm font-medium">{item.title}</h4>
                      <Badge variant="secondary" className="text-[9px] h-4 px-1" style={{ color: cc.color }}>{cc.label.slice(0, -1)}</Badge>
                    </div>
                    <div className="flex gap-1 mt-1.5">{item.tags.slice(0, 3).map(t => <Badge key={t} variant="secondary" className="text-[9px] h-4 px-1">{t}</Badge>)}</div>
                  </motion.button>
                );
              })}
            </AnimatePresence>
            {filtered.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">No results found</p>}
          </div>
        </ScrollArea>

        <div className="rounded-xl border border-border p-6 min-h-[400px]">
          {selected ? (
            <motion.div key={selected.id} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.2 }}>
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-lg font-bold">{selected.title}</h2>
                <Badge variant="secondary" className="text-[10px]">{catConfig[selected.category].label.slice(0, -1)}</Badge>
              </div>
              {selected.source && <p className="text-xs text-muted-foreground mb-4">Source: {selected.source}</p>}
              <div className="prose prose-sm prose-invert max-w-none">
                {selected.content.split('\n').map((line, i) => {
                  if (line.startsWith('**') && line.endsWith('**')) return <h3 key={i} className="text-sm font-semibold mt-4 mb-2">{line.replace(/\*\*/g, '')}</h3>;
                  if (line.startsWith('- **')) {
                    const parts = line.replace(/^- /, '').split('**: ');
                    return <p key={i} className="text-sm text-foreground/80 mb-1"><span className="font-semibold">{parts[0].replace(/\*\*/g, '')}</span>: {parts.slice(1).join(': ')}</p>;
                  }
                  if (line.startsWith('- ')) return <p key={i} className="text-sm text-foreground/80 mb-1 pl-4">• {line.slice(2)}</p>;
                  if (line.trim() === '') return <div key={i} className="h-2" />;
                  return <p key={i} className="text-sm text-foreground/80 mb-2">{line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').split('<strong>').map((part, j) => {
                    if (j === 0) return part;
                    const [bold, rest] = part.split('</strong>');
                    return <span key={j}><strong className="text-foreground">{bold}</strong>{rest}</span>;
                  })}</p>;
                })}
              </div>
              <div className="flex gap-1 mt-6 pt-4 border-t border-border">{selected.tags.map(t => <Badge key={t} variant="secondary" className="text-[10px]">{t}</Badge>)}</div>
            </motion.div>
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
              <div className="text-center"><Library className="h-8 w-8 mx-auto mb-2 opacity-50" /><p>Select an item to read</p><p className="text-xs mt-1">{knowledgeBaseData.length} items available</p></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
