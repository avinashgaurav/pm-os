# Feedback policy — inline vs toast vs dialog

Status: **adopted** (PR closing #53).
Scope: every PM-OS surface that confirms a user action, reports an error, or
asks for a destructive intent.

## TL;DR

| Bucket             | Surface                                                 |
| ------------------ | ------------------------------------------------------- |
| Light confirmation | toast (sonner, bottom-right, auto-dismiss)              |
| Heavy confirmation | **inline** indicator on the affected element — no toast |
| Error              | toast + inline error styling on the action that failed  |
| Destructive intent | inline confirm dialog requiring typed acknowledgement   |
| Navigation guard   | inline confirm dialog (small), no typed acknowledgement |

If you find yourself reaching for `confirm()` or a fifth toast variant, you
are outside the policy. Pick a bucket above.

## Why this policy exists

Today every confirmation is a sonner toast in the bottom-right. That works
fine for `Saved`, `Copied`, `Archived` — small actions where the toast _is_
the confirmation. It misleads in two ways:

- **Heavy actions** like `Generated PRD with AI` already render their result
  on screen — the document, the export, the imported rows. The toast adds
  noise and the user has to read two confirmations: the visible artifact and
  the toast that says the artifact exists.
- **Destructive actions** like `Reset all data` rely on the same lightweight
  pattern as a save. Both fire a single `confirm()` browser dialog and then a
  toast. A delete that wipes 82 modules' worth of work deserves more friction
  than a save.

This document picks a deliberate surface for each category and tells you when
to use which.

## Buckets

### 1. Light confirmation — toast

The action is small, reversible (or trivially redo-able), and produces no
visible artifact. Without the toast, the user might not be sure the click
took.

Use sonner `toast.success(message)`.

Examples that stay as toasts:

- `Saved` (document save)
- `Copied` (copy markdown to clipboard)
- `Deleted` (single row deletion inside a list — the row disappearing is
  visual feedback, but a toast confirms the action when the list is long and
  the row was off-screen)
- `Added`, `Updated` (form submissions that close a dialog)
- `Workflow saved`, `Stakeholder added`
- `Onboarding preferences cleared` (settings reset of a non-destructive
  preference)

Rule of thumb: if the action takes < 100ms and leaves no visible artifact,
keep the toast.

### 2. Heavy confirmation — inline indicator, NO toast

The action produces a visible artifact in the same view. The artifact _is_
the confirmation; a toast is redundant.

Strip the toast. Optionally add a small inline status near the action button
(e.g., `Generated 2s ago`).

Toasts to remove or convert to inline:

- `Generated <output> with AI` — the output now fills the editor pane. Use
  the existing "What's next" card timestamp instead.
- `Exported as Markdown` / `Exported as PDF` — the browser's download bar is
  the confirmation. Keep a brief inline `Last export: 2s ago` if discovery
  is a concern.
- `Imported N rows across all tables` — the imported data is now visible on
  refresh; replace with an inline summary panel that survives the toast
  timeout (because the user will want to read it).
- `Stopped — saved partial <output>` — replace the toast with a **persistent
  inline status badge** ("Generation stopped — partial output") near the
  output pane. Do NOT silently drop the toast: an abort can leave the output
  truncated mid-sentence and the user needs to recognize it as partial. The
  status must survive past the toast's auto-dismiss timeout.

### 3. Error — toast + inline border-red on the action

The user needs both:

- a system-level message of what went wrong (toast),
- a way to find the field/button to retry (inline error styling).

Use `toast.error(message)` AND set an inline error state on the offending
field/button.

Errors that already follow the pattern:

- `Title required` — toast + (eventually) red border on the title field
- `Choose an AI provider in Settings first` — toast + (eventually) a
  highlight on the Settings link in the empty-state

For AI errors, use `tailoredErrorMessage(err)` (already centralized in
`document-editor.tsx`) so a 429 reads as "Rate limited — try again in a few
seconds" rather than raw `429 Too Many Requests`.

### 4. Destructive intent — inline confirm dialog with typed acknowledgement

The action cannot be undone (or undo would be expensive / hard to discover).
Friction is the feature.

Use the `<Dialog>` primitive from `src/components/ui/dialog.tsx`. Requirements:

- The dialog is **modal** — it blocks the rest of the UI.
- The destructive button is **disabled** until the user types the action word
  in a confirm input.
- The default focus is the **cancel** button, not the destructive one.
- The destructive button uses `variant="destructive"`.
- A short "what will be lost" line precedes the input.

Actions in this bucket:

- `Reset all data` (settings) — type `delete` to confirm. See
  `src/app/settings/page.tsx` for the canonical implementation.
- Future: `Delete this module's data` (per-module wipe), `Revoke API
preference` (if/when that lands).

Never use `window.confirm()` for destructive actions — it is unstyleable, has
no typed-acknowledgement support, and the wording cannot be reviewed for
clarity.

### 5. Navigation guard — small inline confirm dialog

The user is about to discard unsaved in-memory work by navigating away. This
is _not_ destructive (nothing is persisted being deleted), but it deserves a
prompt richer than a toast and less hostile than the destructive bucket.

Use a small `<Dialog>` with two buttons: `Discard` (destructive variant) and
`Keep editing` (default focus). No typed acknowledgement.

Actions in this bucket:

- `You have unsaved changes. Leave?` (document-editor `Back` button) — small
  dialog, two buttons.

`window.confirm()` is acceptable here as a transitional state if the inline
dialog is not yet built, but new code should use the inline pattern.

## Authoring rules

1. **One bucket per action.** No "toast + inline + dialog" stacking. Pick.
2. **Match the wording to the bucket.** Toasts are 1–6 words. Dialogs explain
   what will happen and what will be lost. Errors say what went wrong and how
   to retry.
3. **No success toast for an action that already renders its artifact on
   screen.** This is the most common policy violation in the current code.
4. **No `window.confirm()` in new code.** Use `<Dialog>`. The only exception
   is the navigation-guard bucket (§5) where existing `window.confirm()` call
   sites are tolerated until they migrate, but new navigation-guard prompts
   should still use `<Dialog>`.

## Inventory snapshot (May 2026)

74 toast call sites at the time of writing, distributed across 20 files. By
bucket, after this policy is applied:

- Light confirmation (stays as toast): ~40 sites — form saves, inline
  deletes, settings preference toggles.
- Heavy confirmation (toast to remove): ~14 sites — AI generation, exports,
  imports, the partial-stop save.
- Error (toast + inline): ~18 sites — form validation, AI errors, import
  failure.
- Destructive intent: 1 site — `Reset all data` in settings.
- Navigation guard: 1 site — unsaved-changes back button in document
  editor.

The PR closing #53 ships the policy doc + the destructive-intent refactor
(`Reset all data`). The 40-call-site sweep across heavy/error buckets is
tracked as a follow-up so it can be reviewed independently.
