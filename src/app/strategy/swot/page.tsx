'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, X, Download } from 'lucide-react';
import { toast } from 'sonner';
import { nanoid } from 'nanoid';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface Item { id: string; text: string; }
type Quadrant = 'strengths' | 'weaknesses' | 'opportunities' | 'threats';

const quadrants: { key: Quadrant; label: string; color: string; bg: string; description: string }[] = [
  { key: 'strengths', label: 'Strengths', color: '#10b981', bg: 'rgba(16, 185, 129, 0.05)', description: 'Internal advantages' },
  { key: 'weaknesses', label: 'Weaknesses', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.05)', description: 'Internal disadvantages' },
  { key: 'opportunities', label: 'Opportunities', color: '#6366f1', bg: 'rgba(99, 102, 241, 0.05)', description: 'External possibilities' },
  { key: 'threats', label: 'Threats', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.05)', description: 'External risks' },
];

export default function SWOTPage() {
  const [items, setItems] = useState<Record<Quadrant, Item[]>>({ strengths: [], weaknesses: [], opportunities: [], threats: [] });
  const [inputs, setInputs] = useState<Record<Quadrant, string>>({ strengths: '', weaknesses: '', opportunities: '', threats: '' });

  const addItem = (q: Quadrant) => {
    if (!inputs[q].trim()) return;
    setItems(prev => ({ ...prev, [q]: [...prev[q], { id: nanoid(), text: inputs[q] }] }));
    setInputs(prev => ({ ...prev, [q]: '' }));
  };

  const removeItem = (q: Quadrant, id: string) => {
    setItems(prev => ({ ...prev, [q]: prev[q].filter(i => i.id !== id) }));
  };

  const handleExport = () => {
    let md = '# SWOT Analysis\n\n';
    quadrants.forEach(q => { md += `## ${q.label}\n`; items[q.key].forEach(i => { md += `- ${i.text}\n`; }); md += '\n'; });
    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'swot-analysis.md'; a.click();
    URL.revokeObjectURL(url);
    toast.success('Exported');
  };

  return (
    <div>
      <PageHeader title="SWOT Analysis" description="Analyze strengths, weaknesses, opportunities, and threats"
        actions={<Button variant="outline" size="sm" onClick={handleExport} className="gap-1.5"><Download className="h-3.5 w-3.5" />Export</Button>} />
      <div className="grid grid-cols-2 gap-4">
        {quadrants.map(q => (
          <motion.div key={q.key} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="rounded-xl border border-border p-5 min-h-[280px]" style={{ background: q.bg }}>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: q.color }} />
              <h3 className="text-sm font-semibold" style={{ color: q.color }}>{q.label}</h3>
              <span className="text-[10px] text-muted-foreground">({q.description})</span>
            </div>
            <div className="space-y-1.5 mb-3">
              {items[q.key].map(item => (
                <motion.div key={item.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                  className="group flex items-center gap-2 rounded-md bg-background/60 px-3 py-1.5 text-sm">
                  <span className="flex-1">{item.text}</span>
                  <button onClick={() => removeItem(q.key, item.id)} className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-accent transition-opacity">
                    <X className="h-3 w-3 text-muted-foreground" />
                  </button>
                </motion.div>
              ))}
            </div>
            <div className="flex gap-1.5">
              <Input value={inputs[q.key]} onChange={e => setInputs(prev => ({...prev, [q.key]: e.target.value}))}
                onKeyDown={e => e.key === 'Enter' && addItem(q.key)} placeholder={`Add ${q.label.toLowerCase()}...`} className="h-8 text-xs bg-background/60" />
              <Button size="sm" variant="ghost" onClick={() => addItem(q.key)} className="h-8 w-8 p-0 shrink-0"><Plus className="h-3.5 w-3.5" /></Button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
