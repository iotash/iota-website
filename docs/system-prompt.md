---
id: system-prompt
title: The system prompt
description: What iota sends as the system message — the built-in harness ahead of your prompt, the environment block, the iota_cli block, the AGENTS.md chain and the skills catalog — with the structure and the full text.
sidebar_label: The system prompt
---

<!-- verbatim from iota src/agents/harness.rs @ e29e417 — update when it changes -->

# The system prompt

The system message a run sends is not your `system:` alone. As of v0.3.2, an
agent with `tools:` gets a short **harness** paragraph of iota's own ahead of
it — who the model is running inside, what the machine looks like, and (with
the `shell` set) how iota's own command line is driven — and an agent with
`workspace: true` gets the AGENTS.md chain and the skills catalog after it.
This page is the structure, then the text, then the rules. It is composed at
send time and never stored, so what you read here is what the wire carries; the
same composition is what `/model`'s **System** tab shows.

## Structure

Top to bottom, a blank line between segments:

| Segment | Content | Sent when | Source |
|---|---|---|---|
| preamble | two sentences of identity and two behaviour rules (below, verbatim) | the agent's `tools:` names at least one built-in set and does not write it `false` | `src/agents/harness.rs` (`PREAMBLE`, `compose`) |
| `<environment>` | one `key: value` line per fact: project root, platform, shell, date, the `iota` binary, the config files | same as the preamble | `harness.rs` (`environment_block`), `src/cmd/assemble.rs` (`harness_environment`) |
| `<iota_cli>` | iota's own verbs and the three rules for changing its configuration | the `shell` set is among those `tools:` keys | `harness.rs` (`IOTA_CLI`) |
| `<instructions>` | your `system:` / `system_file:` / `-s`, verbatim | you wrote one and it is not empty; with **no** harness the prompt is sent bare, untagged | `src/agents/mod.rs` (`compose_send_history`) |
| AGENTS.md chain | every `AGENTS.md` from the project root down to the working directory, root first, joined by a blank line — **no tag** wraps it | `workspace: true` and at least one `AGENTS.md` exists on the path | `mod.rs` (`load_agents_chain`, `Overlay::content`) |
| `<available_skills>` | one instruction sentence, then a `<skill>` entry per discovered skill | `workspace: true` and discovery found at least one valid `SKILL.md` | `src/agents/skills.rs` (`skills_catalog`, `SKILLS_CATALOG_INSTRUCTION`) |

The first three segments are the harness; the last two are the **overlay** of
[agent mode](./agent-mode.md). Any segment whose condition fails is left out
entirely — no empty tag, no placeholder — and when nothing qualifies (a
chat-only agent with no `workspace:`) the system message is your prompt exactly,
or no system message at all if you wrote none.

## The text

### The preamble

```text
You run inside iota, a coding agent in the user's terminal, acting on their project through the tools you are given. Report what you did and found.
A tool call the user declines is not retried: say what it was for and ask. A command failing with `Operation not permitted`, a write outside the project or no network was stopped by the sandbox, not wrong in itself — say so instead of rewriting it.
```

### `<environment>`

An example, in the shape a Homebrew install on a Mac produces:

```text
<environment>
project root: /Users/someone/Work/project
platform: macos (aarch64)
shell: bash
date: 2026-09-20
iota binary: /opt/homebrew/Cellar/iota/0.3.2/bin/iota
user config: /Users/someone/.iota.yaml
project config: /Users/someone/Work/project/.iota.yaml
</environment>
```

Every fact is read once at the binary edge (`cmd/assemble.rs::harness_environment`)
and handed to the composition as plain data — the prompt never probes the
machine itself:

| Line | Value | Where it comes from |
|---|---|---|
| `project root:` | the first directory from the working directory upward with a `.git` entry (a directory, a linked worktree's file, or a dangling symlink all count), else the working directory itself | `agents::project_root` over the run's cwd |
| `platform:` | `OS (arch)`, from the Rust `std::env::consts` pair — `macos (aarch64)`, `linux (x86_64)`, `windows (x86_64)` | `harness::platform` |
| `shell:` | the interpreter the `shell` set would run, by file stem: `bash`, `zsh` (with `IOTA_SHELL`), `pwsh`, `powershell`, `cmd`; `(none)` when none resolved | `shell::interp::resolve` — the same answer the [shell tool's description](./builtin-toolsets.md#which-shell-runs-it) follows |
| `date:` | today's local date, `YYYY-MM-DD` | `harness::today` |
| `iota binary:` | the running executable, canonicalised — symlinks resolved, so a Homebrew `bin/iota` reads as its `Cellar/…` target; `(unknown)` when the OS could not say | `HostDirs::exe` |
| `user config:` | `~/.iota.yaml`, else `~/.iota.yml`, whichever exists; `(absent)` when neither does | `Config::find_config_file` over the home directory |
| `project config:` | `./.iota.yaml`, else `./.iota.yml`, in the **working directory** (not the project root); `(absent)` when neither does | `Config::find_config_file` over the cwd |

A run started with `-c` has one scope and not two, so the last two lines
collapse into one — a relative `-c` path is made absolute against the cwd
first, because the model may read it from another directory:

```text
config: /Users/someone/Work/project/ci.yaml (given with -c; the only scope)
```

### `<iota_cli>`

Appended, after a blank line, when the `shell` set is on:

```text
<iota_cli>
iota itself runs OUTSIDE the shell sandbox when it is the command's first word (plain `iota …`, no pipe or chain). It manages its own configuration:
- iota mcp add <name> --url <url> [--header 'K: V'] [--scope user|project] — writes the entry and logs in through the browser if needed; run with background: true
- iota mcp add <name> -- <command> [args]
- iota mcp list [--probe] | get | remove | login (background: true) | logout <name>
- iota config check | path | init
- iota list agents | models | providers
- iota run <agent> -m "<task>" — a child agent under its own agent config
Change MCP servers with `iota mcp`; providers, models and agents by editing the config file, then `iota config check`. Changes apply from the next session, not this one. Flags: `iota <verb> --help`.
</iota_cli>
```

The first sentence is the [sandbox exception](./builtin-toolsets.md#the-iota-exception)
stated from the model's side; the verbs are the ones a model has a reason to
run on your behalf. It is text, not a tool: the model runs them through the
`shell` tool like any other command.

### `<instructions>`

Your own prompt — `system:`, else `system_file:`, either replaced by `-s` for
one run — rides inside the tag exactly as written:

```text
<instructions>
You are a careful coding assistant.
</instructions>
```

An empty prompt (`-s ""`, an agent with neither key) produces no block at all
rather than an empty one. `-s` replaces this segment only: the harness and the
overlay are not yours to override from the command line, and there is no
configuration key that changes them.

:::note

The tag is part of the **harness** composition. An agent without `tools:` —
where no harness is sent — has its prompt sent bare, untagged, with the
overlay appended after a blank line when there is one: byte for byte what a
chat-only agent sent before the harness existed.

:::

### The AGENTS.md chain

With `workspace: true`, every `AGENTS.md` from the project root down to the
working directory (at most one per directory, root first, nearer files later
so they override) is read, each trimmed of trailing newlines, and joined by a
blank line. A working directory outside the root — or the root itself —
contributes the root's file alone. The chain is appended **verbatim and
untagged** after the `</instructions>` line (or straight after the harness when
you wrote no prompt).

The concatenation is capped at **32 KiB**: no single file is read past that
many bytes, and when the joined text is longer it is cut at a character
boundary and this marker is appended, exactly:

```text
<!-- AGENTS.md chain truncated at 32 KiB -->
```

A file that exists but cannot be read still counts as a chain member (it shows
in the startup banner's file count) and contributes no text.

### `<available_skills>`

With `workspace: true` and at least one valid skill under the [discovery
roots](./agent-mode.md#skills), the catalog closes the message: the
instruction sentence, a blank line, then the block.

```text
To use a skill, call the load_skill tool with the skill's name and follow the instructions it returns; read files the skill references by calling load_skill again with the "file" argument, and run its bundled scripts with the shell tool.

<available_skills>
<skill>
<name>commit-helper</name>
<description>Writes a conventional commit message from the staged diff.</description>
</skill>
<skill>
<name>release-notes</name>
<description>Turns a range of commits into a changelog entry.</description>
</skill>
</available_skills>
```

Each entry is the skill's frontmatter `name` and `description`, both
XML-escaped (`&`, `<`, `>`) so a description cannot close the block and plant
text outside it. Skills are listed in discovery order — project root first,
then `~/.iota/skills`, then `~/.agents/skills`, alphabetically within each
root — and the catalog is capped at **32 KiB**: an entry that would push it
past the cap is skipped (a later, shorter one may still fit), and the number
skipped is written into the block before the closing tag:

```text
<note>3 more skill(s) omitted: catalog size cap reached</note>
</available_skills>
```

The whole overlay — chain, catalog, or chain + blank line + catalog — is
re-read when a file on the path changes between turns (the dim `AGENTS.md
reloaded` notice), so what a turn sends is always the files as they are.

## The rules

- **Composed at send time, never stored.** The harness and the overlay are
  rebuilt on every request from the current binary and the current files; only
  your own prompt is written into the session. A resumed session and an
  upgraded binary both send the current version, and a session never changes
  shape halfway because a file on disk did — except the overlay, which is
  meant to.
- **`/model`'s System tab shows the composed text**, not your `system:` — it
  renders the same function the wire uses, so it is the one place to see
  exactly what the model reads.
- **No configuration key.** The trigger is `tools:` itself: a key naming a
  built-in set (`shell`, `code`, `skills`, `ask`) and not written `false`.
  `tools: {ask: false}` alone sends nothing; so does an unknown set name (a
  warning, not a set). Sets iota enables on its own — `skills` under
  `workspace: true`, `ask` in an interactive run — do not count unless you also
  wrote them.
- **An agent without `tools:` sends nothing extra.** A chat-only agent or a
  JSON pipeline puts exactly its own bytes on the wire, as it always did.
- **Under 1.5 KB.** The harness, environment included, stays within
  `HARNESS_CAP` (1536 bytes) — a paragraph that is overhead on every request
  has to earn its size, and a test pins the ceiling.

Why there is a harness at all: every neighbour — Claude Code, Codex, Gemini
CLI, OpenCode — puts a paragraph of its own ahead of the user's prompt, and
without one a fresh install with `code` and `shell` did not know it could run
`iota mcp add`. The trigger is `tools:` rather than a key because the users who
need `<iota_cli>` most are the starter config's, whose `workspace:` is commented
out — and because an agent without tools is a chat or a pipeline whose bytes
must not change.

## See also

- [The config file](./config-file.md) — the three layers, and where `system:`
  and `workspace:` live.
- [Configuration reference](./config-reference.md) — every key, one by one.
- [Agent mode](./agent-mode.md) — the AGENTS.md convention and skill discovery.
- [Built-in toolsets](./builtin-toolsets.md) — what the tools the preamble
  refers to actually do.
