'use client';

import { useState, useEffect } from 'react';
import { Download, Upload, Trash2, Database, Sun, Moon, Palette } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/shared/page-header';
import { db } from '@/lib/db';
import { downloadJSON } from '@/lib/export';
import { categories } from '@/lib/constants';

export default function SettingsPage() {
  const [importing, setImporting] = useState(false);
  const [isDark, setIsDark] = useState(true);
  const totalModules = categories.reduce((s, c) => s + c.modules.length, 0);

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains('dark'));
  }, []);

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    if (next) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('pm-os-theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('pm-os-theme', 'light');
    }
  };

  const handleExportAll = async () => {
    try {
      const data = {
        documents: await db.documents.toArray(),
        assumptions: await db.assumptions.toArray(),
        feedbackItems: await db.feedbackItems.toArray(),
        decisions: await db.decisions.toArray(),
        featureScores: await db.featureScores.toArray(),
        risks: await db.risks.toArray(),
        okrs: await db.okrs.toArray(),
        releases: await db.releases.toArray(),
        competitors: await db.competitors.toArray(),
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

  const handleImport = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      setImporting(true);
      try {
        const text = await file.text();
        const data = JSON.parse(text);
        if (data.documents) await db.documents.bulkPut(data.documents);
        if (data.decisions) await db.decisions.bulkPut(data.decisions);
        if (data.assumptions) await db.assumptions.bulkPut(data.assumptions);
        if (data.feedbackItems) await db.feedbackItems.bulkPut(data.feedbackItems);
        if (data.featureScores) await db.featureScores.bulkPut(data.featureScores);
        if (data.risks) await db.risks.bulkPut(data.risks);
        if (data.okrs) await db.okrs.bulkPut(data.okrs);
        if (data.releases) await db.releases.bulkPut(data.releases);
        if (data.competitors) await db.competitors.bulkPut(data.competitors);
        if (data.stakeholders) await db.stakeholders.bulkPut(data.stakeholders);
        if (data.changelogEntries) await db.changelogEntries.bulkPut(data.changelogEntries);
        if (data.competencyScores) await db.competencyScores.bulkPut(data.competencyScores);
        if (data.hypotheses) await db.hypotheses.bulkPut(data.hypotheses);
        toast.success('Data imported');
      } catch { toast.error('Import failed — check file format'); }
      setImporting(false);
    };
    input.click();
  };

  const handleReset = async () => {
    if (!confirm('Delete ALL your data? This cannot be undone.')) return;
    await db.delete();
    window.location.reload();
  };

  return (
    <div className="max-w-2xl mx-auto">
      <PageHeader title="Settings" description="Appearance, data management, and about" />

      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2"><Palette className="h-4 w-4" /> Appearance</CardTitle>
            <CardDescription>Customize the look of PM OS</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Theme</p>
                <p className="text-xs text-muted-foreground">Switch between dark and light mode</p>
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
            <CardTitle className="text-base flex items-center gap-2"><Database className="h-4 w-4" /> Data Management</CardTitle>
            <CardDescription>Export, import, or reset your data</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="outline" className="w-full justify-start gap-2" onClick={handleExportAll}>
              <Download className="h-4 w-4" /> Export All Data (JSON)
            </Button>
            <Button variant="outline" className="w-full justify-start gap-2" onClick={handleImport} disabled={importing}>
              <Upload className="h-4 w-4" /> {importing ? 'Importing...' : 'Import Data (JSON)'}
            </Button>
            <Button variant="destructive" className="w-full justify-start gap-2" onClick={handleReset}>
              <Trash2 className="h-4 w-4" /> Reset All Data
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">About PM OS</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-1">
            <p>PM OS — The Product Management Operating System</p>
            <p>{totalModules} tools across {categories.length} disciplines</p>
            <p>All data stored locally in your browser (IndexedDB)</p>
            <p>No data is sent to any server</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
