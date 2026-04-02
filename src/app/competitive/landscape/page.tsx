'use client';
import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { nanoid } from 'nanoid';
import { AIAnalysisButton } from '@/components/shared/ai-analysis';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
interface Item { id:string; text:string; quadrant:string; }
const quadrants = [{key:'leaders',label:'Leaders',desc:'Strong Position, Broad Features',color:'#00C68C',bg:'rgba(0,198,140,0.05)'},{key:'challengers',label:'Challengers',desc:'Strong Position, Narrow',color:'#13BBCA',bg:'rgba(19,187,202,0.05)'},{key:'visionaries',label:'Visionaries',desc:'Weak Position, Broad',color:'#D0F255',bg:'rgba(208,242,85,0.05)'},{key:'niche',label:'Niche Players',desc:'Weak Position, Narrow',color:'#a855f7',bg:'rgba(168,85,247,0.05)'}];
export default function LandscapePage() {
  const [items, setItems] = useState<Item[]>([]);
  const [input, setInput] = useState('');
  const [sel, setSel] = useState('leaders');
  const addItem = () => { if(!input.trim())return; setItems(p=>[...p,{id:nanoid(),text:input,quadrant:sel}]); setInput(''); };
  return (<div>
    <PageHeader title="Competitive Landscape" description="Map competitors by market position and feature breadth" actions={
      <AIAnalysisButton category="competitive" moduleSlug="landscape" buttonLabel="AI: Analyze Position" getData={()=>items.map(i=>`[${i.quadrant}] ${i.text}`).join('\n')} />
    } />
    <div className="flex items-center gap-2 mb-6">
      <Input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&addItem()} placeholder="Add competitor..." className="max-w-xs" />
      <Select value={sel} onValueChange={(v:string|null)=>{if(v)setSel(v)}}><SelectTrigger className="w-36"><SelectValue /></SelectTrigger><SelectContent>{quadrants.map(q=><SelectItem key={q.key} value={q.key}>{q.label}</SelectItem>)}</SelectContent></Select>
      <Button size="sm" onClick={addItem} className="gap-1.5"><Plus className="h-3.5 w-3.5" />Add</Button>
    </div>
    <div className="grid grid-cols-2 gap-3">{quadrants.map(q=>(
      <div key={q.key} className="rounded-2xl border border-border p-4 min-h-[200px]" style={{background:q.bg}}>
        <div className="flex items-center gap-2 mb-3"><div className="w-2.5 h-2.5 rounded-full" style={{backgroundColor:q.color}} /><h3 className="text-xs font-semibold" style={{color:q.color}}>{q.label}</h3><span className="text-[9px] text-muted-foreground">{q.desc}</span></div>
        <div className="space-y-1.5">{items.filter(i=>i.quadrant===q.key).map(item=>(
          <div key={item.id} className="group flex items-center gap-2 rounded-lg bg-background/60 px-2.5 py-1.5 text-xs"><span className="flex-1">{item.text}</span><button onClick={()=>setItems(p=>p.filter(i=>i.id!==item.id))} className="opacity-0 group-hover:opacity-100"><X className="h-3 w-3 text-muted-foreground" /></button></div>
        ))}</div>
      </div>))}</div>
  </div>);
}
