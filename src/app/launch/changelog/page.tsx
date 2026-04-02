'use client';
import { useState, useCallback } from 'react';
import { nanoid } from 'nanoid';
import { useLiveQuery } from 'dexie-react-hooks';
import { toast } from 'sonner';
import { Plus, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { db } from '@/lib/db';
import { AIAnalysisButton } from '@/components/shared/ai-analysis';
import { PageHeader } from '@/components/shared/page-header';
import { EmptyState } from '@/components/shared/empty-state';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
const typeColors:Record<string,string> = {feature:'bg-green-500/10 text-green-400',improvement:'bg-blue-500/10 text-blue-400',bugfix:'bg-yellow-500/10 text-yellow-400',breaking:'bg-red-500/10 text-red-400'};
export default function ChangelogPage() {
  const entries = useLiveQuery(()=>db.changelogEntries.orderBy('date').reverse().toArray()) ?? [];
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({version:'',date:new Date().toISOString().slice(0,10),type:'feature' as 'feature'|'improvement'|'bugfix'|'breaking',title:'',description:''});
  const handleSave = useCallback(async()=>{if(!form.title.trim()){toast.error('Title required');return;} await db.changelogEntries.add({id:nanoid(),...form,createdAt:new Date().toISOString()}); setForm({version:'',date:new Date().toISOString().slice(0,10),type:'feature',title:'',description:''}); setDialogOpen(false); toast.success('Added');},[form]);
  const grouped = entries.reduce<Record<string,typeof entries>>((acc,e)=>{const k=e.version||'Unreleased';(acc[k]=acc[k]||[]).push(e);return acc;},{});
  return (<div>
    <PageHeader title="Product Changelog" description="Generate beautiful product changelogs" actions={<>
      <AIAnalysisButton category="launch" moduleSlug="changelog" buttonLabel="AI: Write Summary" getData={()=>entries.map(e=>`${e.version} [${e.type}] ${e.title}: ${e.description}`).join('\n')} />
      <Button size="sm" onClick={()=>setDialogOpen(true)} className="gap-1.5"><Plus className="h-3.5 w-3.5" />Add Entry</Button>
    </>} />
    {entries.length===0 ? <EmptyState title="No entries" description="Start documenting changes" actionLabel="Add Entry" onAction={()=>setDialogOpen(true)} /> : (
      <div className="space-y-8">{Object.entries(grouped).map(([version,items])=>(
        <div key={version}><div className="flex items-center gap-3 mb-4"><h2 className="text-lg font-bold font-mono text-primary">{version}</h2><div className="h-px flex-1 bg-border" /><span className="text-[11px] text-muted-foreground">{items[0]&&format(new Date(items[0].date),'MMM d, yyyy')}</span></div>
        <div className="space-y-2 ml-4 border-l-2 border-primary/20 pl-4">{items.map(e=>(
          <div key={e.id} className="group flex items-start gap-3"><Badge className={`${typeColors[e.type]} border-0 text-[10px] shrink-0 mt-0.5`}>{e.type}</Badge><div className="flex-1"><p className="text-sm font-medium">{e.title}</p>{e.description&&<p className="text-xs text-muted-foreground mt-0.5">{e.description}</p>}</div><button onClick={async()=>{await db.changelogEntries.delete(e.id);toast.success('Deleted');}} className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-accent"><Trash2 className="h-3.5 w-3.5 text-muted-foreground" /></button></div>
        ))}</div></div>))}</div>
    )}
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}><DialogContent><DialogHeader><DialogTitle>Add Entry</DialogTitle></DialogHeader>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3"><Input value={form.version} onChange={e=>setForm(f=>({...f,version:e.target.value}))} placeholder="v1.2.0" /><Input type="date" value={form.date} onChange={e=>setForm(f=>({...f,date:e.target.value}))} /></div>
        <Select value={form.type} onValueChange={(v:string|null)=>{if(v)setForm(f=>({...f,type:v as typeof form.type}))}}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="feature">Feature</SelectItem><SelectItem value="improvement">Improvement</SelectItem><SelectItem value="bugfix">Bug Fix</SelectItem><SelectItem value="breaking">Breaking</SelectItem></SelectContent></Select>
        <Input value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))} placeholder="Change title" />
        <Textarea rows={2} value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))} placeholder="Description" />
        <Button className="w-full" onClick={handleSave}>Add</Button>
      </div>
    </DialogContent></Dialog>
  </div>);
}
