import assert from 'node:assert/strict';
import { test } from 'node:test';
import { buildModulePrompt } from './ai';
import { MODULE_PROMPT_IDS, OWN_STRUCTURE_MODULES } from './ai-prompts';

const SECTIONS = [{ label: 'Context', value: 'A made-up product.' }];

test('every OWN_STRUCTURE_MODULES id is a key of the prompts registry', () => {
  // A rename in ai-prompts.ts would otherwise drop the opt-out without any error.
  const known = new Set(MODULE_PROMPT_IDS);
  const unknown = [...OWN_STRUCTURE_MODULES].filter((id) => !known.has(id));
  assert.deepEqual(unknown, []);
});

test('exactly the own-structure modules get the own-structure closing line (no model call)', () => {
  for (const id of MODULE_PROMPT_IDS) {
    const [category, slug] = id.split('/');
    const { user } = buildModulePrompt(category, slug, 'Doc', 'T', SECTIONS);
    const ownClosing = user.includes('Write only the document itself, ready to publish.');
    const analysisLine = user.includes('Add your expert analysis, identify gaps');
    assert.equal(ownClosing, OWN_STRUCTURE_MODULES.has(id), id);
    assert.equal(analysisLine, !OWN_STRUCTURE_MODULES.has(id), id);
  }
});

test('user stories ask for a closing INVEST Check section', () => {
  const { system } = buildModulePrompt('specs', 'user-stories', 'User Stories', 'T', SECTIONS);
  assert.match(system, /add an "## INVEST Check" section/);
});

test('own-structure modules get no expert analysis tail, executive summary or Next Steps', () => {
  for (const id of OWN_STRUCTURE_MODULES) {
    const [category, slug] = id.split('/');
    const { system, user } = buildModulePrompt(category, slug, 'Doc', 'T', SECTIONS);
    assert.doesNotMatch(user, /expert analysis|identify gaps/i, id);
    assert.match(user, /Do not add an analysis, gaps or recommendations section/, id);
    assert.doesNotMatch(system, /## Executive Summary|"## Next Steps"/, id);
  }
});

test('other modules keep the analysis line, the summary heading and Next Steps', () => {
  const { system, user } = buildModulePrompt('specs', 'tech-spec', 'Tech Spec', 'T', SECTIONS);
  assert.match(user, /Add your expert analysis, identify gaps/);
  assert.match(system, /under a "## Executive Summary" heading/);
  assert.match(system, /The last section is always "## Next Steps"/);
  assert.match(system, /executive summary \(a short paragraph/);
});

test('the figures rule covers contact details, norms and calculations on assumed inputs', () => {
  for (const id of ['communication/release-notes', 'strategy/okrs']) {
    const [category, slug] = id.split('/');
    const { system } = buildModulePrompt(category, slug, 'Doc', 'T', SECTIONS);
    assert.match(
      system,
      /Never invent contact details or links: email addresses, phone numbers, URLs/
    );
    assert.match(system, /\[support email\]/);
    assert.match(system, /Do not state an outside norm, benchmark or rule of thumb as fact/);
    assert.match(system, /not about ordinary words such as a standard agenda/);
    assert.match(system, /calculate from an assumed input is itself an estimate/);
  }
});

test('OKR and A/B prompts name the two remaining figure misses', () => {
  const okr = buildModulePrompt('strategy', 'okrs', 'OKRs', 'T', SECTIONS).system;
  assert.match(okr, /do not claim that any cycle length, cadence or scoring scale is the standard/);
  const ab = buildModulePrompt('analytics', 'ab-design', 'A/B', 'T', SECTIONS).system;
  assert.match(ab, /intra-cluster correlation, design effect/);
  assert.match(ab, /mark each one the PM did not give as an assumption/);
});
