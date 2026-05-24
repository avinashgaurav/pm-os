'use client';
import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { nanoid } from 'nanoid';
import { AIAnalysisButton } from '@/components/shared/ai-analysis';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
interface Activity { id:string; name:string; stories:string[]; }

interface ActivityColumnProps {
  act: Activity;
  onAddStory: (actId:string, story:string) => void;
  onRemoveStory: (actId:string, idx:number) => void;
  onRemoveActivity: (id:string) => void;
}

function ActivityColumn({ act, onAddStory, onRemoveStory, onRemoveActivity }: ActivityColumnProps) {
  const [storyInput, setStoryInput] = useState('');
  const submit = () => { onAddStory(act.id, storyInput); setStoryInput(''); };
  return (
    <div className="glass-card rounded-2xl p-4 w-[240px] shrink-0">
      <div className="flex items-center justify-between mb-3"><h3 className="text-sm font-semibold text-primary">{act.name}</h3><button onClick={()=>onRemoveActivity(act.id)} className="p-0.5 rounded hover:bg-accent"><X className="h-3 w-3 text-muted-foreground" /></button></div>
      <div className="space-y-1.5 mb-3">{act.stories.map((s,i)=>(
        <div key={i} className="group flex items-center gap-2 rounded-md bg-muted/50 px-2.5 py-1.5 text-xs"><span className="flex-1">{s}</span><button onClick={()=>onRemoveStory(act.id,i)} className="opacity-0 group-hover:opacity-100"><X className="h-3 w-3 text-muted-foreground" /></button></div>
      ))}</div>
      <div className="flex gap-1"><Input value={storyInput} onChange={e=>setStoryInput(e.target.value)} onKeyDown={e=>{if(e.key==='Enter')submit();}} placeholder="Add story..." className="h-7 text-xs" /><Button size="sm" variant="ghost" onClick={submit} className="h-7 w-7 p-0 shrink-0"><Plus className="h-3 w-3" /></Button></div>
    </div>
  );
}

export default function StoryMapPage() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [input, setInput] = useState('');
  const addActivity = () => { if(!input.trim())return; setActivities(p=>[...p,{id:nanoid(),name:input,stories:[]}]); setInput(''); };
  const addStory = (actId:string, story:string) => { if(!story.trim())return; setActivities(p=>p.map(a=>a.id===actId?{...a,stories:[...a.stories,story]}:a)); };
  const removeStory = (actId:string, idx:number) => setActivities(p=>p.map(a=>a.id===actId?{...a,stories:a.stories.filter((_,i)=>i!==idx)}:a));
  const removeActivity = (id:string) => setActivities(p=>p.filter(a=>a.id!==id));
  return (<div>
    <PageHeader title="User Story Map" description="Visual story mapping with activities and stories (Jeff Patton)" actions={
      <AIAnalysisButton category="specs" moduleSlug="story-map" buttonLabel="AI: Find Gaps" getData={()=>activities.map(a=>`${a.name}: ${a.stories.join(', ')}`).join('\n')} />
    } />
    <div className="flex items-center gap-2 mb-6">
      <Input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&addActivity()} placeholder="Add activity (user goal)..." className="max-w-sm" />
      <Button size="sm" onClick={addActivity} className="gap-1.5"><Plus className="h-3.5 w-3.5" />Add Activity</Button>
    </div>
    {activities.length===0 ? <div className="glass-card rounded-2xl p-12 text-center text-sm text-muted-foreground">Add activities to start mapping user stories</div> : (
      <ScrollArea className="w-full"><div className="flex gap-4 min-w-max pb-4">
        {activities.map(act => (
          <ActivityColumn key={act.id} act={act} onAddStory={addStory} onRemoveStory={removeStory} onRemoveActivity={removeActivity} />
        ))}
      </div></ScrollArea>
    )}
  </div>);
}
