'use client';

import { useState } from 'react';
import { Sparkles, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { generateWithAI, buildAnalysisPrompt, getApiKey } from '@/lib/ai';

interface AIAnalysisProps {
  category: string;
  moduleSlug: string;
  getData: () => string; // function that returns current module data as text
  buttonLabel?: string;
}

export function AIAnalysisButton({ category, moduleSlug, getData, buttonLabel = 'AI Analyze' }: AIAnalysisProps) {
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState('');
  const [show, setShow] = useState(false);

  const handleAnalyze = async () => {
    const apiKey = getApiKey();
    if (!apiKey) {
      toast.error('Add your Groq API key in Settings first');
      return;
    }
    const data = getData();
    if (!data || data.trim().length < 10) {
      toast.error('Add some data first before analyzing');
      return;
    }
    setLoading(true);
    setShow(true);
    try {
      const { system, user } = buildAnalysisPrompt(category, moduleSlug, data);
      const result = await generateWithAI(apiKey, system, user);
      setResponse(result);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Analysis failed');
    }
    setLoading(false);
  };

  return (
    <>
      <Button variant="outline" size="sm" onClick={handleAnalyze} disabled={loading} className="gap-1.5">
        {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
        {loading ? 'Analyzing...' : buttonLabel}
      </Button>

      {show && (
        <div className="glass-card rounded-2xl p-6 mt-6">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-border">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-xs font-semibold uppercase tracking-widest text-primary">AI Analysis</span>
            </div>
            <button onClick={() => setShow(false)} className="p-1 rounded hover:bg-accent">
              <X className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
          </div>
          {loading ? (
            <div className="flex items-center gap-3 py-8 justify-center text-sm text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin text-primary" /> Analyzing with AI...
            </div>
          ) : (
            <div className="space-y-1">
              {response.split('\n').map((line, i) => {
                if (line.startsWith('# ')) return <h1 key={i} className="text-lg font-bold mb-2">{line.slice(2)}</h1>;
                if (line.startsWith('## ')) return <h2 key={i} className="text-sm font-semibold text-primary mt-4 mb-1">{line.slice(3)}</h2>;
                if (line.startsWith('### ')) return <h3 key={i} className="text-sm font-semibold mt-3 mb-1">{line.slice(4)}</h3>;
                if (line.startsWith('- **')) {
                  const m = line.match(/^- \*\*(.+?)\*\*:?\s*(.*)/);
                  if (m) return <p key={i} className="text-sm mb-1 pl-3"><span className="font-semibold">{m[1]}</span>{m[2] ? `: ${m[2]}` : ''}</p>;
                }
                if (line.startsWith('- ') || line.startsWith('* ')) return <p key={i} className="text-sm pl-3 mb-1">• {line.slice(2)}</p>;
                if (line.match(/^\d+\./)) return <p key={i} className="text-sm pl-3 mb-1">{line}</p>;
                if (line.trim() === '') return <div key={i} className="h-1.5" />;
                return <p key={i} className="text-sm text-foreground/90 mb-1 leading-relaxed">{line}</p>;
              })}
            </div>
          )}
        </div>
      )}
    </>
  );
}
