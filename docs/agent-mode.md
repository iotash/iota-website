---
id: agent-mode
title: Agent mode
description: workspace true — AGENTS.md overlays, Agent Skills, load_skill, and project-scoped sessions.
sidebar_label: Agent mode
---

# Agent mode

Agent mode is explicitly opt-in — set `workspace: true` on an agent in the
config file. Off, the agent runs with just its own prompt and tools: no project
overlay, no skills, no project-scoped sessions.

```yaml
agents:
  claude:
    models: ["anthropic:claude-sonnet-4-20250514"]
    workspace: true
```

Everything is anchored at the **project root**: the git root of the working
directory, or the working directory itself outside a repository.

## AGENTS.md

Following the [AGENTS.md convention](https://agents.md/), every `AGENTS.md`
from the project root down to the current directory (at most one per
directory) is concatenated root-first — nearer files come later and override —
capped at 32 KiB, and appended to the system prompt as a **volatile overlay**:
composed at send time, never stored in the conversation history or the session
file, and re-read automatically when a file changes between turns (a dim
`AGENTS.md reloaded` notice is printed). Resuming a session elsewhere applies
that directory's `AGENTS.md`.

## Skills

Skills follow the [Agent Skills specification](https://agentskills.io/specification):
a skill is a directory containing a `SKILL.md` with `name` and `description`
frontmatter. Discovery directories, highest precedence first (same-name skill:
higher wins):

1. `<project root>/.agents/skills/` — project skills
2. `~/.iota/skills/` — iota user skills
3. `~/.agents/skills/` — cross-client user skills

Discovered skills are advertised to the model as a name + description catalog
inside the overlay; the model activates one by calling `load_skill` with the
skill's name, reads files the skill references through the same tool's `file`
argument, and runs bundled scripts through `bash` (enable the `shell`
toolset for the agent if your skills need scripts). Invalid skills are
skipped with a warning, never fatal. You can also run a skill yourself with
`/skills <name> [instructions]` — the skill's instructions become the message
that is sent.

## `skills` — `load_skill`

Agent mode auto-enables the `skills` toolset (it was called `agent` before the
config split, where the word became the name of a layer). Its `load_skill` tool activates a skill by name: it returns the
skill's instructions (the `SKILL.md` body) and directory, and the optional
`file` argument reads a file bundled inside that directory — reads never leave
the skill's directory. Output is size-capped with an optional `offset`/`limit`
line window. The set can also be enabled explicitly under `tools:` like any
other, agent mode or not.

## Child agents

iota has no delegation tool: a child agent is `iota run <agent> -m "<task>"`
run from `bash`. It is a full run of that `agents:` entry — its own model,
tools, MCP servers and session. See [child
agents](./builtin-toolsets.md#child-agents) in the `shell` toolset.

## Project-scoped sessions

Sessions started in agent mode are stored per project under
`~/.iota/sessions/projects/<slug>/`, and `/session` and `iota resume` list
only the current project's sessions there (`iota resume <id>` with an id from
anywhere still works). Normal-mode sessions stay in the flat global store,
whose list also shows every project's sessions labelled with their project —
nothing is ever invisible.
