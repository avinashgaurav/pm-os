'use client';

import { useState, useEffect } from 'react';
import { Download, Upload, Trash2, Database, Sun, Moon, Palette, Sparkles, Check, AlertCircle, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/shared/page-header';
import { db } from '@/lib/db';
import { downloadJSON } from '@/lib/export';
import { categories } from '@/lib/constants';
import {
  listProviders,
  getAIPreference,
  setAIPreference,
  type ProviderSummary,
  type AIPreference,
} from '@/lib/ai';

export default function SettingsPage() {
  const [importing, setImporting] = useState(false);
  const [isDark, setIsDark] = useState(true);
  const [providers, setProviders] = useState<ProviderSummary[]>([]);
  const [pref, setPref] = useState<AIPreference | null>(null);
  const [loadingProviders, setLoadingProviders] = useState(true);
  const totalModules = categories.reduce((s, c) => s + c.modules.length, 0);

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains('dark'));
    setPref(getAIPreference());
    listProviders()
      .then(setProviders)
      .catch(() => toast.error('Could not load AI providers'))
      .finally(() => setLoadingProviders(false));
  }, []);

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle('dark', next);
    localStorage.setItem('pm-os-theme', next ? 'dark' : 'light');
  };

  const selectProvider = (providerId: string) => {
    const p = providers.find(x => x.id === providerId);
    if (!p) return;
    const next = { provider: p.id, model: p.defaultModel };
    setAIPreference(next);
    setPref(next);
    toast.success(`Using ${p.label} (${p.defaultModel})`);
  };

  const selectModel = (model: string) => {
    if (!pref) return;
    const next = { ...pref, model };
    setAIPreference(next);
    setPref(next);
    toast.success(`Model: ${model}`);
  };

  const activeProvider = providers.find(p => p.id === pref?.provider);

  const handleExportAll = async () => {
    try {
      const data = {
        documents: await db.documents.toArray(),
        decisions: await db.decisions.toArray(),
        assumptions: await db.assumptions.toArray(),
        risks: await db.risks.toArray(),
        okrs: await db.okrs.toArray(),
        releases: await db.releases.toArray(),
        stakeholders: await db.stakeholders.toArray(),
        changelogEntries: await db.changelogEntries.toArray(),
        competencyScores: await db.competencyScores.toArray(),
        hypotheses: await db.hypotheses.toArray(),
        exportedAt: new Date().toISOString(),
      };
      downloadJSON(data, 'pm-os-backup-' + new Date().toISOString().slice(0, 10));
      toast.success('All data exported');
    } catch { toast.error('Export failed'); }
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file'; input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      setImporting(true);
      try {
        const data = JSON.parse(await file.text());
        if (data.documents) await db.documents.bulkPut(data.documents);
        if (data.decisions) await db.decisions.bulkPut(data.decisions);
        toast.success('Data imported');
      } catch { toast.error('Import failed'); }
      setImporting(false);
    };
    input.click();
  };

  const handleReset = async () => {
    if (!confirm('Delete ALL data? This cannot be undone.')) return;
    await db.delete();
    window.location.reload();
  };

  return (
    <div className="max-w-2xl mx-auto">
      <PageHeader title="Settings" description="Appearance, AI provider, and data management" />
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2"><Palette className="h-4 w-4" /> Appearance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Theme</p>
                <p className="text-xs text-muted-foreground">Dark or light mode</p>
              </div>
              <Button variant="outline" size="sm" onClick={toggleTheme} className="gap-2">
                {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                {isDark ? 'Light Mode' : 'Dark Mode'}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2"><Sparkles className="h-4 w-4" /> AI Provider</CardTitle>
            <CardDescription>
              Pick the model that powers generation across all {totalModules} modules. API keys are configured server-side via environment variables.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {loadingProviders ? (
              <p className="text-sm text-muted-foreground">Loading providers...</p>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {providers.map(p => {
                    const isActive = pref?.provider === p.id;
                    return (
                      <button
                        key={p.id}
                        onClick={() => p.configured && selectProvider(p.id)}
                        disabled={!p.configured}
                        className={`text-left rounded-lg border px-3 py-2.5 transition-colors ${
                          isActive ? 'border-primary bg-primary/5' : 'border-border'
                        } ${p.configured ? 'hover:bg-accent cursor-pointer' : 'opacity-50 cursor-not-allowed'}`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-medium">{p.label}</span>
                          {isActive ? (
                            <Check className="h-3.5 w-3.5 text-primary" />
                          ) : p.configured ? (
                            <span className="text-[10px] text-green-600 dark:text-green-400">Available</span>
                          ) : (
                            <AlertCircle className="h-3.5 w-3.5 text-muted-foreground" />
                          )}
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          {p.configured ? `${p.models.length} models` : `Set ${p.envVar} to enable`}
                        </p>
                      </button>
                    );
                  })}
                </div>

                {activeProvider && pref && (
                  <div className="rounded-lg border border-border p-3 space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                      {activeProvider.label} model
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {activeProvider.models.map(m => (
                        <button
                          key={m}
                          onClick={() => selectModel(m)}
                          className={`text-xs px-2.5 py-1 rounded-md border transition-colors ${
                            pref.model === m
                              ? 'border-primary bg-primary/10 text-foreground'
                              : 'border-border hover:bg-accent text-muted-foreground'
                          }`}
                        >
                          {m}
                        </button>
                      ))}
                    </div>
                    <a
                      href={activeProvider.docs}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-muted-foreground hover:text-foreground inline-flex items-center gap-1 mt-1"
                    >
                      Get an API key <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                )}

                {!providers.some(p => p.configured) && (
                  <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3">
                    <p className="text-xs font-medium text-amber-700 dark:text-amber-400">No providers configured</p>
                    <p className="text-[11px] text-muted-foreground mt-1">
                      Set at least one of <code className="font-mono">GROQ_API_KEY</code>, <code className="font-mono">OPENAI_API_KEY</code>, <code className="font-mono">ANTHROPIC_API_KEY</code>, <code className="font-mono">GOOGLE_API_KEY</code>, or <code className="font-mono">OLLAMA_URL</code> in your server environment. See <code className="font-mono">.env.example</code>.
                    </p>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2"><Database className="h-4 w-4" /> Data Management</CardTitle>
            <CardDescription>Export, import, or reset your data. All data is stored locally in your browser.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="outline" className="w-full justify-start gap-2" onClick={handleExportAll}><Download className="h-4 w-4" /> Export All Data (JSON)</Button>
            <Button variant="outline" className="w-full justify-start gap-2" onClick={handleImport} disabled={importing}><Upload className="h-4 w-4" /> {importing ? 'Importing...' : 'Import Data (JSON)'}</Button>
            <Button variant="destructive" className="w-full justify-start gap-2" onClick={handleReset}><Trash2 className="h-4 w-4" /> Reset All Data</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">About PM OS</CardTitle></CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-1.5">
            <p className="font-medium text-foreground">Product Management Operating System</p>
            <p>{totalModules} AI-powered tools across {categories.length} disciplines</p>
            <p>Pluggable LLM providers: Groq, OpenAI, Anthropic, Gemini, Ollama</p>
            <p>All data stored locally in your browser (IndexedDB)</p>
            <p>API keys live server-side only — never in the browser bundle</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
