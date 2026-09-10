---
id: builtin-toolsets
title: Built-in toolsets
description: shell, code, skills and ask — what each set can do, and what it asks before doing it.
sidebar_label: Built-in toolsets
---

# Built-in toolsets

Besides MCP servers, iota ships built-in tools grouped into named
**toolsets** that you enable per agent in the config file. A toolset is
enabled by listing it under that agent's `tools:` key; the value is the
set's shared configuration, and an empty value uses its defaults. Available
sets: `shell` (running bash commands, sandboxed), `code` (reading, searching,
and editing project files), `skills` (skill activation; auto-enabled by agent
mode), and `ask` (interactive questions to the user; enabled by default in
interactive sessions — disable with `ask: false`).

```yaml
agents:
  claude:
    models: ["anthropic:claude-sonnet-4-20250514"]
    tools:
      shell:                 # empty → sandboxed, network blocked
      code:

  coder:
    models: ["openai:gpt-4o"]
    tools:
      shell:
        network: true        # allow network inside the sandbox
        write: [~/.cache]    # extra sandbox-writable paths
```

## `ask` — `choose`, `confirm`

Lets the model put a decision to you on an interactive selector instead of
asking in prose — and, crucially, WITHOUT ending its turn: the answer flows
back as a tool result and the same agentic round continues. `choose` packs
1–4 questions into a tabbed surface (short headers as tab labels; Tab
switches, one Enter commits all; single- or multi-select per question, and an
"Other…" free-text answer unless the model disables it). `confirm` is a
single yes/no. ESC declines — the model is told and proceeds on its own.
Zero side effects, on by default interactively, absent in `-m` runs; opt out
per agent with `tools: {ask: false}`.

## `shell` — `bash`

Lets the model run real bash command lines — pipes, redirects, `&&` chaining,
heredocs — and returns their combined stdout/stderr. The model calls it with
`command` (required), an optional `cwd` (defaults to the project root), an
optional `timeout` in seconds (default 600, maximum 3600; outside that range
the call is refused and nothing runs) and an optional `background` (below).

Safety model — the same one Claude Code and Codex CLI use:

- **OS sandbox by default.** On macOS commands run under Seatbelt
  (`sandbox-exec`, built into the system); on Linux under
  [bubblewrap](https://github.com/containers/bubblewrap) (`bwrap`, if
  installed). Inside the sandbox, file **writes are confined to the project
  root plus temp/cache directories** (add more via `write:`), and **network
  access is blocked** unless `network: true`.
- **Sandboxed calls run without prompting.** Where no sandbox is available
  (Linux without bwrap) or with `sandbox: off`, every call instead
  asks for confirmation in the chat (allow once / allow for this session /
  deny), and non-interactive `-m` runs reject it — set `auto_run: true` to
  waive that.
- Output is capped at 32 KB and 512 lines (head + tail kept, middle elided,
  bounded even while streaming). Each call is capped at **10 minutes** unless
  it asks for a different `timeout`; while a command runs, the status-line
  spinner shows the elapsed time — press **ESC** (or Ctrl+C) to terminate it.
- **Calls issued together run concurrently.** A round's consecutive `bash`
  calls execute as one batch — ESC cancels the batch, and results still come
  back in call order. (Every other toolset keeps the conservative rule: only
  calls that cannot change state batch.)

### Background jobs

`"background": true` starts the command and returns at once with a job id,
its pid and an output file:

```
Started background job b1 (pid 4242). Output: /tmp/iota-jobs/931/b1.log
A notice with its exit status and output arrives when it finishes; run
`tail -n 50 /tmp/iota-jobs/931/b1.log` to see progress meanwhile.
```

When the job ends, its result enters the conversation on its own as a
**notice** — the model is told, it never polls:

```
[background job b1 finished: exit 0 after 42s] make test
<the job's output, under the same 32 KB / 512 line caps a foreground call gets>
```

If you are sitting at the prompt, the notice wakes the model for one turn (your
half-typed draft is untouched). If a turn is already running, it lands at the
next round boundary, like a message you typed while the model was working. In
`-m` runs the run does not end while a job is still going: the loop waits for
it, hands the model the notice and gives it another round — each one counted
against `--max-turns`.

Up to **16** jobs at a time (past that the call is refused), `timeout` applies
the same way, and the approval rules are unchanged. The log file is left on
disk. **Background jobs are killed when iota exits** — `/quit`, Ctrl+C at the
prompt, or the end of a `-m` run — so a resumed session never inherits one; a
job that must survive that has to detach itself (`nohup`, `setsid`).

### Child agents

iota has no delegation tool: a child agent is `iota <agent> -m "<task>"` run
from `bash`, which is why the set is the one that matters most. The child is a
full run of that `agents:` entry — its own model, tools, MCP servers and
session. Start it with `background: true` and its answer comes back as the
notice above. For it to write without a user to ask, set
`tools.code.auto_write` / `tools.shell.auto_run` on that agent; for it to
reach an API at all, the parent's sandbox has to allow it, since
`network: false` (the default) blocks the child's HTTP too. How to dispatch,
to whom, and how many at once is your prompt's business, not the binary's.

## `code` — coding tools

The coding loop: `glob` and `grep` locate files (`.git`, `.gitignore` matches,
and binaries excluded), `list_dir` explores, `read_file` returns line-numbered
content, and `edit_file` (exact, unique string replacement) / `write_file`
change files. Everything is confined to the **project root** (the git root of
the working directory). Verification — builds, tests — goes through the
`shell` set's `bash`, so enable it alongside.

Safety model:

- A file must be **read before it can be modified**, and a file that changed
  on disk since it was read must be re-read first — the model can never
  blind-overwrite your edits.
- Every modifying call asks for confirmation in the chat (allow once / allow
  for this session / deny). Non-interactive `-m` runs reject modifications
  outright. Set `auto_write: true` under `tools: code:` to skip confirmations
  and allow `-m` writes:

```yaml
    tools:
      code:
        auto_write: true   # optional; default asks before every write
```

Or withhold the writers entirely with `read_only: true`, leaving `glob`,
`grep`, `list_dir` and `read_file`. A tool the model cannot see is never
attempted and never refused — useful for a reviewer. (`read_only` and
`auto_write` together are rejected as contradictory.)
