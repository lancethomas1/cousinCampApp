# Using BMAD on the Cousin Camp app

This repo has [BMAD-METHOD](https://bmadcode.com/) v6 (`bmm` module) installed and
wired for Claude Code. BMAD is a set of role-playing AI agents that turn an idea
into shippable code through structured documents, so the agent that writes the
code always has full context.

## What got installed

| Path | What it is |
|------|------------|
| `_bmad/` | The framework: agents, workflows, templates, config. Treat as read-only (the installer regenerates it). |
| `_bmad/custom/` | Your team's pinned overrides + custom agents (personal config here is gitignored). |
| `.claude/skills/bmad-*` | 44 Claude Code skills — the agents and workflows you invoke. |
| `_bmad-output/planning-artifacts/` | PRDs, briefs, UX, architecture, epics (created on first use). |
| `_bmad-output/implementation-artifacts/` | Stories, reviews, sprint status, retrospectives. |
| `docs/` | Long-term project knowledge (this guide, the brownfield project doc). |

## The agents

| Skill | Persona | Role |
|-------|---------|------|
| `bmad-agent-analyst` | Mary 📊 | Brainstorming, research, briefs |
| `bmad-agent-pm` | John 📋 | PRD + epics |
| `bmad-agent-architect` | Winston 🏗️ | Architecture |
| `bmad-agent-ux-designer` | Sally 🎨 | UX spec |
| `bmad-agent-dev` | Amelia 💻 | Implements one story at a time |
| `bmad-agent-tech-writer` | Paige 📚 | Docs |

Not sure where to start? Invoke **`bmad-help`** and ask.

## Workflow for THIS app (brownfield)

Cousin Camp already exists — a no-build, vanilla-JS static site (campers' app in
`index.html`/`app.js`, grown-ups' app in `parent.html`/`parent.js`, shared model
in `core.js`, all content in `data.js`, Firestore for shared mode). So start by
capturing the current state, then plan changes on top of it.

1. **Document the project** — run `bmad-document-project` so every later agent
   understands the two-app structure, the `data.js` content model, and the
   Firestore single-doc sync.
2. **Plan** — `bmad-product-brief` → `bmad-create-prd` for the next batch of
   features. Validate with `bmad-validate-prd`.
3. **Architecture** — `bmad-create-architecture`, respecting the hard constraints:
   **no build step**, static hosting (GitHub Pages), `core.js` as the shared model.
4. **Break down** — `bmad-create-epics-and-stories` (or `bmad-shard-doc`) to split
   the PRD into small, dev-ready stories.
5. **Build the loop** — per story: `bmad-create-story` → `bmad-dev-story`
   (Amelia implements; serve with `npm run serve`) → `bmad-code-review`. Track
   with `bmad-sprint-status`; close out with `bmad-retrospective`.

For a tiny one-off change, `bmad-quick-dev` skips the full ceremony.

## A good first epic

**"Mimi's content editor"** — replace hand-editing `data.js` with an in-app admin
screen — splits cleanly into stories (edit schedule activities, manage the cousin
roster + photos, manage cooking crews), each touching the `data.js` model plus one
new view. A natural first slice to drive through the loop above.
