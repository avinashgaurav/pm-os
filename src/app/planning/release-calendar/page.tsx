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
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
const statusColors:Record<string,string> = {planned:'bg-zinc-500/10 text-zinc-400','in-progress':'bg-blue-500/10 text-blue-400',released:'bg-green-500/10 text-green-400'};
export default function ReleaseCalendarPage() {
  const releases = useLiveQuery(()=>db.releases.orderBy('date').reverse().toArray()) ?? [];
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({version:'',name:'',date:new Date().toISOString().slice(0,10),status:'planned' as 'planned'|'in-progress'|'released'});
  const handleSave = useCallback(async()=>{if(!form.version.trim()){toast.error('Version required');return;} await db.releases.add({id:nanoid(),...form,features:[],notes:'',createdAt:new Date().toISOString()}); setForm({version:'',name:'',date:new Date().toISOString().slice(0,10),status:'planned'}); setDialogOpen(false); toast.success('Added');},[form]);
  return (<div>
    <PageHeader title="Release Calendar" description="Manage release timelines and milestones" actions={<>
      <AIAnalysisButton category="planning" moduleSlug="release-calendar" buttonLabel="AI: Review Timeline" getData={()=>releases.map(r=>`${r.version} ${r.name} - ${r.date} (${r.status})`).join('\n')} />
      <Button size="sm" onClick={()=>setDialogOpen(true)} className="gap-1.5"><Plus className="h-3.5 w-3.5" />Add Release</Button>
    </>} />
    {releases.length===0 ? <EmptyState title="No releases" description="Plan your releases" actionLabel="Add Release" onAction={()=>setDialogOpen(true)} /> : (
      <div className="space-y-3">{releases.map((r,i)=>(
        <div key={r.id} className="group flex items-center gap-4 glass-card rounded-xl px-5 py-4">
          <div className="w-16 text-center"><p className="text-lg font-bold font-mono text-primary">{r.version}</p></div>
          <div className="h-8 w-px bg-border" />
          <div className="flex-1"><p className="text-sm font-medium">{r.name||r.version}</p><p className="text-[11px] text-muted-foreground">{format(new Date(r.date),'MMM d, yyyy')}</p></div>
          <Badge className={`${statusColors[r.status]||''} border-0 text-[10px]`}>{r.status}</Badge>
          <button onClick={async()=>{await db.releases.delete(r.id);toast.success('Deleted');}} className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-accent"><Trash2 className="h-3.5 w-3.5 text-muted-foreground" /></button>
        </div>))}</div>
    )}
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}><DialogContent><DialogHeader><DialogTitle>Add Release</DialogTitle></DialogHeader>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3"><Input value={form.version} onChange={e=>setForm(f=>({...f,version:e.target.value}))} placeholder="v1.2.0" /><Input value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} placeholder="Release name" /></div>
        <Input type="date" value={form.date} onChange={e=>setForm(f=>({...f,date:e.target.value}))} />
        <Select value={form.status} onValueChange={(v:string|null)=>{if(v)setForm(f=>({...f,status:v as typeof form.status}))}}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="planned">Planned</SelectItem><SelectItem value="in-progress">In Progress</SelectItem><SelectItem value="released">Released</SelectItem></SelectContent></Select>
        <Button className="w-full" onClick={handleSave}>Add Release</Button>
      </div>
    </DialogContent></Dialog>
  </div>);
}
