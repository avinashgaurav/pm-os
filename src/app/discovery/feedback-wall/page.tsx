'use client';
import { useState, useCallback } from 'react';
import { nanoid } from 'nanoid';
import { useLiveQuery } from 'dexie-react-hooks';
import { toast } from 'sonner';
import { Plus, Trash2, ThumbsUp, MoreHorizontal } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '@/lib/db';
import { AIAnalysisButton } from '@/components/shared/ai-analysis';
import { PageHeader } from '@/components/shared/page-header';
import { EmptyState } from '@/components/shared/empty-state';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { FeedbackItem } from '@/types';

const sentimentColors = { positive: 'bg-green-500/10 text-green-400', neutral: 'bg-zinc-500/10 text-zinc-400', negative: 'bg-red-500/10 text-red-400' };
const sourceLabels = { interview: 'Interview', survey: 'Survey', support: 'Support', review: 'Review', social: 'Social', other: 'Other' };

export default function FeedbackWallPage() {
  const items = useLiveQuery(() => db.feedbackItems.orderBy('createdAt').reverse().toArray()) ?? [];
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ content: '', source: 'other' as FeedbackItem['source'], sentiment: 'neutral' as FeedbackItem['sentiment'], category: '', customerName: '' });
  const [filter, setFilter] = useState('all');

  const handleSave = useCallback(async () => {
    if (!form.content.trim()) { toast.error('Content required'); return; }
    await db.feedbackItems.add({ id: nanoid(), ...form, tags: [], votes: 0, createdAt: new Date().toISOString() });
    setForm({ content: '', source: 'other', sentiment: 'neutral', category: '', customerName: '' });
    setDialogOpen(false); toast.success('Feedback added');
  }, [form]);

  const handleVote = useCallback(async (id: string) => {
    const item = await db.feedbackItems.get(id);
    if (item) await db.feedbackItems.update(id, { votes: item.votes + 1 });
  }, []);

  const filtered = filter === 'all' ? items : items.filter(i => i.sentiment === filter);

  return (
    <div>
      <PageHeader title="Feedback Wall" description="Visual wall of customer feedback with sentiment tags"
        actions={<Button size="sm" onClick={() => setDialogOpen(true)} className="gap-1.5"><Plus className="h-3.5 w-3.5" />Add Feedback</Button>} />
      <div className="flex items-center gap-2 mb-6">
        {['all', 'positive', 'neutral', 'negative'].map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${filter === s ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-accent'}`}>
            {s === 'all' ? `All (${items.length})` : `${s.charAt(0).toUpperCase() + s.slice(1)} (${items.filter(i => i.sentiment === s).length})`}
          </button>
        ))}
      </div>
      {filtered.length === 0 ? <EmptyState title="No feedback yet" description="Start collecting customer feedback" actionLabel="Add Feedback" onAction={() => setDialogOpen(true)} /> : (
        <div className="columns-1 sm:columns-2 lg:columns-3 gap-4">
          <AnimatePresence>
            {filtered.map(item => (
              <motion.div key={item.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="break-inside-avoid mb-4 group rounded-xl border border-border p-4 hover:bg-accent/10 transition-colors">
                <p className="text-sm leading-relaxed mb-3">&ldquo;{item.content}&rdquo;</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Badge className={`${sentimentColors[item.sentiment]} border-0 text-[10px]`}>{item.sentiment}</Badge>
                    <Badge variant="secondary" className="text-[10px]">{sourceLabels[item.source]}</Badge>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => handleVote(item.id)} className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] text-muted-foreground hover:bg-accent transition-colors"><ThumbsUp className="h-3 w-3" />{item.votes}</button>
                    <DropdownMenu>
                      <DropdownMenuTrigger className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-accent"><MoreHorizontal className="h-3.5 w-3.5 text-muted-foreground" /></DropdownMenuTrigger>
                      <DropdownMenuContent align="end"><DropdownMenuItem onClick={async () => { await db.feedbackItems.delete(item.id); toast.success('Deleted'); }} className="text-destructive"><Trash2 className="h-3.5 w-3.5 mr-2" />Delete</DropdownMenuItem></DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
                {item.customerName && <p className="text-[10px] text-muted-foreground/60 mt-2">— {item.customerName}</p>}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Add Feedback</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Feedback *</Label><Textarea className="mt-1" rows={3} value={form.content} onChange={e => setForm(f => ({...f, content: e.target.value}))} placeholder="What did the customer say?" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Sentiment</Label>
                <Select value={form.sentiment} onValueChange={(v: string | null) => setForm(f => ({...f, sentiment: v as FeedbackItem['sentiment']}))}><SelectTrigger className="mt-1"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="positive">Positive</SelectItem><SelectItem value="neutral">Neutral</SelectItem><SelectItem value="negative">Negative</SelectItem></SelectContent></Select></div>
              <div><Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Source</Label>
                <Select value={form.source} onValueChange={(v: string | null) => setForm(f => ({...f, source: v as FeedbackItem['source']}))}><SelectTrigger className="mt-1"><SelectValue /></SelectTrigger><SelectContent>{Object.entries(sourceLabels).map(([k,v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent></Select></div>
            </div>
            <div><Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Customer Name</Label><Input className="mt-1" value={form.customerName} onChange={e => setForm(f => ({...f, customerName: e.target.value}))} placeholder="Optional" /></div>
            <Button className="w-full" onClick={handleSave}>Add Feedback</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* AI Analysis */}
      <div className="mt-6">
        <AIAnalysisButton category="discovery" moduleSlug="feedback-wall" buttonLabel="AI: Find Patterns"
          getData={() => {
            try { return items.map(i => `[${i.sentiment}] ${i.content}`).join('\n'); } catch { return ''; }
          }} />
      </div>
    </div>
  );
}
