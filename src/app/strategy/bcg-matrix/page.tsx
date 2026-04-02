'use client';
import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { nanoid } from 'nanoid';
import { AIAnalysisButton } from '@/components/shared/ai-analysis';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface Item { id: string; text: string; }
type Q = 'stars'|'cashCows'|'questionMarks'|'dogs';
const quads: {key:Q;label:string;emoji:string;color:string;bg:string;desc:string}[] = [
  {key:'stars',label:'Stars',emoji:'⭐',color:'#00C68C',bg:'rgba(0,198,140,0.05)',desc:'High Growth, High Share'},
  {key:'questionMarks',label:'Question Marks',emoji:'❓',color:'#13BBCA',bg:'rgba(19,187,202,0.05)',desc:'High Growth, Low Share'},
  {key:'cashCows',label:'Cash Cows',emoji:'💰',color:'#D0F255',bg:'rgba(208,242,85,0.05)',desc:'Low Growth, High Share'},
  {key:'dogs',label:'Dogs',emoji:'🐕',color:'#ef4444',bg:'rgba(239,68,68,0.05)',desc:'Low Growth, Low Share'},
];

export default function BCGMatrixPage() {
  const [items, setItems] = useState<Record<Q, Item[]>>({stars:[],cashCows:[],questionMarks:[],dogs:[]});
  const [inputs, setInputs] = useState<Record<Q, string>>({stars:'',cashCows:'',questionMarks:'',dogs:''});
  const addItem = (q: Q) => { if (!inputs[q].trim()) return; setItems(p => ({...p,[q]:[...p[q],{id:nanoid(),text:inputs[q]}]})); setInputs(p => ({...p,[q]:''})); };

  return (
    <div>
      <PageHeader title="BCG Matrix" description="Portfolio analysis with growth-share matrix" actions={
        <AIAnalysisButton category="strategy" moduleSlug="bcg-matrix" buttonLabel="AI: Portfolio Strategy" getData={() => { try { return Object.entries(items).map(([k,v]) => k+': '+v.map(i=>i.text).join(', ')).join('\n'); } catch { return ''; } }} />
      } />
      <div className="grid grid-cols-2 gap-3">
        {quads.map(q => (
          <div key={q.key} className="rounded-2xl border border-border p-5 min-h-[240px]" style={{background:q.bg}}>
            <div className="flex items-center gap-2 mb-3"><span>{q.emoji}</span><h3 className="text-sm font-semibold" style={{color:q.color}}>{q.label}</h3><span className="text-[9px] text-muted-foreground">{q.desc}</span></div>
            <div className="space-y-1.5 mb-3">{items[q.key].map(item => (
              <div key={item.id} className="group flex items-center gap-2 rounded-lg bg-background/60 px-3 py-1.5 text-sm"><span className="flex-1">{item.text}</span><button onClick={() => setItems(p => ({...p,[q.key]:p[q.key].filter(i=>i.id!==item.id)}))} className="opacity-0 group-hover:opacity-100"><X className="h-3 w-3 text-muted-foreground" /></button></div>
            ))}</div>
            <div className="flex gap-1.5"><Input value={inputs[q.key]} onChange={e => setInputs(p => ({...p,[q.key]:e.target.value}))} onKeyDown={e => e.key==='Enter' && addItem(q.key)} placeholder={'Add to '+q.label+'...'} className="h-8 text-xs bg-background/60" /><Button size="sm" variant="ghost" onClick={() => addItem(q.key)} className="h-8 w-8 p-0 shrink-0"><Plus className="h-3.5 w-3.5" /></Button></div>
          </div>
        ))}
      </div>
    </div>
  );
}