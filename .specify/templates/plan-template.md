# Implementation Plan: [FEATURE]

**Branch**: `[###-feature-name]` | **Date**: [DATE] | **Spec**: [link]

**Input**: Feature specification from `/specs/[###-feature-name]/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command; its definition describes the execution workflow.

## Summary

[Extract from feature spec: primary requirement + technical approach from research]

## Technical Context

<!--
  The stack below is FIXED by the constitution (Technology and Compliance Constraints).
  Do not reopen it during planning. Fill only the feature-specific rows.
-->

**Language/Version**: TypeScript 5.x, React 18+

**Primary Dependencies**: React + Vite, Vanilla Extract, Framer Motion, Lenis, Supabase JS client

**Storage**: Supabase (PostgreSQL) — one project per client deployment

**Testing**: [feature-specific — name the concurrency test explicitly if this feature touches availability]

**Target Platform**: Mobile web first (mid-range Android on mobile data), desktop second

**Project Type**: Web application — public guest site + authenticated admin area

**Performance Goals**: [REQUIRED for any visual surface — state the budget, verified throttled]

**Constraints**: [feature-specific — e.g. payload budget in MB if 3D is enabled for this feature]

**Scale/Scope**: 8–30 rooms per property, single property per deployment

**3D layer**: OFF by default. If this plan enables Three.js / R3F / drei / postprocessing, state it
here explicitly, with a payload budget in MB and the mobile fallback design. Otherwise write "off".

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Mark each gate PASS / N/A / VIOLATION. Any VIOLATION must be justified in Complexity Tracking or
the design must change. Gates III and VIII are NON-NEGOTIABLE and cannot be justified away.

| # | Gate | Status |
|---|---|---|
| I | No property-specific value hardcoded outside config, content, or theme. No new tenancy assumption | |
| II | No payment gateway, no card data, no computed/enforced amounts | |
| III | **Overlap prevention enforced at DB level in one transaction; holds auto-expire; state transitions server-side** | |
| IV | Evaluative imagery is real photography; demo assets isolated and gated at deployment | |
| V | Every colour/spacing/typography value referenced by exact token name | |
| VI | Only transform/opacity animated; reduced-motion fallback present; Lenis fully disabled under it; 3D off unless declared above | |
| VII | Image pipeline (AVIF/WebP, srcset, placeholders, lazy) planned, not deferred | |
| VIII a | **RLS enabled per table with explicit policy per operation per role** (baseline RLS-P1…P6) | |
| VIII b | **Views set `security_invoker = true`; `security definer` functions pin `search_path = ''`** | |
| VIII c | **Public signup disabled** | |
| VIII d | **CSP header without `'unsafe-inline'` in `script-src`** | |
| VIII e | No secret in client bundle; nothing secret carries a `VITE_` prefix | |
| VIII f | Client-supplied values verified server-side; input validated server-side | |
| VIII g | Output encoded in every non-React path (email templates especially) | |
| IX | Full CRUD per entity (or spec-stated deferral); four states per surface | |
| X | Plan scoped so each stage runs in isolation: Setup+Foundational, then one story per run | |
| XI | Completion report will name Simplified / Skipped / Blocked | |
| Compliance | No sensitive personal info collected; retention job covers new personal data; data region recorded | |

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output (/speckit-plan command)
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)
<!--
  ACTION REQUIRED: Replace the placeholder tree below with the concrete layout
  for this feature. Delete unused options and expand the chosen structure with
  real paths (e.g., apps/admin, packages/something). The delivered plan must
  not include Option labels.
-->

```text
# [REMOVE IF UNUSED] Option 1: Single project (DEFAULT)
src/
├── models/
├── services/
├── cli/
└── lib/

tests/
├── contract/
├── integration/
└── unit/

# [REMOVE IF UNUSED] Option 2: Web application (when "frontend" + "backend" detected)
backend/
├── src/
│   ├── models/
│   ├── services/
│   └── api/
└── tests/

frontend/
├── src/
│   ├── components/
│   ├── pages/
│   └── services/
└── tests/

# [REMOVE IF UNUSED] Option 3: Mobile + API (when "iOS/Android" detected)
api/
└── [same as backend above]

ios/ or android/
└── [platform-specific structure: feature modules, UI flows, platform tests]
```

**Structure Decision**: [Document the selected structure and reference the real
directories captured above]

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |
