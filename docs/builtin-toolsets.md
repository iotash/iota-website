---
id: builtin-toolsets
title: Built-in toolsets
description: shell, code, skills and ask — every configuration key of each set, every parameter of every tool, what asks for approval, what runs in parallel, and what the model is told when a call fails.
sidebar_label: Built-in toolsets
---

# Built-in toolsets

Besides MCP servers, iota ships built-in tools grouped into named
**toolsets** that you enable per agent in the config file. A toolset is
enabled by listing it under that agent's `tools:` key; the value is the set's
shared configuration, and an empty value uses its defaults. There are four:
`shell` (running shell commands, sandboxed), `code` (reading, searching and
editing project files), `skills` (skill activation; auto-enabled by
`workspace: true`), and `ask` (interactive questions to the user; on by default
in interactive sessions — disable with `ask: false`).

```yaml
agents:
  claude:
    model: "anthropic:claude-sonnet-4-20250514"
    tools:
      shell:                 # empty → sandboxed, network blocked
      code:

  coder:
    model: "openai:gpt-4o"
    tools:
      shell:
        network: true        # allow network inside the sandbox
        write: [~/.cache]    # extra sandbox-writable paths
      code:
        auto_write: true     # no confirmation before edit_file/write_file
      ask: false             # no choose/confirm, even interactively
```

Each set below is documented the same way: its configuration keys, then one
section per tool under **the name the model sees**, with every parameter, the
approval rule, whether calls may run in parallel, how a call is shown in the
chat, the output cap, and the text the model reads when the call fails. Three
facts hold for all of them:

- **Key presence enables a set**; any YAML-1.1 false spelling (`false`, `no`,
  `off`) disables it. A set name that is not one of the four fails the config
  load; a set whose value does not decode is a startup warning (`toolset
  "shell": … (ignored)`) and the set is left out.
- **Approval** is a per-call question. Interactively the answer is allow once /
  allow for this session / deny; a denied call does not run and the model is
  told so. A non-interactive `-m` run has nobody to ask and refuses every gated
  call with: `<tool> was not executed: it requires interactive approval, which
  is unavailable in this non-interactive run. Set the toolset's auto-approve
  option (tools.code.auto_write / tools.shell.auto_run) to permit it here.`
- **Parallelism**: the calls a round issues together run concurrently only when
  every one of them says it may; results come back in call order regardless.
- **Presentation** is one of three: *Group* (folded into the activity panel),
  *Expanded* (a standalone block — the writers, with their diff), *Surface*
  (the call puts its own widget in front of you — the `ask` tools).

MCP tools are not covered here: their names (`mcp__<server>__<tool>`) and
deferred loading are on [MCP servers](./mcp.md). Naming at least one set under
`tools:` is also what makes iota send its [harness prompt](./system-prompt.md).

## `shell`

Lets the model run real shell command lines — pipes, redirects, `&&` chaining,
heredocs — and returns their combined stdout/stderr. One tool, `shell`, on
every platform and under every interpreter.

### Configuration

| Key | Type | Default | Meaning |
|---|---|---|---|
| `sandbox` | `auto` \| `off` | `auto` | `auto` sandboxes every call when the OS has a sandbox (Seatbelt on macOS, bubblewrap on Linux) and runs unsandboxed with approval where it has none; `off` never sandboxes. An empty value reads as `auto`; anything else refuses the set: `sandbox must be "auto" or "off", got "on"` |
| `network` | boolean | `false` | whether sandboxed commands may use the network. Meaningless without a sandbox |
| `auto_run` | boolean | `false` | run every call without approval, sandboxed or not — including the [iota exception](#the-iota-exception) and every call of an unsandboxed set. What makes `-m` runs able to use the tool where no sandbox exists |
| `write` | list of paths | `[]` | extra directories the sandbox may write to. A leading `~` (alone or `~/`) is the home directory; a relative path is made absolute against the process working directory; empties are dropped |

A value that is not a mapping is refused: `config must be a mapping (sandbox,
network, auto_run, write): <decode error>`. On Windows a machine with no
interpreter at all refuses the set too — `no shell interpreter found: tried Git
Bash (install Git for Windows or set IOTA_GIT_BASH_PATH), pwsh.exe,
powershell.exe and cmd.exe — set IOTA_SHELL to name one` — where Unix registers
the tool whatever `PATH` holds and reports a missing `bash` per call. Whether
the set is sandboxed is decided **once**, at startup: a sandbox binary
appearing or disappearing later has no effect on the run.

### `shell`

Runs one command line in a fresh interpreter and returns its combined output.
Nothing carries over between calls — environment variables, functions, aliases
and `cd` all reset — so anything a later command depends on must be repeated in
it.

| Parameter | Type | Required | Meaning |
|---|---|---|---|
| `command` | string | yes | the command line, in the dialect of the interpreter that will run it (the description tells the model which). Empty: `missing required argument: command` |
| `cwd` | string | no — the project root | the working directory. A relative path is resolved against the project root; an absolute one is accepted as written, outside the root included — there is no jail, and a directory that does not exist surfaces as the spawn error |
| `timeout` | integer | no — `600` | the wall-clock cap in seconds, `1`–`3600`. Outside that range — a non-number reads as `0` — the call is refused and nothing runs: `timeout must be between 1 and 3600 seconds`. One number cannot serve both a lint and a child agent's whole run, so the model picks, inside a ceiling it cannot argue with |
| `background` | boolean | no — `false` | start the command and return at once with a job id (see [Background jobs](#background-jobs)) |

**Approval**: with `auto_run: true`, never. Otherwise every call of an
unsandboxed set (no sandbox on the machine, or `sandbox: off`), and in a
sandboxed set only the call that [leaves it](#the-iota-exception).
**Parallel**: always — a round's consecutive `shell` calls run as one batch,
results in call order — with one exception: a sandboxed set's iota call that
must be asked about takes the serial path, because the batch has no approval
gate. (Every other toolset keeps the conservative rule that only read-only
calls batch; here the model wrote both command lines, and `&`/`wait`/`xargs
-P` inside one call were never gated either.) **Presentation**: Group; the
header is the command itself — `[shell git status]` — with an explicit `cwd`
folded into the interpreter's idiom (`cd <path> && <cmd>`; `cd <path>; <cmd>`
under PowerShell), `(background)` in front of a background call and `(outside
the sandbox)` after an iota call.

**Output cap**: 32 KB and 512 lines, both bounded while the command streams.
Past 512 lines the first 128 and the last 384 are kept around `[... N lines
omitted — pipe through head/tail/grep to narrow the output ...]`; past 32 KB
the first 8 KB and the last 22 KB around `[... N bytes omitted ...]`. While a
command runs the status-line spinner shows the elapsed time; **ESC** (or
Ctrl+C) terminates it.

**What the model reads**, in the order the cases are checked:

| Outcome | Result |
|---|---|
| could not start, no output | `failed to run: <error>` (error) |
| could not start, some output | `<output>` + `[failed to run: <error>]` (error) |
| `timeout` expired | `<output>` + `[command timed out after 10m0s]` — the number the call ran under (error) |
| ESC / cancelled | `<output>` + `[command cancelled]` (error) |
| exit code ≠ 0 | `<output>` + `[exit code N]` (error) |
| exit 0, nothing printed | `[command produced no output]` |
| exit 0 | the output |

### The sandbox

The same safety model Claude Code and Codex CLI use — an OS sandbox by default,
and approval where there is none:

- **macOS**: Seatbelt, through the system's own `/usr/bin/sandbox-exec`.
  **Linux**: [bubblewrap](https://github.com/containers/bubblewrap) (`bwrap`
  on `PATH`, if installed). **Windows**: no sandbox exists; every call runs
  with your permissions and asks unless `auto_run` waives it.
- **Writes are confined** to this set of directories, in this order, duplicates
  dropped: the project root; the run's temp directory; `/tmp`; the cache
  directory (created if missing); then every `write:` path, made absolute.
  Everything else fails inside the command with a permission error
  (`Operation not permitted`), which the [harness prompt](./system-prompt.md)
  tells the model to report rather than work around.
- **Network is blocked** unless `network: true`.
- **Sandboxed calls run without prompting.** Where no sandbox is available or
  with `sandbox: off`, every call asks instead (allow once / allow for this
  session / deny), and `-m` runs refuse it — `auto_run: true` waives both.

The tool's description tells the model which regime it is in: `Commands run
inside an OS sandbox: file writes are confined to the project root and
temp/cache directories (writes elsewhere fail with permission errors), and
network access is BLOCKED.` — or `…is allowed.` with `network: true` — versus
`Commands run WITHOUT a sandbox on this system, with the user's full
permissions — be conservative.`

### The iota exception

One command line leaves a sandboxed set: **iota itself**. A call whose first
word is the running binary — `iota mcp add …`, `iota mcp login <name>`, a child
agent's `iota run <agent> -m "<task>"`, `/opt/homebrew/bin/iota …` — is spawned
without the sandbox, because what it does (write a config file in `$HOME`, open
a browser, reach an API) is exactly what the sandbox exists to refuse, and the
binary is one you installed. The rule is conservative by construction:

- the **first word**, read with POSIX quoting (`'…'`, `"…"`, `\`), must resolve
  — an absolute or relative path as written, a bare name on `PATH` — to the
  same canonical file as the running binary; a build the OS cannot locate
  (`iota binary: (unknown)` in the environment block) lets nothing out;
- the rest of the line must be **one simple command**: a pipe (`|`), a chain
  (`&&`, `||`, `;`, `&`), a newline, a command substitution (`$(…)`, a
  backtick) anywhere outside single quotes keeps the whole line in the sandbox
  (`iota mcp list | head` stays in). Redirections (`>`, `<`, `2>&1`, `&>`) are
  allowed: they change where iota's output goes, not what runs.

The only effect is the missing sandbox: `network:` and `write:` are the
sandbox's settings and do not apply. **Approval is not waived**: a sandboxed
set without `auto_run` asks about such a call the way an unsandboxed set asks
about every call, and the prompt and the call header carry `(outside the
sandbox)` — what you are being asked is not "may this run" but "may this run
where the others do not". Windows and `sandbox: off` have nothing to leave.

### Which shell runs it

`bash -c` on macOS and Linux, always. On Windows iota embeds no interpreter and
takes the first one the machine has — Git Bash, then PowerShell (`pwsh.exe`,
then `powershell.exe`), then `cmd.exe`; see
[Platforms](/docs/install#platforms). Two environment variables decide it:

| Variable | What it does |
|---|---|
| `IOTA_SHELL` | The interpreter for every shell call: an absolute path, or a name on `PATH`. Honoured on **every** platform, so `IOTA_SHELL=zsh` works on a Mac too. The arguments follow the name — `-c` for the POSIX family, `-NoLogo -NoProfile -NonInteractive -Command` for `pwsh`/`powershell`, `/C` for `cmd`. Naming something unrunnable fails the call rather than falling back |
| `IOTA_GIT_BASH_PATH` | Windows only: where Git Bash's `bash.exe` is, when it is not where the `git.exe` on your `PATH` implies |

The **tool description follows the winner**, so the model writes the dialect
that will actually be read: it is told in the first sentence which shell it is
talking to, and the POSIX advice gives way to PowerShell's (`;` chaining,
object pipelines, `$null`) or cmd's where one of those runs. The `command`
parameter's example moves with it too (`go test ./... 2>&1 | tail -20` becomes
`cargo test 2>&1 | Select-Object -Last 20`).

The **name does not follow it**: the tool is `shell` on every platform and under
every interpreter, as is the config key. Naming it after one dialect is what
goes wrong — a model handed a tool called `bash` and a PowerShell description
writes PowerShell 95% of the time, but one handed `powershell` and a bash
description still writes PowerShell 68% of the time, so the conflict resolves by
whichever slot happens to carry the stronger word. A neutral name plus a
description that names the interpreter avoids the conflict entirely (98% and
100% correct in the same measurements), which is why that first sentence is not
optional.

### Background jobs

`"background": true` starts the command and returns at once with a job id,
its pid and an output file:

```text
Started background job b1 (pid 4242). Output: /tmp/iota-jobs/931/b1.log
A notice with its exit status and output arrives when it finishes; run `tail -n 50 /tmp/iota-jobs/931/b1.log` to see progress meanwhile.
```

The `tail` is the interpreter's own (`Get-Content -Tail 50 …` under
PowerShell, `type …` under cmd), as are the two dialect slots of the paragraph
the model reads about background mode: how to look at a log meanwhile, and how
a job detaches (`nohup`/`setsid`; `Start-Process`; `start /b`).

When the job ends, its result enters the conversation on its own as a
**notice** — the model is told, it never polls:

```text
[background job b1 finished: exit 0 after 42s] make test
<the job's output, under the same 32 KB / 512 line caps a foreground call gets>
```

The status is `exit N after <elapsed>`, `timed out after <elapsed>`, or
`killed`. If you are sitting at the prompt, the notice wakes the model for one
turn (your half-typed draft is untouched). If a turn is already running, it
lands at the next round boundary, like a message you typed while the model was
working. In `-m` runs the run does not end while a job is still going: the
loop waits for it, hands the model the notice and gives it another round —
each one counted against `--max-turns`.

Up to **16** jobs at a time — past that the call is refused with `too many
background jobs running (16); wait for one to finish` — `timeout` applies the
same way, and the approval rules are unchanged. The log file is left on disk,
uncapped, so `tail` still shows everything. **Background jobs are killed when
iota exits** — `/quit`, Ctrl+C at the prompt, or the end of a `-m` run — so a
resumed session never inherits one; a job that must survive that has to detach
itself (`nohup`, `setsid`).

### Child agents

iota has no delegation tool: a child agent is `iota run <agent> -m "<task>"`
run from the `shell` tool, which is why the set is the one that matters most.
The child is a full run of that `agents:` entry — its own model, tools, MCP
servers and session. Start it with `background: true` and its answer comes back
as the notice above. For it to write without a user to ask, set
`tools.code.auto_write` / `tools.shell.auto_run` on that agent. The child runs
outside the parent's sandbox (the [exception](#the-iota-exception) above) and
is isolated by its own agent's configuration — its own `shell` sandbox, its own
approvals — so the parent's `network: false` is not in its way. How to
dispatch, to whom, and how many at once is your prompt's business, not the
binary's.

## `code`

The coding loop: `glob` and `grep` locate files, `list_dir` explores,
`read_file` returns line-numbered content, and `edit_file` (exact, unique
string replacement) / `write_file` change files. Everything is confined to the
**project root** — the git root of the working directory, or the working
directory itself outside a repository. Verification — builds, tests — goes
through the `shell` set, so enable it alongside.

### Configuration

| Key | Type | Default | Meaning |
|---|---|---|---|
| `auto_write` | boolean | `false` | `edit_file` and `write_file` run without approval — and therefore in `-m` runs, which otherwise refuse them |
| `read_only` | boolean | `false` | leave the two writers out entirely: the model sees `glob`, `grep`, `list_dir` and `read_file` alone. A tool the model cannot see is never attempted and never refused — the reviewer's setting |

Both together are refused: `read_only and auto_write contradict each other:
auto_write approves writes the set does not offer`. A value that is not a
mapping: `config must be a mapping (auto_write, read_only): <decode error>`.

Shared by all six tools:

- **The path jail is lexical.** A `path` is resolved against the project root
  (an absolute one is accepted when it lies inside), cleaned, and refused when
  it points outside: `path is outside the project root (/Users/you/project):
  ../secrets`. Symlinks are not followed for the check and the target need not
  exist, so `write_file` can create one. A missing path is `missing required
  argument: path`; a directory argument that is not one is `not a directory:
  <as written>`.
- **The read ledger.** `read_file` records the modification time of every file
  it serves; `edit_file`, and `write_file` on an existing file, require that
  record and refuse when the file has changed since — the model can never
  blind-overwrite your edits.
- **Output cap** 64 KB (65,536 bytes) per call.
- **Approval**: the four readers never ask; the two writers ask unless
  `auto_write: true`. **Parallel**: the readers always, the writers never.
  **Presentation**: readers Group, writers Expanded — a successful edit posts
  the unified diff as the call's block; the model's result text stays short.
  The header of a file tool is its path (`[read_file src/main.rs]`).

### `glob`

Finds files by name pattern under the project root, newest first. `.git` and
anything the root `.gitignore` matches are excluded.

| Parameter | Type | Required | Meaning |
|---|---|---|---|
| `pattern` | string | yes | a glob over root-relative paths with `*`, `?` and `**`. A pattern without `/` is prefixed with `**/`, so `*.go` matches at any depth. Empty: `missing required argument: pattern`; malformed: `invalid glob pattern: <pattern>` |
| `path` | string | no — the root | the directory to search, relative to the root |

Returns one root-relative path per line, newest modification first (ties keep
the walk's lexical order). At most **200** results are shown, out of at most
10,000 candidates collected: `[showing the 200 newest of N matches; narrow the
pattern to see the rest]`. Nothing found is `no files match <pattern>`, not an
error.

### `grep`

Searches file contents under the project root with a regular expression.
Binary files (a NUL in the first 8,000 bytes), files over 10 MB, `.git` and
root-`.gitignore` matches are skipped.

| Parameter | Type | Required | Meaning |
|---|---|---|---|
| `pattern` | string | yes | the regular expression, in Rust `regex` syntax (RE2-like: no backreferences or lookaround). Not trimmed — a leading space is part of the pattern. Empty: `missing required argument: pattern`; malformed: `invalid regular expression: <error>` |
| `path` | string | no — the root | the directory to search, relative to the root |
| `include` | string | no | a filename glob filter. Without `/` it matches the basename (`*.go`); with one, the root-relative path (`cmd/**`). Malformed: `invalid include pattern: <include>` |
| `context` | integer | no — `0` | lines of context around each match, clamped to `0`–`10` |

Output lines are `path:line: text` for a match and `path:line- text` for a
context line, in ascending line order per file, each line clipped at 500 bytes
with `…`. The search stops after **100** matches or when the output passes 64
KB: `[stopped after N matches; refine the pattern or use include to narrow the
search]`. Nothing found is `no matches for <pattern>`.

### `list_dir`

Lists one directory level under the project root: directories with a trailing
`/`, files with their size, sorted by name.

| Parameter | Type | Required | Meaning |
|---|---|---|---|
| `path` | string | no — the root | the directory to list, relative to the root |

```text
src/
Cargo.toml (1.2 KB)
README.md (38.4 KB)
```

A symlink shows its own size and is never listed as a directory. At most
**500** entries: `[showing 500 of N entries]`. An empty directory is
`[directory is empty]`; one that cannot be read, `cannot list <dir>: <error>`.

### `read_file`

Returns a text file's content with line numbers, optionally windowed. Reading
a file is what allows it to be edited afterwards.

| Parameter | Type | Required | Meaning |
|---|---|---|---|
| `path` | string | yes | the file, relative to the root |
| `offset` | integer | no — `1` | the 1-based first line. Past the end: `offset N is past the end of <path> (M lines)` |
| `limit` | integer | no — all remaining | how many lines to return |

Each row is the line number right-aligned in six columns, a tab, and the line.
Files are read up to **20 MB** — a larger one carries `[file is X MB; only the
first 20 MB was read]`. A binary file is refused: `<path> looks like a binary
file (X KB); read_file only serves text`. An empty file is `[file is empty]`.
A window that is not the whole file ends with `[showing lines A-B of N]`; one
that hits the 64 KB cap ends with `[output truncated — showing lines A-B of N;
call read_file with offset=C to continue]`, and a single line longer than the
cap is cut with `…` rather than making the window empty. A file that is not
there: `file does not exist: <absolute path>`; a directory: `<absolute path>
is a directory, not a file`.

### `edit_file`

Replaces an exact string in a file, byte for byte — the file's encoding
outside the edited span is never touched.

| Parameter | Type | Required | Meaning |
|---|---|---|---|
| `path` | string | yes | the file, relative to the root |
| `old_string` | string | yes | the exact text to replace, whitespace and indentation included. Must be unique in the file unless `replace_all` is set — the model extends it with surrounding lines to disambiguate |
| `new_string` | string | yes | the replacement |
| `replace_all` | boolean | no — `false` | replace every occurrence instead of requiring uniqueness |

The file must have been read this session and be unchanged since; files over
20 MB are refused (`<path> is too large to edit (X MB)`). On success the model
reads `N replacement(s) in <path>` followed by a few numbered lines around the
first change, and you see the diff. Refusals:

| Case | Text |
|---|---|
| not read yet | `<path> has not been read in this session — read it with read_file before modifying it` |
| changed since | `<path> changed on disk after it was read — read it again before modifying it` |
| empty `old_string` | `old_string must not be empty (use write_file to create or replace a whole file)` |
| no change | `old_string and new_string are identical` |
| not found | `old_string not found in <path> — it must match the file content exactly, whitespace included; read the file again if unsure` |
| ambiguous | `old_string appears N times in <path>; extend it with surrounding context to make it unique, or set replace_all` |
| cannot write | `cannot write <path>: <error>` |

### `write_file`

Creates or overwrites a whole file; parent directories are created. The model
is told to prefer `edit_file` for changes inside an existing file.

| Parameter | Type | Required | Meaning |
|---|---|---|---|
| `path` | string | yes | the file, relative to the root |
| `content` | string | yes | the full content. An empty string is valid; a missing or non-string value is `missing required argument: content` |

A **new** file needs no prior read and is created with mode `0644`; an
**existing** one must have been read this session and be unchanged since, with
the same two refusals as `edit_file`. A path that is a directory (`<path> is a
directory`) or not a regular file (`<path> is not a regular file`) is refused.
On success: `wrote X KB to <path> (created)` or `(overwritten)`, and the diff
against the previous content — unless the old file was too large to read
whole, in which case no diff is shown rather than a lying one.

## `skills`

One tool, `load_skill`, that activates a skill from the catalog in the [system
prompt](./system-prompt.md#available_skills) and reads its bundled files. It
takes no configuration: `skills:` under `tools:` enables it, and any value is
ignored. `workspace: true` enables it on its own — an explicit `skills:` entry
is registered first and the automatic one then finds `load_skill` already
there, so declaring both changes nothing. The set was called `agent` before
the three-layer split, where that word became the name of a config layer; the
old spelling is refused with the new one named.

### `load_skill`

Returns a skill's instructions and its directory (the base for its bundled
files and scripts), or one of its files. Skills are re-discovered on every
call, so the answer is always consistent with the catalog the model just read.

| Parameter | Type | Required | Meaning |
|---|---|---|---|
| `skill` | string | yes | the skill's name, exactly as the catalog lists it. Empty: `missing required argument: skill` |
| `file` | string | no | a file to read instead of the instructions, relative to the skill's directory (`references/api.md`). An absolute path or one that escapes with `..` is refused: `file must be a relative path inside the skill's directory, got "…"`; a symlink pointing out is followed |
| `offset` | integer | no — `1` | the 1-based first line of the window |
| `limit` | integer | no — all remaining | how many lines to return |

The instructions come back as `skill: <name>`, `directory: <path>`, a blank
line, then the `SKILL.md` body without its frontmatter; a `file` comes back as
its content. Files are read up to **20 MB** (`[file is N bytes; only the first
20 MB was read]` as the last line, so it takes part in windowing) and output is
capped at **64 KB**: `[output truncated at 64 KB — showing lines A-B of N; call
load_skill again with offset=B and a limit to continue]`, or `[showing lines
A-B of N]` for a window that ends early. An unknown name is `unknown skill
"x"; available skills: a, b, c` — or `unknown skill "x": no skills are
installed`. **Approval**: never. **Parallel**: no. **Presentation**: Group.

## `ask`

Lets the model put a decision to you on an interactive selector instead of
asking in prose — and, crucially, **without** ending its turn: the answer flows
back as a tool result and the same agentic round continues. Two tools,
`choose` and `confirm`; zero side effects, no approval gate, no configuration.
The set is bound to the interactive session: in a `-m` run it contributes
**nothing**, so the model never sees a tool it cannot use. It is on by default
interactively; opt out per agent with `tools: {ask: false}`. Both tools are
*Surface* presentation — they put their questionnaire in front of you and the
answers are recorded as their own block — and neither runs in parallel.

### `choose`

Packs 1–4 questions into a tabbed surface: short headers as tab labels, Tab
switches, one Enter commits all. Each question is single- or multi-select, with
an "Other…" free-text answer unless the model disables it. ESC declines the
whole thing.

| Parameter | Type | Required | Meaning |
|---|---|---|---|
| `questions` | array of 1–4 question objects | yes | empty or missing: `choose: questions must be a non-empty array`; more than four: `choose: at most 4 questions per call`; an item that is not an object: `choose: questions[i] must be an object` |
| `questions[].header` | string | yes | the tab label, at most 16 characters; anything longer is cut to 15 plus `…`, not rejected |
| `questions[].question` | string | yes | the complete question, one line. A blank header or question: `choose: questions[i] needs header and question` |
| `questions[].options` | array of `{label, description?}` | yes | the choices — a real choice has at least two (one yes/no question is `confirm`); the call needs at least one with a non-blank `label` (`choose: questions[i] needs at least one option with a label`); options without one are dropped |
| `questions[].multiple` | boolean | no — `false` | allow several picks. The model is told it **must** set this whenever the wording invites more than one ("select all that apply") |
| `questions[].allow_custom` | boolean | no — `true` | offer the "Other…" free-text answer |

The result is one row per question, `<header>: <answer>`, where the answer is
the selected labels joined by `, `, a free-text answer appended as `<text>
(custom answer)`, or `(nothing selected)`. Declining gives `The user declined
to answer.` and the model proceeds on its own.

### `confirm`

A single yes/no.

| Parameter | Type | Required | Meaning |
|---|---|---|---|
| `question` | string | yes | the complete yes/no question, one line. Blank: `confirm: question is required` |
| `yes_label` | string | no — `Yes` | the affirmative choice's label |
| `no_label` | string | no — `No` | the negative choice's label |

The result is `The user chose: <label>`, or `The user declined to answer.` on
ESC.
