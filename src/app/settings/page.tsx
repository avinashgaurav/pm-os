'use client';

import { useState, useEffect } from 'react';
import { Download, Upload, Trash2, Database, Sun, Moon, Palette, Key, Check, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/shared/page-header';
import { db } from '@/lib/db';
import { downloadJSON } from '@/lib/export';
import { categories } from '@/lib/constants';
import { getApiKey, setApiKey } from '@/lib/ai';

const ADMIN_PIN = '2026';

export default function SettingsPage() {
  const [importing, setImporting] = useState(false);
  const [isDark, setIsDark] = useState(true);
  const [apiKey, setApiKeyState] = useState('');
  const [keySaved, setKeySaved] = useState(false);
  const [showKeySection, setShowKeySection] = useState(false);
  const [pin, setPin] = useState('');
  const totalModules = categories.reduce((s, c) => s + c.modules.length, 0);

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains('dark'));
    setApiKeyState(getApiKey());
    setKeySaved(true);
  }, []);

  const toggleTheme = () => {
    const next = !isDark; setIsDark(next);
    document.documentElement.classList.toggle('dark', next);
    localStorage.setItem('pm-os-theme', next ? 'dark' : 'light');
  };

  const handleUnlock = () => {
    if (pin === ADMIN_PIN) {
      setShowKeySection(true);
      toast.success('Admin access granted');
    } else {
      toast.error('Incorrect PIN');
    }
    setPin('');
  };

  const handleSaveKey = () => {
    if (apiKey.trim()) {
      setApiKey(apiKey.trim());
      setKeySaved(true);
      toast.success('API key updated');
    }
  };

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
    await db.delete(); window.location.reload();
  };

  return (
    <div className="max-w-2xl mx-auto">
      <PageHeader title="Settings" description="Appearance, data management, and configuration" />
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2"><Palette className="h-4 w-4" /> Appearance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div><p className="text-sm font-medium">Theme</p><p className="text-xs text-muted-foreground">Dark or light mode</p></div>
              <Button variant="outline" size="sm" onClick={toggleTheme} className="gap-2">
                {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                {isDark ? 'Light Mode' : 'Dark Mode'}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2"><Key className="h-4 w-4" /> AI Configuration</CardTitle>
            <CardDescription>AI generation is active across all {totalModules} tools. Admin PIN required to change the API key.</CardDescription>
          </CardHeader>
          <CardContent>
            {showKeySection ? (
              <div className="space-y-3">
                <div className="flex gap-2">
                  <Input value={apiKey} onChange={e => { setApiKeyState(e.target.value); setKeySaved(false); }}
                    placeholder="gsk_..." type="password" className="font-mono text-sm" />
                  <Button onClick={handleSaveKey} disabled={!apiKey.trim() || keySaved} className="gap-1.5 shrink-0">
                    {keySaved ? <Check className="h-4 w-4" /> : <Key className="h-4 w-4" />}
                    {keySaved ? 'Saved' : 'Update Key'}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">Current key: {apiKey.slice(0, 8)}...{apiKey.slice(-4)}</p>
              </div>
            ) : (
              <div className="flex gap-2 items-center">
                <Input value={pin} onChange={e => setPin(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleUnlock()}
                  placeholder="Enter admin PIN" type="password" className="max-w-[200px]" />
                <Button variant="outline" size="sm" onClick={handleUnlock} className="gap-1.5">
                  <Lock className="h-3.5 w-3.5" /> Unlock
                </Button>
              </div>
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
            <p>AI generation powered by Groq (Llama 3.3 70B)</p>
            <p>All data stored locally in your browser (IndexedDB)</p>
            <p>No data is sent to any server except for AI generation requests</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
