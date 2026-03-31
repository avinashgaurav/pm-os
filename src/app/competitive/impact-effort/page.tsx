'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, X, Download } from 'lucide-react';
import { toast } from 'sonner';
import { nanoid } from 'nanoid';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Item { id: string; text: string; quadrant: string; }

const quadrants = [
  { key: 'quick-wins', label: 'Quick Wins', description: 'High Impact, Low Effort', color: '#10b981', bg: 'rgba(16, 185, 129, 0.05)', row: 0, col: 0 },
  { key: 'major-projects', label: 'Major Projects', description: 'High Impact, High Effort', color: '#6366f1', bg: 'rgba(99, 102, 241, 0.05)', row: 0, col: 1 },
  { key: 'fill-ins', label: 'Fill-ins', description: 'Low Impact, Low Effort', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.05)', row: 1, col: 0 },
  { key: 'avoid', label: 'Avoid', description: 'Low Impact, High Effort', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.05)', row: 1, col: 1 },
];

export default function ImpactEffortPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [input, setInput] = useState('');
  const [selectedQuadrant, setSelectedQuadrant] = useState('quick-wins');

  const addItem = () => {
    if (!input.trim()) return;
    setItems(prev => [...prev, { id: nanoid(), text: input, quadrant: selectedQuadrant }]);
    setInput('');
  };

  return (
    <div>
      <PageHeader title="Impact vs Effort Matrix" description="Interactive 2x2 prioritization matrix" isNew />
      <div className="flex items-center gap-2 mb-6">
        <Input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && addItem()} placeholder="Add an item..." className="max-w-xs" />
        <Select value={selectedQuadrant} onValueChange={(v: string | null) => { if (v) setSelectedQuadrant(v); }}><SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>{quadrants.map(q => <SelectItem key={q.key} value={q.key}>{q.label}</SelectItem>)}</SelectContent></Select>
        <Button size="sm" onClick={addItem} className="gap-1.5"><Plus className="h-3.5 w-3.5" />Add</Button>
      </div>
      <div className="relative">
        <div className="absolute -left-6 top-1/2 -translate-y-1/2 -rotate-90 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Impact →</div>
        <div className="absolute bottom-[-24px] left-1/2 -translate-x-1/2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Effort →</div>
        <div className="grid grid-cols-2 gap-3 ml-4">
          {quadrants.map(q => (
            <motion.div key={q.key} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              className="rounded-xl border border-border p-4 min-h-[220px]" style={{ background: q.bg }}>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: q.color }} />
                <h3 className="text-xs font-semibold" style={{ color: q.color }}>{q.label}</h3>
                <span className="text-[9px] text-muted-foreground">{q.description}</span>
              </div>
              <div className="space-y-1.5">
                {items.filter(i => i.quadrant === q.key).map(item => (
                  <motion.div key={item.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="group flex items-center gap-2 rounded-md bg-background/60 px-2.5 py-1.5 text-xs">
                    <span className="flex-1">{item.text}</span>
                    <button onClick={() => setItems(prev => prev.filter(i => i.id !== item.id))} className="opacity-0 group-hover:opacity-100"><X className="h-3 w-3 text-muted-foreground" /></button>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
