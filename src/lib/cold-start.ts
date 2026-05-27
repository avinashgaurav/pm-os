// Cold-start wizard logic — preference shape, defaults, and the
// (role × focus × maturity) → recommended modules engine.
//
// The recommendation function is deterministic: given identical answers it
// returns the same module list, so users who run the wizard, dismiss, and
// reopen get a stable experience.

import { z } from 'zod';

export const RoleSchema = z.enum(['ic-pm', 'senior-pm', 'director', 'founder', 'other']);
export const FocusSchema = z.enum(['discovery', 'strategy', 'planning', 'launching', 'operating']);
export const MaturitySchema = z.enum(['nothing', 'some-docs', 'full-backlog']);

export type Role = z.infer<typeof RoleSchema>;
export type Focus = z.infer<typeof FocusSchema>;
export type Maturity = z.infer<typeof MaturitySchema>;

export const ColdStartPreferenceSchema = z.object({
  role: RoleSchema,
  focus: FocusSchema,
  maturity: MaturitySchema,
  completedAt: z.string(),
  // Wizard version — bump if the question set changes; existing answers stay
  // valid but the wizard can re-prompt on a major shift.
  version: z.literal(1),
});

export type ColdStartPreference = z.infer<typeof ColdStartPreferenceSchema>;

export const COLD_START_KEY = 'cold_start_v1';

// Each recommended module is a category/slug pair plus a short "why" the
// engine picked it — surfaced as a tooltip on the home page.
export interface ModuleRecommendation {
  category: string;
  moduleSlug: string;
  reason: string;
}

// Module sets per focus area. Order is intentional — the first entries are
// what an IC just starting that workstream would reach for, the later ones
// are deeper / more strategic. The engine layers role + maturity on top.
const FOCUS_MODULES: Record<Focus, { category: string; moduleSlug: string }[]> = {
  discovery: [
    { category: 'discovery', moduleSlug: 'interviews' },
    { category: 'discovery', moduleSlug: 'personas' },
    { category: 'discovery', moduleSlug: 'jtbd' },
    { category: 'discovery', moduleSlug: 'synthesis' },
    { category: 'discovery', moduleSlug: 'journey-map' },
    { category: 'discovery', moduleSlug: 'assumptions' },
  ],
  strategy: [
    { category: 'strategy', moduleSlug: 'positioning' },
    { category: 'strategy', moduleSlug: 'okrs' },
    { category: 'strategy', moduleSlug: 'north-star' },
    { category: 'strategy', moduleSlug: 'risk-register' },
    { category: 'strategy', moduleSlug: 'decisions' },
    { category: 'strategy', moduleSlug: 'gtm' },
  ],
  planning: [
    { category: 'planning', moduleSlug: 'roadmap' },
    { category: 'planning', moduleSlug: 'sprints' },
    { category: 'planning', moduleSlug: 'backlog' },
    { category: 'planning', moduleSlug: 'quarterly' },
    { category: 'planning', moduleSlug: 'dependencies' },
    { category: 'planning', moduleSlug: 'release-calendar' },
  ],
  launching: [
    { category: 'launch', moduleSlug: 'readiness' },
    { category: 'launch', moduleSlug: 'checklist' },
    { category: 'launch', moduleSlug: 'announcement' },
    { category: 'communication', moduleSlug: 'release-notes' },
    { category: 'launch', moduleSlug: 'sales-enablement' },
    { category: 'launch', moduleSlug: 'changelog' },
  ],
  operating: [
    { category: 'operations', moduleSlug: 'retro' },
    { category: 'operations', moduleSlug: 'team-health' },
    { category: 'operations', moduleSlug: 'meeting-templates' },
    { category: 'analytics', moduleSlug: 'metrics' },
    { category: 'analytics', moduleSlug: 'okr-tracker' },
    { category: 'communication', moduleSlug: 'exec-update' },
  ],
};

// Add-ons per role. These get layered into the focus recommendations so a
// Director focused on launching still sees strategy/decision modules they're
// likely to need, even if launching isn't strategy.
const ROLE_ADDONS: Record<Role, { category: string; moduleSlug: string }[]> = {
  'ic-pm': [
    { category: 'specs', moduleSlug: 'prd' },
    { category: 'specs', moduleSlug: 'user-stories' },
  ],
  'senior-pm': [
    { category: 'specs', moduleSlug: 'prd' },
    { category: 'strategy', moduleSlug: 'roadmap-review' },
    { category: 'analytics', moduleSlug: 'experiments' },
  ],
  director: [
    { category: 'strategy', moduleSlug: 'okrs' },
    { category: 'analytics', moduleSlug: 'okr-tracker' },
    { category: 'communication', moduleSlug: 'exec-update' },
    { category: 'communication', moduleSlug: 'board-deck' },
  ],
  founder: [
    { category: 'strategy', moduleSlug: 'positioning' },
    { category: 'strategy', moduleSlug: 'north-star' },
    { category: 'competitive', moduleSlug: 'landscape' },
    { category: 'launch', moduleSlug: 'announcement' },
  ],
  other: [{ category: 'specs', moduleSlug: 'prd' }],
};

// Maturity gates whether to lead with discovery (nothing yet) or with
// shipped-product modules (full backlog).
const MATURITY_ADDONS: Record<Maturity, { category: string; moduleSlug: string }[]> = {
  nothing: [
    { category: 'discovery', moduleSlug: 'interviews' },
    { category: 'specs', moduleSlug: 'one-pager' },
  ],
  'some-docs': [{ category: 'specs', moduleSlug: 'prd' }],
  'full-backlog': [
    { category: 'planning', moduleSlug: 'backlog' },
    { category: 'analytics', moduleSlug: 'metrics' },
    { category: 'strategy', moduleSlug: 'risk-register' },
  ],
};

// Build a deduped, ordered list of 5-8 recommendations. Focus-band entries
// come first (they match the user's stated workstream), then role + maturity
// adds. Capped at 8 to keep the home page section glanceable.
export function recommendModules(pref: ColdStartPreference): ModuleRecommendation[] {
  const out: ModuleRecommendation[] = [];
  const seen = new Set<string>();
  const add = (category: string, moduleSlug: string, reason: string) => {
    const key = `${category}/${moduleSlug}`;
    if (seen.has(key)) return;
    seen.add(key);
    out.push({ category, moduleSlug, reason });
  };

  for (const m of FOCUS_MODULES[pref.focus]) add(m.category, m.moduleSlug, `For ${pref.focus}`);
  for (const m of ROLE_ADDONS[pref.role]) {
    const label =
      pref.role === 'ic-pm'
        ? 'For PMs'
        : pref.role === 'senior-pm'
          ? 'For Senior PMs'
          : pref.role === 'director'
            ? 'For Directors'
            : pref.role === 'founder'
              ? 'For Founders'
              : 'Common';
    add(m.category, m.moduleSlug, label);
  }
  for (const m of MATURITY_ADDONS[pref.maturity]) {
    const label =
      pref.maturity === 'nothing'
        ? 'Start here'
        : pref.maturity === 'some-docs'
          ? 'Build on what you have'
          : 'Manage what you have';
    add(m.category, m.moduleSlug, label);
  }

  return out.slice(0, 8);
}

// Human-readable option labels for the wizard.
export const ROLE_LABELS: Record<Role, string> = {
  'ic-pm': 'IC PM',
  'senior-pm': 'Senior PM',
  director: 'Director',
  founder: 'Founder',
  other: 'Other',
};
export const FOCUS_LABELS: Record<Focus, string> = {
  discovery: 'Discovery',
  strategy: 'Strategy',
  planning: 'Planning',
  launching: 'Launching',
  operating: 'Operating',
};
export const MATURITY_LABELS: Record<Maturity, string> = {
  nothing: 'Nothing yet',
  'some-docs': 'Some docs',
  'full-backlog': 'A full backlog',
};
