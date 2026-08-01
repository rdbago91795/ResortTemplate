# Vibe Coding: Spec Kit Edition

A rebuild of the master chain on GitHub Spec Kit's native commands, with custom prompts filling what Spec Kit deliberately leaves out.

**Why this exists alongside the original chain:** Spec Kit is a spec-driven *engineering* toolkit. It covers specify → plan → tasks → implement extremely well and has real machinery the paste-in chain can't match — cross-artifact analysis, convergence loops, dependency-ordered task generation. What it doesn't cover is everything outside engineering: security review, legal, brand and design system, marketing, deployment, and post-launch change control. Those stay custom prompts here.

**Cost note:** the agent re-reads spec, plan, and tasks every turn, so expect roughly 20-40% higher token spend per feature than unstructured building. Worth knowing before you commit.

---

## The structural difference from the original chain

The original chain produces **project-level documents** (`01-prd.md`, `02-architecture-schema.md`, and so on) that every feature reads.

Spec Kit works **per feature**: each `/speckit.specify` creates its own feature directory with `spec.md`, `plan.md`, and `tasks.md`. The only project-level artifact is `.specify/memory/constitution.md`.

That means project-wide concerns — your stack, security posture, legal baseline, design system — belong in the **constitution** or alongside it in `.specify/memory/`, not repeated in every feature spec. The constitution is what every later phase gets evaluated against, so anything you'd otherwise restate constantly goes there once.

By the end of Phase 0 that directory holds four files: `product-brief.md` (what you're building and for whom), `constitution.md` (the rules every phase is judged against), `security-baseline.md`, and `design-system.md`. Feature specs stay lean because these carry the shared context.

---

## How to read each step

Every step below carries a header block:

- **Type** — a **native Spec Kit command** is typed as `/speckit.something`. A **paste-in prompt** is plain text you paste into Claude Code. Both write their own files — the custom prompts end with an explicit instruction to save, since Spec Kit's own commands can't be extended to cover them
- **Reads** — what it needs in place first
- **Writes** — the file produced. Every step that produces a document instructs the agent to write it directly; you never copy-paste output into a file
- **When** — once per project, once per feature, or repeatedly
- **Why it exists** — included for the custom steps, since those aren't self-explanatory the way a named command is

Roughly half these steps are custom prompts, because Spec Kit deliberately covers engineering and stops there. This chain assumes Claude Code or an equivalent agent with file access — every step writes its own output.

## Command reference

The core sequence:

```
/speckit.constitution → /speckit.specify → /speckit.clarify → /speckit.plan
→ /speckit.checklist → /speckit.tasks → /speckit.analyze → /speckit.implement
→ /speckit.converge
```

Only `/speckit.specify` is strictly required before `/speckit.plan`. Clarify, checklist, and analyze are quality gates you add wherever there's meaningful ambiguity — which, for anything you're building solo without a second pair of eyes, is most places.

**Invocation varies by agent.** Most expose `/speckit.*`. Codex CLI and ZCode in skills mode use `$speckit-*`; Kimi uses `/skill:speckit-*`. Substitute whichever form your agent exposes.

---

# Phase 0 — Project setup (once)

## 0.1 Install and initialise

> **Type** — shell commands, run in your terminal
> **Reads** — nothing
> **Writes** — the project scaffold, `.specify/` directory, and `.claude/commands/`
> **When** — once, at project start

```bash
uv tool install specify-cli --from git+https://github.com/github/spec-kit.git
specify init <project-name> --ai claude
specify extension add bug
```

The `bug` extension adds a three-step triage process — assess, fix, validate — with each bug tracked under `.specify/bugs/`. That's the native replacement for the original chain's debug loop, and it's better than a prompt because each bug gets its own tracked directory.

### Claude Code skills (separate mechanism, coexists with Spec Kit)

Spec Kit installs its commands into `.claude/commands/`. Skills live in `.claude/skills/` and are a different thing entirely — markdown folders Claude loads on demand when a task matches their description.

The distinction that matters here:

| Mechanism | Nature | Invocation |
|---|---|---|
| `/speckit.*` commands | A phase of work | You type it — deterministic |
| Spec Kit extensions | New commands | You type it — deterministic |
| Spec Kit presets | Overrides to command and template files | Applied automatically |
| The constitution | Rules every phase is judged against | Always in effect |
| Claude Code skills | Domain knowledge and craft | Loads contextually on match |

Skills are the right home for *how to do something well*. Custom chain steps belong in Spec Kit extensions instead, because a sequential process needs deterministic invocation rather than description matching.

**`frontend-design`** — Anthropic's official design skill. Covers judgment rather than libraries: palette as named hex values, deliberate typeface pairing, one signature element the page is remembered by. Its calibration of what AI-generated design currently looks like is the useful part for client work.

```bash
git clone https://github.com/anthropics/skills.git
cp -r skills/skills/frontend-design ~/.claude/skills/
```

**`emalorenzo/three-agent-skills`** — install only if the project warrants the 3D layer (see 0.3). Covers `@react-three/postprocessing` — the actual cinematic layer — plus fiber, drei, rapier, and zustand. Worth having because model training data carries outdated React Three Fiber patterns.

```bash
git clone https://github.com/emalorenzo/three-agent-skills.git
cp -r three-agent-skills/skills/* ~/.claude/skills/
```

Restart Claude Code after installing. Install paths change — check each repo's README if a command fails.

**Install one 3D skill, not three.** Overlapping skills produce contradictory guidance on the same question. Eight to twelve well-chosen skills covers most of a working developer's day.

Note also that Spec Kit itself can install as agent skills rather than slash-command files for integrations that support it, via `--integration <agent> --integration-options="--skills"`.

## 0.2 Product brief

> **Type** — paste-in prompt (or reuse the idea chain's Step 6 output)
> **Reads** — nothing; you supply the idea
> **Writes** — `.specify/memory/product-brief.md`
> **When** — once, before anything else

**This is where the idea lives.** Spec Kit has no product-level artifact besides the constitution, and the constitution holds *principles*, not *what you're building*. So the brief gets its own file in the same memory directory, and every later phase reads it.

Save your brief as `.specify/memory/product-brief.md`. It should cover: the problem, the idea in two to four sentences, the target user, settled design decisions, success definition, key risk, constraints, and explicit scope boundaries (what's in the MVP and what's deliberately deferred).

If you came from the idea-discovery chain, its Step 6 output is already this document — save it here unchanged.

If you don't have one, generate it before going further:

```
You're a product strategist writing the brief a developer will build from.

MY IDEA: [two to four sentences — who it's for, the problem, the core action a user takes]

Produce a product brief covering:
1. Problem — what's broken today, for whom
2. The idea, restated tightly enough to paste into a spec
3. Target user — one specific persona, and why it's them rather than an adjacent group
4. Settled design decisions — anything already decided that later phases shouldn't relitigate
5. Success definition — how I'd know this is working, not vanity metrics
6. Key risk — the single assumption most likely to be wrong, and the cheapest test that would expose it
7. Constraints — budget, team, timeline, stack, market
8. Scope boundaries — what's in the MVP, and what's explicitly deferred with the reason

Mark anything you're inferring rather than drawing from what I told you, so I can correct it before it hardens into a spec.

Write the result to .specify/memory/product-brief.md.
```

Every phase below reads that file.

## 0.3 Constitution

> **Type** — native Spec Kit command
> **Reads** — `.specify/memory/product-brief.md`
> **Writes** — `.specify/memory/constitution.md`, automatically. You don't save anything by hand
> **When** — once, and amended later if a principle genuinely changes

This replaces the original chain's Ground Rules, and it's the single highest-leverage step here — every later phase is evaluated against it.

```
/speckit.constitution

Read .specify/memory/product-brief.md first — its constraints and settled decisions inform these principles.

Stack is fixed: React + Vite + Vanilla Extract + Framer Motion + Lenis + Supabase. Vanilla Extract theme contracts are typed — reference tokens by their exact names, never hardcode a colour or spacing value that a token already covers.

Build discipline:
- One feature per implementation run. Scoping /speckit.implement to a single user story phase is required, not optional; building everything at once produces work that can't be debugged.
- Never apply a database migration or install a dependency without showing me the exact SQL or package first and waiting for confirmation.
- Every entity gets full CRUD unless the spec explicitly defers part of it to a later phase. Generated specs consistently cover create and read while silently dropping update and delete.
- Every user-facing surface handles four states: loading, empty, error, and success. A feature without them is incomplete, not "mostly done".

Design and motion:
- Light and dark theme token sets are both required, implementing the same contract. Not optional, not later.
- The optional 3D layer (Three.js, React Three Fiber, drei, postprocessing) is off unless a plan explicitly turns it on. Turn it on only where the visual experience is part of what's being sold — atmosphere, immersion, or a product worth rendering — never for tools, dashboards, or task-oriented sites. Where it is on, set a payload budget in megabytes and design the mobile fallback from the start, never as a retrofit.
- Where a project depicts a real place, property, or product, evaluative content — what a user actually judges before deciding — must be real photography. Stylised or generated imagery is for atmosphere only, and must never be mistakable for the real thing. This is a truthfulness constraint, not an aesthetic one.
- Animate only transform and opacity. Animating width, top, or filter forces layout or paint and drops frames.
- Every animation needs a prefers-reduced-motion fallback. Where Lenis smooth scroll is active, it must be disabled entirely under reduced motion, not merely shortened.

Security:
- Row Level Security is enabled on every table, with an explicit policy per operation and per role. A table with RLS never enabled is a live security hole regardless of what the client code does.
- Secrets are environment variables only and never reach frontend code.
- Anything the client could tamper with — prices, permissions, quantities — is verified server-side.
- User input is validated server-side, not only in the form.

Honesty:
- When you finish a phase, list what you actually built against what was asked, and name anything you simplified, skipped, or couldn't complete. A silent omission is worse than a flagged one.
```

## 0.4 Security & compliance baseline (custom — no Spec Kit equivalent)

> **Type** — paste-in prompt. Spec Kit has no security or legal phase, so this is a plain prompt to your agent, not a `/speckit.*` command
> **Reads** — `product-brief.md`, `constitution.md`
> **Writes** — `.specify/memory/security-baseline.md`
> **When** — once per project. Feature-level security happens later at 1.3
> **Why it exists** — every feature will need RLS policies, validation rules, and a legal position. Deciding those once at project level means feature specs reference a named pattern instead of reinventing security each time — and inconsistent security across features is how holes appear

Spec Kit has no security or legal phase. Run this once. Feature specs reference it rather than restating security.

```
You're a senior application security engineer and compliance-focused advisor working on a Supabase-backed PWA.

Read .specify/memory/product-brief.md and .specify/memory/constitution.md — the brief tells you what data this product collects and who its users are, which determines which laws apply.

Produce a project-level baseline covering:

1. RLS policy patterns for the access shapes this project will use — owner-only, role-scoped, public-read — written so a feature spec can reference a pattern by name instead of reinventing it
2. Auth hardening: session and token handling, rate limiting on login, password reset, signup, and any public-facing form
3. Secrets checklist: which categories of value must be environment variables and must never reach frontend code
4. Input validation rules that apply project-wide, and where user-generated content could enable injection or XSS
5. File upload rules if applicable: allowed types, size limits, storage location
6. Webhook handling for any third-party service: signature verification and idempotency
7. Which laws likely apply given the data collected and where users are based — for a Philippine-market product that means RA 10173 at minimum, plus GDPR or CCPA if relevant
8. Draft privacy policy and terms of service in plain language
9. Breach notification obligations: who must be told, and within what timeframe
10. What genuinely needs a lawyer before launch rather than this draft

Flag anything that should constrain the constitution itself.

Write the result to .specify/memory/security-baseline.md.
```

## 0.5 Design system (custom — no Spec Kit equivalent)

> **Type** — paste-in prompt. `/speckit.plan` covers technical architecture, not brand or visual language, so this fills that gap
> **Reads** — `product-brief.md`, `constitution.md`
> **Writes** — `.specify/memory/design-system.md`
> **When** — once per project, before any UI is built
> **Why it exists** — the theme contract token names, component inventory, and motion values defined here get referenced by name in every later phase. Without this file, each feature invents its own tokens and components, and the result looks like several products stitched together

Spec Kit's `/speckit.plan` covers technical architecture, not brand or visual language.

> **`frontend-design` loads here** — this is the phase it's built for. Let it drive palette, typography, and the choice of a single signature element. This prompt's job is coverage: making sure nothing required gets left out. The two are complementary, not competing. If the skill pushes toward less animation while this prompt asks you to specify motion treatment, that isn't a conflict — the prompt defines what must be decided, the skill informs how much is too much.

```
You're a senior product designer building a UI system for an early-stage product.

Read .specify/memory/product-brief.md and .specify/memory/constitution.md — the brief's target user and settled design decisions drive everything here.

1. Brand name: 3-5 options, one line on why each works and one risk. Recommend one. Confirm .com and .ph availability or flag that you can't verify
2. Visual direction: 2-3 options, recommend one for the target user, apply the brand name to it
3. Light and dark theme tokens as a **Vanilla Extract theme contract** — give exact token names as they'll appear in code, since every later phase references them by name and a wrong guess breaks the build. Both themes implement the same contract
4. Where the theme toggle lives, and whether it defaults to system preference
5. Shared component inventory: what exists, its purpose, its props
6. The four required states for every surface: empty, loading, error, success — plus lockout and rate-limit messaging
7. Motion treatment with **Framer Motion**: named variants and actual transition values for page transitions, hover and tap feedback, and loading. Not "add some animations"
8. Scroll behaviour if used: Lenis easing duration, and for any pinned scene the outer wrapper height (this sets pacing) plus which properties animate across the range. Note that Lenis can interfere with `position: sticky` — flag it here so implementation handles it deliberately
9. **3D scene specification**, only if the constitution's 3D layer is on. Per scene: what's actually rendered (real photos with depth displacement, stylised geometry, a hero object), the camera path and what drives it, the lighting approach (name the HDRI or light rig), and the postprocessing chain in order with actual values — bloom intensity, depth-of-field focal range, grain amount. "Cinematic" is not a spec; a named effect chain with numbers is. Specify the mobile fallback concretely: what a device that can't run this sees instead, and at what threshold it switches. The transform-and-opacity rule governs DOM animation only — WebGL needs its own ceiling in draw calls, texture memory, and polygon count
10. Mobile versus desktop differences
11. Accessibility baseline: contrast checked in both themes, keyboard navigation, screen-reader labels, reduced-motion fallbacks

Concrete and buildable. Later phases read this directly as build context.

Write the result to .specify/memory/design-system.md.
```

---

# Phase 1 — Build the MVP, then each later feature

## How this phase actually runs

Three of these steps loop, and each has a specific exit condition. Running them the wrong number of times is the most common way this phase goes wrong — too few passes and you build on an ambiguous spec, too many and you're polishing a document instead of shipping.

```
1.1  specify                    once
       ↓
1.2  clarify          ⟲ LOOP    until it returns no high-impact questions
       ↓
1.3  security review            once  → gaps? back to 1.2
       ↓
1.4  plan                       once
       ↓
1.5  checklist                  once  → gaps? back to 1.2, then re-run 1.4
       ↓
1.6  tasks                      once
       ↓
1.7  analyze          ⟲ LOOP    until it reports no inconsistencies
       ↓
     ┌─────────────────────────────────────────┐
     │  1.8  implement    one user story only  │
     │         ↓                               │  ⟲ LOOP per story
     │  1.10 loose-ends   fix any BLOCKER      │
     └─────────────────────────────────────────┘
       ↓  all stories done
1.9  converge         ⟲ LOOP    with 1.8 until it reports converged
       ↓
     Phase 3 (first launch) or Phase 4 (already live)
```

**Exit conditions, stated plainly:**

| Loop | Stop when | Typical passes |
|---|---|---|
| 1.2 clarify | It returns no questions, or only cosmetic ones. Don't answer questions the spec doesn't need | 2-3 |
| 1.7 analyze | It reports no inconsistencies. **Fix at the source** — requirement problems go back to `/speckit.specify` or `/speckit.clarify`, design problems to `/speckit.plan`, task problems to `/speckit.tasks`. Never patch the report | 1-3 |
| 1.8 + 1.10 | Every user story in `tasks.md` is implemented. One story per run, no exceptions | one per story |
| 1.9 converge | It reports **converged** and leaves `tasks.md` untouched. If it appends tasks, run 1.8 on those, then converge again. Each pass finds fewer | 2-4 |

**"Verify" between implement runs means three specific things**, not a vibe check:

1. Run the build. `npm run build` — with Vanilla Extract's typed tokens, a wrong token name fails here rather than looking subtly off
2. Run the loose-ends sweep (1.10) and fix anything tagged BLOCKER
3. Look at it in the browser, or drive it with Playwright MCP. This is the only step that catches whether it actually looks and behaves right

**Which user story next?** `tasks.md` orders them by priority. Take them in order — the ordering exists because later stories depend on earlier ones.

**How many times does Phase 1 run overall?** Once for the whole MVP (one spec, many user stories), then once per feature added after launch. It is not run per page or per component.

## 1.1 Specify

> **Type** — native Spec Kit command
> **Reads** — `.specify/memory/product-brief.md`
> **Writes** — a new feature directory with `spec.md`, and a feature branch, automatically
> **When** — once for the MVP, then once per post-launch feature

**How the brief maps onto this.** A product brief describes a whole product; `/speckit.specify` creates one feature directory and branch. The mapping isn't one-to-one, and getting it wrong is the most common way this goes sideways.

For the **initial MVP**, write one spec covering the whole thing, with each MVP capability as a separate user story. `/speckit.tasks` generates one phase per user story in priority order, so `/speckit.implement` can be scoped to a single story at a time — you still get one-thing-at-a-time discipline without fragmenting the product across a dozen spec directories that share no context.

For **anything added after launch**, start a new `/speckit.specify` cycle. By then the MVP exists as its own spec and the new work is genuinely a separate feature.

Focus on **what** and **why**. Tech stack belongs in plan, not here.

```
/speckit.specify Read .specify/memory/product-brief.md. Build the MVP it describes, scoped strictly to its in-scope list — anything the brief marks as deferred stays out of this spec entirely.

Write each MVP capability as its own user story, in priority order, so tasks and implementation can be staged one story at a time.

Cover the full lifecycle of every entity this creates: create, view, edit, delete. If any part is deliberately deferred, say so explicitly rather than omitting it.
```

The scope instruction is load-bearing. Without it, a spec generated from a brief reliably pulls in items from the deferred list, because they're sitting right there in the same document and read as part of the product.

That last line is load-bearing. Generated specs reliably cover create and read while dropping update and delete, and nothing downstream catches it because the spec never claimed them.

## 1.2 Clarify

> **Type** — native Spec Kit command
> **Reads** — the current feature's `spec.md`
> **Writes** — updates `spec.md` in place with your answers
> **When** — after specify, repeatedly, targeting a different area each pass

```
/speckit.clarify
```

Asks up to five targeted questions about underspecified areas and writes your answers back into `spec.md`. Run it repeatedly, targeting a different area each pass — **stop when it returns no questions or only cosmetic ones**, typically after two or three:

```
/speckit.clarify Focus on permission variants — what each role can see and do, and what happens on permission denied.
```

Permissions are worth a dedicated pass, because they become the RLS policies and a vague spec here produces a permissive policy later.

## 1.3 Security review of this feature (custom)

> **Type** — paste-in prompt
> **Reads** — `security-baseline.md`, `constitution.md`, this feature's `spec.md`
> **Writes** — nothing. It reports; you act on it through `/speckit.clarify` or `/speckit.specify`
> **When** — once per feature, between clarify and plan, while changes are still cheap

Between clarify and plan, while it's still cheap to change.

```
You're a senior application security engineer.

Read .specify/memory/security-baseline.md, .specify/memory/constitution.md, and this feature's spec.md.

For this feature specifically:
1. Every table it touches — the exact RLS policy needed per operation and per role. Flag any table with no clear policy as a critical gap
2. Which baseline pattern applies, or why this feature needs something custom
3. Anything the client would be trusted with that it shouldn't be
4. Which fields need server-side validation beyond the frontend
5. Anything here that should change the spec before planning starts

Report only. Don't edit the spec — tell me what to change and I'll run /speckit.clarify or /speckit.specify.
```

## 1.4 Plan

> **Type** — native Spec Kit command
> **Reads** — this feature's `spec.md`, `constitution.md`, `product-brief.md`, `design-system.md`
> **Writes** — `plan.md` in the feature directory, automatically
> **When** — once per feature, after the spec is stable

This is where implementation detail belongs — pass stack and constraints as arguments.

```
/speckit.plan Read .specify/memory/product-brief.md for settled design decisions that shouldn't be relitigated. Use React + Vite + Vanilla Extract + Framer Motion + Supabase per the constitution. Apply the theme contract and component inventory in .specify/memory/design-system.md — reference existing tokens and components by their exact names rather than creating new ones. Apply the RLS policies from the security review. Include a Mermaid ER diagram with explicit cardinality for every relationship.
```

The cardinality request matters: a plain relationship list leaves one-to-many versus many-to-many open, and that ambiguity gets resolved one way in foundational tasks and a different way in feature tasks.

## 1.5 Checklist

> **Type** — native Spec Kit command
> **Reads** — this feature's `spec.md`
> **Writes** — a checklist file in the feature directory
> **When** — after plan, and again after any significant spec change

Quality gate — "unit tests for your requirements." Checks whether the spec itself is complete, clear, and unambiguous.

```
/speckit.checklist
```

Then a targeted pass on the things that habitually get skipped:

```
/speckit.checklist Focus on error paths, empty states, permission-denied behaviour, and every entity's update and delete flows.
```

If it surfaces gaps, loop back to `/speckit.clarify` or `/speckit.specify` before breaking work down.

## 1.6 Tasks

> **Type** — native Spec Kit command
> **Reads** — this feature's `spec.md` and `plan.md`
> **Writes** — `tasks.md` in the feature directory, automatically
> **When** — once per feature, re-run if spec or plan changes materially

```
/speckit.tasks
```

Produces a dependency-ordered `tasks.md` organised into Setup, Foundational (blocking prerequisites), one phase per user story in priority order, and a final Polish phase, with parallel-safe tasks marked.

## 1.7 Analyze

> **Type** — native Spec Kit command, read-only
> **Reads** — this feature's `spec.md`, `plan.md`, `tasks.md`
> **Writes** — nothing. It reports inconsistencies and can suggest fixes for your approval
> **When** — after tasks, before implement. Re-run until clean

Read-only cross-artifact consistency check across spec, plan, and tasks. It never edits files — it reports and can suggest remediations for approval.

```
/speckit.analyze
```

**Fix at the source, not in the report.** Requirement problems go back to `/speckit.specify` or `/speckit.clarify`; design problems to `/speckit.plan`; task problems to `/speckit.tasks`. **Re-run until it reports no inconsistencies** — usually one to three passes.

## 1.8 Implement — in stages

> **Type** — native Spec Kit command
> **Reads** — this feature's `spec.md`, `plan.md`, `tasks.md`, plus `constitution.md` and `design-system.md`
> **Writes** — actual code, and marks tasks complete in `tasks.md`
> **When** — repeatedly, scoped to one phase or user story per run. Never all at once

Never in one run for anything non-trivial. Scope each run, verify, continue.

```
/speckit.implement Implement only the Setup and Foundational phases. Stop before any user-story feature.
```

Then, one user story at a time, in the order `tasks.md` lists them:

```
/speckit.implement Now implement the [user story name] phase only.
```

**After each run, verify before starting the next:** run the build, run the loose-ends sweep (1.10) and fix anything tagged BLOCKER, and look at the result in the browser or through Playwright MCP. Only then move to the next story.

> **The 3D skill loads here** if a scene is being built — follow its postprocessing and R3F guidance rather than working from memory, since training data carries outdated patterns. Scope any 3D scene to its own implement run and build it on a standalone route first. Tuning shaders and lighting while also debugging page layout means two invisible unknowns at once, and neither can be judged from inside the agent.

Between stages, run the loose-ends sweep at 1.10.

## 1.9 Converge

> **Type** — native Spec Kit command, append-only
> **Reads** — the codebase against `spec.md`, `plan.md`, `tasks.md`
> **Writes** — appends gap-closing tasks to `tasks.md`. Never edits or deletes code
> **When** — after implement. Loop implement → converge until it reports converged

```
/speckit.converge
```

Assesses the codebase against spec, plan, and tasks. Append-only — it never edits or deletes code, and its only write is adding tasks to `tasks.md`. Run only after `/speckit.implement` has run on the current `tasks.md`.

Two outcomes: **converged** (clean, `tasks.md` untouched) or **tasks appended** (gaps found, added under a Convergence section). If tasks were appended, run `/speckit.implement` on them, then `/speckit.converge` again. Each pass finds fewer — **stop when it reports converged and leaves `tasks.md` untouched**, typically after two to four rounds.

## 1.10 Loose-ends sweep (custom)

> **Type** — paste-in prompt, or the `loose-ends` agent if you use the agents companion
> **Reads** — `constitution.md`, this feature's `spec.md` and `plan.md`, and the code
> **Writes** — nothing. Reports only
> **When** — between implementation stages, and before moving to the next phase
> **Why it exists** — converge checks the build against the spec. This catches what nobody specified: leftover TODOs, suppressed type errors, a table with RLS never enabled, and anything the *next* phase depends on that isn't ready

Converge checks the implementation against the spec. This catches what nobody specified.

```
You're a senior engineer doing a pre-flight sweep before the next phase.

Read the constitution, this feature's spec.md and plan.md, and inspect what was just built. You cannot modify files — report and stop.

Report every category, saying "none found" rather than skipping, so clean is distinguishable from unchecked:

1. Unfinished work — TODO, FIXME, console.log, commented-out code, placeholder copy, hardcoded values meant to be configurable
2. Suppressed problems — `any` types, `@ts-ignore`, inline lint disables, empty catch blocks, unused imports. Each is a deferred decision; name what was avoided
3. Deferred decisions never resolved — anything a previous phase flagged or promised to handle later and didn't
4. Stack traps — Supabase tables with RLS never enabled; policies that don't match the security review; hardcoded values where a theme token exists; animations without a reduced-motion fallback; animated properties other than transform and opacity; `position: sticky` used after Lenis was wired without that interaction being verified; env vars referenced but undocumented. If a 3D layer exists: models not actually Draco-compressed and textures not KTX2/Basis-compressed, payload over the budget the constitution set, or a mobile fallback that was specified but never wired
5. What will block the next phase — given what comes next, is anything it depends on missing or wrong? Reason forward from what that phase needs, not backward from what this one promised

Tag each finding BLOCKER, SHOULD FIX, or NOTE. Give file and line. Where a check needs a command run, give me the exact command rather than guessing its result.
```

---

# Phase 2 — Bugs

> **Type** — native Spec Kit extension commands
> **Reads** — the codebase and your bug description
> **Writes** — a tracked directory per bug under `.specify/bugs/`, automatically
> **When** — any time something breaks

Use the bundled extension rather than a prompt — each bug gets its own tracked directory under `.specify/bugs/`:

```
/speckit.bug.assess [expected behaviour, actual behaviour, exact error message]
/speckit.bug.fix
/speckit.bug.validate
```

Assess before fix is the same discipline as the original chain's "find the root cause and explain it before changing anything," except the tracking is structural rather than remembered.

---

# Phase 3 — Pre-launch (once, before first deploy)

Spec Kit has no launch phase. All custom.

## 3.1 Full audit

> **Type** — paste-in prompt, or the `auditor` agent
> **Reads** — every `.specify/memory/` file and every feature's `spec.md` and `plan.md`, plus the code
> **Writes** — nothing. Reports only
> **When** — once, before first deploy

```
You're a meticulous release engineer running a final pre-launch audit. Nothing passes until verified, not merely reviewed. Report only — don't fix.

Read the constitution, security-baseline.md, design-system.md, and every feature's spec.md and plan.md.

UX
1. Every built feature has loading, empty, error, and success states matching the design system
2. Mobile responsiveness on every page — this is the primary target, not the fallback
3. Accessibility: contrast in both themes, keyboard navigation, screen-reader labels
4. Every entity can actually be edited and deleted, not just created and viewed, unless a spec explicitly deferred it
5. The light/dark toggle works everywhere and both token sets are genuinely applied
6. Lenis is fully disabled under prefers-reduced-motion, and anchor links plus keyboard scrolling still work
6b. If a 3D layer exists: payload within budget, compression actually applied rather than merely intended, the mobile fallback triggering correctly on a real mid-range device rather than a throttled desktop tab, and real photography used for any evaluative content depicting a real place or product

Security
7. Table by table — the live RLS policy matches what the security review specified, and no table has RLS disabled
8. No secrets in frontend code
9. Rate limiting live on auth and every public-facing form

Legal
10. Privacy policy and terms live and linked, matching what's actually collected
11. Cookie consent live if the baseline called for it

Operational
12. Error tracking live and actually reporting — say what command or action would verify this rather than assuming it works
13. Backup retention understood and restore procedure known
14. Success metrics measurable with what's built

Separate anything you can't verify with read-only inspection into "requires manual verification," with exact steps. Never imply you confirmed something you only inspected statically.
```

## 3.2 Marketing copy

> **Type** — paste-in prompt
> **Reads** — feature specs and what was actually built
> **Writes** — `.specify/memory/marketing.md`
> **When** — once, before launch

```
You're a senior product marketer who writes conversion-focused copy without overselling.

Read every feature's spec.md and what was actually built — not what was originally planned.

1. One-sentence positioning, sharper than the spec's framing, written for someone seeing this cold
2. Landing page: headline, subheadline, 3-5 benefit-first feature blurbs, one primary CTA
3. Page title and meta description, plus Open Graph title and description
4. A launch post for [platform], matching its tone and length norms
5. Three taglines under 10 words
6. FAQ: 4-6 questions a skeptical stranger would actually ask, answered honestly, including real limitations rather than glossing over them

Every claim honest to what exists. Nothing deferred, and no security or privacy claims beyond what the security baseline actually specifies.

Write the result to .specify/memory/marketing.md.
```

## 3.3 Deploy

> **Type** — paste-in prompt
> **Reads** — `constitution.md`, `security-baseline.md`, feature plans
> **Writes** — nothing. It's a walkthrough you follow
> **When** — at each deployment

```
You're a senior engineer walking me through a production deployment.

Read the constitution, security-baseline.md, and every feature's plan.md.

1. Final checks — name the specific environment variables, the specific tables needing RLS verified in production, and the specific legal pages. This project's checklist, not a generic one
2. What to test immediately after it's live, based on what was actually built
3. What to watch in the first 48 hours, and specifically where to watch it given the error tracking in place
```

---

# Phase 4 — Post-launch

## 4.1 Change gate (custom — run before any post-launch work)

> **Type** — paste-in prompt, or the `change-gate` agent
> **Reads** — `constitution.md`, `product-brief.md`, existing feature specs
> **Writes** — nothing. Returns a GO, NO-GO, or NOT YET verdict
> **When** — once per proposed change, before any building

```
You're a skeptical product manager defending the product's focus and the maintainer's time. Most proposed changes to a working product should not be built. Don't default to yes. You cannot write code — a gate that implements what it just justified isn't a gate.

CHANGE OR ENHANCEMENT: [one or two sentences]
WHERE IT CAME FROM: [specific user request, support pattern, my own idea, analytics, competitor has it]

Read the constitution and the existing feature specs.

1. Evidence — a pattern across users, or one loud voice? Observed behaviour or stated preference?
2. Alignment — does this strengthen the product's core, or pull sideways?
3. Already deferred — was it explicitly deferred before? What's actually changed beyond someone asking?
4. Already covered — a variation on something built, or a fix rather than an addition? Fixing beats adding
5. Real cost — new tables, new RLS policies, new legal considerations, changes to existing features
6. Maintenance burden — what does this permanently add to what must keep working? Solo maintenance compounds
7. Cost of not building — concretely, what happens if this never ships? If the answer is "nothing much," that's the answer
8. Cheaper alternative — a smaller change, a copy change, a documentation fix?

Verdict: GO, NO-GO, or NOT YET. NOT YET requires a specific trigger condition — a vague "maybe later" is a NO-GO in disguise and how backlogs become graveyards. If GO, give the one sentence of justification that still holds in three months.
```

## 4.2 Building an approved change

> **Type** — paste-in prompt for the impact analysis, then the native Phase 1 cycle
> **Reads** — the affected feature's `spec.md` and `plan.md`, and the code
> **Writes** — the analysis writes nothing; the follow-up `/speckit.specify` updates the spec
> **When** — after a GO verdict

A new feature starts a fresh Phase 1 cycle — `/speckit.specify` and onward.

A change to **existing** behaviour needs an impact analysis Spec Kit doesn't provide, run before touching the spec:

```
You're a senior engineer modifying working code that other parts of the system depend on. The risk isn't building the wrong thing — it's breaking something adjacent that works.

CURRENT BEHAVIOUR: [what it does today]
DESIRED BEHAVIOUR: [what it should do]
WHY: [the reason — this often reveals a smaller change solving the same problem]

Read the relevant feature's spec.md and plan.md, and inspect the code. Report only, then stop:

1. Every component, hook, route, table, and policy that touches what's changing
2. Every other feature consuming it — a shared component or column change ripples, one page's copy doesn't. Say which this is
3. What currently works that must still work afterward. Specific entries only; vague ones catch nothing
4. Which requirements in the existing spec.md this makes false
5. Anything making this bigger than it sounds — a schema change, a shared signature change, a new permission case, an RLS policy that no longer matches

Wait for my confirmation, then I'll run /speckit.specify to update the spec before any code changes.
```

Once confirmed, update the spec through `/speckit.specify` and re-run the Phase 1 cycle from there. The spec stays the source of truth — changing code without changing the spec is how drift starts.

**If the product is live**, the constitution's migration rule applies, and add: a checkpoint before changes, non-destructive migrations with an explanation of what happens to existing rows, a statement of what current users will notice, and a rollback plan.

---

## What's native and what isn't

| Concern | Native Spec Kit | Custom prompt |
|---|---|---|
| Product brief / the idea | — | 0.2 |
| Project principles | `/speckit.constitution` | — |
| Requirements | `/speckit.specify`, `/speckit.clarify` | — |
| Requirement quality gate | `/speckit.checklist` | — |
| Architecture | `/speckit.plan` | — |
| Task breakdown | `/speckit.tasks` | — |
| Cross-artifact consistency | `/speckit.analyze` | — |
| Implementation | `/speckit.implement` | — |
| Implementation completeness | `/speckit.converge` | — |
| Bug triage | `bug` extension | — |
| Security review | — | 0.3, 1.3 |
| Legal & compliance | — | 0.3 |
| Brand & design system | — | 0.4 |
| Loose-ends sweep | partial (`converge`) | 1.10 |
| Pre-launch audit | partial (`analyze`) | 3.1 |
| Marketing | — | 3.2 |
| Deployment | — | 3.3 |
| Post-launch change control | — | 4.1, 4.2 |
| Design craft and distinctiveness | — | `frontend-design` skill |
| Current R3F and postprocessing APIs | — | `three-agent-skills` skill |

**If you run this repeatedly**, the custom prompts are worth promoting into Spec Kit primitives rather than pasting: **extensions** add new commands, **presets** override command and template files to enforce standards without changing tooling, and **workflows** chain commands, prompts, shell steps, and human checkpoints into a resumable sequence. Note the division — custom *steps* belong in extensions, because a sequential process needs deterministic invocation; custom *knowledge* belongs in skills, which load contextually. That would make the whole chain a single installable thing — but only build it after the paste-in version has actually earned its keep on a real project.
