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
`mode: agent` and `mode: bot`), and `ask` (interactive questions to the user; on by default
in interactive sessions — disable with `ask: false`).

```yaml
write_roots: [~/.cache]      # top level: extra writable directories, every agent

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
- **Approval** is a per-call question: `<tool> <what it does> — allow?`, and
  a host such as herdr is told `<tool> … needs approval`. Interactively the
  answer is `Allow once` / `Allow for this session` / `Allow for this project`
  / `Deny`; a denied call does not run and the model is told so. The two middle
  items are [grants](#grants): a session grant comes back with `iota resume`
  and `/session` and is gone after `/new`, a project grant applies to every
  session and every `-m` run in the project, and both are listed and taken
  back with [`/allow`](./slash-commands.md#allow). A non-interactive `-m` run
  has nobody to ask and refuses every gated call no grant covers with: `<tool>
  was not executed: it requires interactive approval, which is unavailable in
  this non-interactive run. Set the toolset's auto-approve option
  (tools.code.auto_write / tools.shell.auto_run) to permit it here.`
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

Extra writable directories are not a `shell` key: list them in the top-level
[`write_roots:`](#write-roots), which the `code` set shares. A config that
still has `tools.shell.write` loses the shell tool, with the warning
``toolset "shell": `write` is gone — list extra writable roots in the
top-level `write_roots:` (shared by the shell and code sets) (ignored)``.

A value that is not a mapping is refused: `config must be a mapping (sandbox,
network, auto_run): <decode error>`. On Windows a machine with no
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
| `timeout` | integer | no — none | kill the command after this many seconds. Left out, the command runs until it exits — a job outlives the call, never iota. Any positive number; `0`, a negative or a non-number is refused before anything runs: `timeout must be a positive number of seconds` |
| `background` | boolean | no — `false` | do not wait at all: start the command and return at once with a job id — for servers, watchers, a child agent. A foreground call waits 20 s and then yields on its own (see [Background jobs](#background-jobs)), so the flag is for what should never be waited on |

**Approval**: with `auto_run: true`, never. Otherwise every call of an
unsandboxed set (no sandbox on the machine, or `sandbox: off`), and in a
sandboxed set only the call that [leaves it](#the-iota-exception).
**Parallel**: always — a round's consecutive `shell` calls run as one batch,
results in call order — with one exception: a sandboxed set's iota call that
must be asked about takes the serial path, because the batch has no approval
gate. (Every other toolset keeps the conservative rule that only read-only
calls batch; here the model wrote both command lines, and `&`/`wait`/`xargs
-P` inside one call were never gated either.) **Presentation**: Group; the
header is the command itself — `[shell git status]`, with dim brackets, the
tool's name in bold cyan and the rest in cyan — with an explicit `cwd`
folded into the interpreter's idiom (`cd <path> && <cmd>`; `cd <path>; <cmd>`
under PowerShell), `(background)` in front of a background call and `(outside
the sandbox)` after an iota call.

**Output cap**: 32 KB and 512 lines, both bounded while the command streams.
Past 512 lines the first 128 and the last 384 are kept around `[... N lines
omitted — pipe through head/tail/grep to narrow the output ...]`; past 32 KB
the first 8 KB and the last 22 KB around `[... N bytes omitted ...]`. While a
command runs, its own line above the input shows how long it has been running,
and the status row says `Running tools` with the turn's clock and
`(ESC to cancel)`; **ESC** (or Ctrl+C) terminates it.

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
  directory (created if missing); then every [`write_roots:`](#write-roots)
  entry and `--add-dir` value; then every [directory grant](#grants), read
  again at each call, so a directory allowed mid-session is writable from the
  next command. Everything else fails inside the command with the OS's error
  (`Operation not permitted` on macOS, `Read-only file system` on Linux),
  which the [harness prompt](./system-prompt.md) tells the model to report
  rather than work around.
- **The [protected paths](#protected-paths) stay read-only** even inside those
  directories: `.iota.yaml`, `.git/hooks`, `.git/config` and the rest. So
  `git config …`, `git remote add`, `git init` in a folder that is not a
  repository yet, `git push -u`, `git submodule add` and hook installers
  (husky, pre-commit, lefthook) fail in the sandbox; `git add`, `commit`,
  `checkout` and `fetch` work. Run those yourself, or set `sandbox: off` and
  approve each command. On Linux the sandbox can only protect a file that
  already exists: a sandboxed command can still create a missing
  `.iota.yaml`.
- **Network is blocked** unless `network: true`.
- **Sandboxed calls run without prompting**, so a sandboxed command can never
  stop to ask for a directory: [`/allow <dir>`](./slash-commands.md#allow) is
  how you make one writable before it runs. Where no sandbox is available or
  with `sandbox: off`, every call asks instead (allow once / for this session
  / for this project / deny), and `-m` runs refuse it unless a project grant
  for `shell` covers it — `auto_run: true` waives both.

The tool's description tells the model which regime it is in: `Commands run
inside an OS sandbox: file writes are confined to the project root and
temp/cache directories (writes elsewhere fail with permission errors), and
network access is BLOCKED.` — or `…is allowed.` with `network: true` —
followed by one sentence naming the protected files and the commands that
fail on them, so the model asks you instead of fighting the sandbox, and one
more: `The user can make another directory writable with /allow <dir>: when a
command must write outside these, ask for that instead of working around it.`
A failed command's result carries no extra hint. With
`write_roots:` set, the line names them: `confined to the project root, the
extra write roots (/Users/you/scratch, …) and temp/cache directories`.
Unsandboxed, it reads `Commands run WITHOUT a sandbox on this system, with
the user's full permissions — be conservative.`

### The iota exception

One command line leaves a sandboxed set: **iota itself**. A call whose first
word is the running binary — `iota mcp login <name>`, a child agent's
`iota run <agent> -m "<task>"`, `/opt/homebrew/bin/iota …` — is spawned
without the sandbox, because what it does (store a login's token, open a
browser, reach an API) is exactly what the sandbox exists to refuse, and the
binary is one you installed. The rule is conservative by construction:

- the **first word**, read with POSIX quoting (`'…'`, `"…"`, `\`), must resolve
  — an absolute or relative path as written, a bare name on `PATH` — to the
  same canonical file as the running binary; a build the OS cannot locate
  (`iota binary: (unknown)` in the environment block) lets nothing out;
- the rest of the line must be **one simple command**: a pipe (`|`), a chain
  (`&&`, `||`, `;`, `&`), a newline, a command substitution (`$(…)`, a
  backtick) anywhere outside single quotes keeps the whole line in the sandbox
  (`iota mcp list | head` stays in), and so does an expansion the shell would
  decide — `$`, `*`, `?`, `[` or `{` outside quotes, `$` inside double quotes.
  Redirections (`>`, `<`, `2>&1`, `&>`) are allowed: they change where iota's
  output goes, not what runs;
- the commands that write a config or the trust record never leave:
  `iota config trust`, `untrust` and `init`, `iota mcp add` and `remove` stay
  in the sandbox, where the write is refused. The model asks you to run them
  in your own terminal;
- nor does a line that chooses what the child loads, starts or may write:
  one carrying `-c`, `--config`, `--mcp` or `--add-dir` (the word or its `=`
  form) anywhere among its arguments stays in the sandbox.

The only effect is the missing sandbox: `network:` and `write_roots:` are the
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

A foreground call returns when the command exits **or after 20 seconds**,
whichever comes first. A command still running at 20 s continues as a
background job: the call returns with the job id and the output so far, the
model goes on with its turn, and the job's exit status and output come back
later as a notice. The model never has to guess how long a command takes —
the one thing it must not do is poll:

```text
Still running after 20s as background job b3 (pid 4242). Output so far:
   Compiling iota v0.4.0
A notice with its exit status and output arrives when it finishes; do not poll (`tail -f /tmp/iota-jobs/931/b3.log` only if you need progress).
```

In the transcript the call settles as a classic block with that receipt —
`⎿ still running after 20s → background job b3` and the output it had — or, in
a folded group, the summary line names it: `◇ ran 3 tools in 20s · job b3
running` (`· 3 jobs running` for several). The time is the group's, up to the
yield; the job's own time is in its notice. While anything runs, the status
row ends with `· job b3 cargo test 1m12s` (`· 3 jobs 3m01s` for several) and
[`/jobs`](./slash-commands.md) lists every job — id, elapsed, command — live,
the clocks walking and a finished job leaving the list; picking one shows its
full command, its clock, its pid, its output file and the last lines of its
output, and a **Kill** tab ends the jobs you tick. The command exists only
while a job is running.

`"background": true` skips the 20 s: the command starts and the call returns
at once with a job id, its pid and an output file — for servers, watchers and
child agents, which should not be waited on at all:

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
`killed`. The command after it is the label the call's `[shell …]` header
showed — one line, cut past 64 characters — the same rule the `/jobs` rows
and the status row's job segment follow; the full text is in `/jobs`. If you are sitting at the prompt, the notice wakes the model for one
turn (your half-typed draft is untouched). If a turn is already running, it
lands at the next round boundary, like a message you typed while the model was
working. After a turn you stopped with Esc, or one the provider refused with a
rate limit, it does not wake the model: it waits — for your next message, or
for iota's next try after the limit — with a dim `⏸ … — held` line (see [Rate
limits and Esc](./slash-commands.md#rate-limits-and-esc)). In `-m` runs the run does not end while a job is still going: the
loop waits for it, hands the model the notice and gives it another round —
each one counted against `--max-turns`.

Up to **16** jobs at a time — past that a `background: true` call is refused
with `too many background jobs running (16); wait for one to finish`, and a
foreground call does not yield but is waited for to the end, its result saying
so — a `timeout` the call named still applies, and the approval rules are
unchanged. The log file is left on disk,
uncapped, so `tail` still shows everything. **Background jobs are killed when
iota exits** — `/exit`, Ctrl+D, Ctrl+C at the prompt, or the end of a `-m` run — so a
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
string replacement) / `write_file` change files. **Reading is open, writing is
confined**: the readers take any path, while the writers write inside the
**project root** — the git root of the working directory, or the working
directory itself outside a repository — the [`write_roots:`](#write-roots)
directories and the directories you [grant](#grants), and ask you about
anything else. Verification — builds, tests —
goes through the `shell` set, so enable it alongside.

### Configuration

| Key | Type | Default | Meaning |
|---|---|---|---|
| `auto_write` | boolean | `false` | `edit_file` and `write_file` run without approval inside the project root, the `write_roots:` and the granted directories — and therefore in `-m` runs, which otherwise refuse them. A write outside them, or to a protected path, still asks |
| `read_only` | boolean | `false` | leave the two writers out entirely: the model sees `glob`, `grep`, `list_dir` and `read_file` alone. A tool the model cannot see is never attempted and never refused — the reviewer's setting |

Both together are refused: `read_only and auto_write contradict each other:
auto_write approves writes the set does not offer`. A value that is not a
mapping: `config must be a mapping (auto_write, read_only): <decode error>`.

Shared by all six tools:

- **Paths.** A relative `path` is resolved against the project root, an
  absolute one is taken as written, and either is cleaned. The readers accept
  any path — `../other-repo`, `/etc/hosts` — and follow a symlink wherever it
  leads; a result outside the project root is shown by its absolute path
  (`~/…` in a header). The writers check where the file **really** is (see
  [Where the writers may write](#where-the-writers-may-write)). A missing path
  is `missing required argument: path`; a directory argument that is not one
  is `not a directory: <as written>`.
- **The read ledger.** `read_file` records the modification time of every file
  it serves; `edit_file`, and `write_file` on an existing file, require that
  record and refuse when the file has changed since — the model can never
  blind-overwrite your edits.
- **Output cap** 64 KB (65,536 bytes) per call.
- **Approval**: the four readers never ask; the two writers ask unless
  `auto_write: true` — and always ask outside the roots or for a protected
  path. **Parallel**: the readers always, the writers never.
  **Presentation**: readers Group, writers Expanded — a successful edit posts
  the unified diff as the call's block; the model's result text stays short.
  The header of a file tool is its path (`[read_file src/main.rs]`).

### `glob`

Finds files by name pattern under the project root (or the `path` you name),
newest first. `.git` and anything the containing root's `.gitignore` matches
are excluded.

| Parameter | Type | Required | Meaning |
|---|---|---|---|
| `pattern` | string | yes | a glob over root-relative paths with `*`, `?` and `**`. A pattern without `/` is prefixed with `**/`, so `*.go` matches at any depth. Empty: `missing required argument: pattern`; malformed: `invalid glob pattern: <pattern>` |
| `path` | string | no — the root | the directory to search, relative to the root or absolute |

Returns one root-relative path per line, newest modification first (ties keep
the walk's lexical order). At most **200** results are shown, out of at most
10,000 candidates collected: `[showing the 200 newest of N matches; narrow the
pattern to see the rest]`. Nothing found is `no files match <pattern>`, not an
error. The walk itself stops after visiting 100,000 files and folders — `[stopped
after visiting 100000 entries; narrow "path" to search further]` — and at once
when you press **Esc**: what it found so far, then `[search cancelled]`. So a
search started at `/` cannot run away.

### `grep`

Searches file contents under the project root (or the `path` you name) with a
regular expression. Binary files (a NUL in the first 8,000 bytes), files over
10 MB, `.git` and the containing root's `.gitignore` matches are skipped.

| Parameter | Type | Required | Meaning |
|---|---|---|---|
| `pattern` | string | yes | the regular expression, in Rust `regex` syntax (RE2-like: no backreferences or lookaround). Not trimmed — a leading space is part of the pattern. Empty: `missing required argument: pattern`; malformed: `invalid regular expression: <error>` |
| `path` | string | no — the root | the directory to search, relative to the root or absolute |
| `include` | string | no | a filename glob filter. Without `/` it matches the basename (`*.go`); with one, the root-relative path (`cmd/**`). Malformed: `invalid include pattern: <include>` |
| `context` | integer | no — `0` | lines of context around each match, clamped to `0`–`10` |

Output lines are `path:line: text` for a match and `path:line- text` for a
context line, in ascending line order per file, each line clipped at 500 bytes
with `…`. The search stops after **100** matches or when the output passes 64
KB: `[stopped after N matches; refine the pattern or use include to narrow the
search]`. Nothing found is `no matches for <pattern>`. Like `glob`, it stops
after visiting 100,000 entries and on **Esc** (`[search cancelled]`); it also
stops after reading 256 MB of files in one call: `[stopped after reading 256 MB
of files; narrow "path" to search further]`.

### `list_dir`

Lists one directory level: directories with a trailing
`/`, files with their size, sorted by name.

| Parameter | Type | Required | Meaning |
|---|---|---|---|
| `path` | string | no — the root | the directory to list, relative to the root or absolute |

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
| `path` | string | yes | the file, relative to the root or absolute |
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
| `path` | string | yes | the file, relative to the root or absolute |
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
| `path` | string | yes | the file, relative to the root or absolute |
| `content` | string | yes | the full content. An empty string is valid; a missing or non-string value is `missing required argument: content` |

A **new** file needs no prior read and is created with mode `0644`; an
**existing** one must have been read this session and be unchanged since, with
the same two refusals as `edit_file`. A path that is a directory (`<path> is a
directory`) or not a regular file (`<path> is not a regular file`) is refused.
On success: `wrote X KB to <path> (created)` or `(overwritten)`, and the diff
against the previous content — unless the old file was too large to read
whole, in which case no diff is shown rather than a lying one.

### Where the writers may write

`edit_file` and `write_file` look up where the file **really** is — every
symlink resolved, the nearest existing folder for a file not made yet — and
sort the call into one of four cases:

| Case | In a chat | In a `-m` run |
|---|---|---|
| inside the project root, a `write_roots:` or `--add-dir` directory, or a granted one | asks unless `auto_write: true` or a grant for the tool | refused unless `auto_write: true` or a project grant for the tool |
| outside every root | **always asks**, even with `auto_write: true` | refused: pass `--add-dir`, or list the directory in `write_roots:` |
| a [protected path](#protected-paths) | **always asks**, allow once only | refused: make the change yourself |
| the real location cannot be worked out | refused | refused |

A symlink inside the project that leads out of every root is a write outside
every root: the prompt shows where the link really points, and the write
lands there. With [`outside_writes: refuse`](#outside-writes) both the outside
and the protected rows are refused without a prompt.

**The prompt for an outside write** names the real location, absolute, and
marks it: `write_file /Users/you/notes/todo.md (outside the project root) —
allow?`. Its items are `Allow once`, `Allow, and make /Users/you/notes
writable for this session`, `Allow, and make /Users/you/notes writable for
this project` and `Deny`. The two middle ones are a [directory
grant](#grants): the file's real directory and everything under it becomes a
root, for both writers and the sandboxed shell, and the next write there is
an inside write. When that directory is `/`, your home directory or a
directory above it, only `Allow once` and `Deny` are offered — one keypress
on `~/x.txt` would otherwise open `~/.ssh`; `/allow ~`, typed out, still
works. A grant for writes inside the roots (`Allow for this session` on an
inside write) never covers an outside one.

**The refusals** the model reads: `path is outside the project root
(/Users/you/project): ../notes/todo.md` — with `) and the extra write roots
(…` inside the parentheses when `write_roots:`, `--add-dir` or a directory
grant adds any — followed in a `-m` run by `— writing there needs the user's
approval, which this non-interactive run cannot ask for; pass --add-dir
<dir>, or list its directory in the top-level `write_roots:`, to allow it`. A path whose real location cannot be worked out is `cannot verify
<path> inside the project root (…)`. The writers' descriptions name the
static roots (`write_roots:` and `--add-dir`), and in a chat add `Outside that, the user is asked to approve a write
there first.`, so the model does not take a refusal as final.

#### `write_roots:` {#write-roots}

A **top-level** key — beside `providers:` and `agents:`, not under `tools:` —
listing directories outside the project that both the code writers and a
sandboxed shell may write. One list for both, every agent:

```yaml
write_roots:
  - ~/scratch          # ~ is your home
  - ../shared-lib      # relative to the project root
```

Every config file of the stack adds its entries. A blank entry fails the
config load (`write_roots[0]: …`); a directory that does not exist yet is
accepted; a directory whose real location cannot be worked out refuses the
`code` set (`cannot resolve the write root <path>`). The model is told the
list in the writers' and the shell's descriptions. `agents.<name>.write_roots`
is refused: the key is top level only.

For one run, [`iota run|resume … --add-dir <dir>`](./quick-start.md#flags)
(repeatable) adds a directory the same way, after the config's entries. A
relative value is against the working directory, not the project root, and the
flag is not kept with the session: a resume that wants it passes it again.

#### Grants {#grants}

A **grant** is a permission you give in the chat that stays: you give it from
the approval dialog or with [`/allow`](./slash-commands.md#allow), and you list
and take it back in `/allow`'s panel. There are two kinds:

| Grant | What it does |
|---|---|
| a directory | the directory's real location and everything under it becomes a write root — for `edit_file`/`write_file` **and** for the sandboxed `shell`, read again at each call, exactly as a `write_roots:` entry. A write there is then asked or not by `auto_write` like any write inside the project |
| a tool | removes the question for one tool: `shell`, `edit_file`, `write_file` (or an [MCP tool](./mcp.md#approval)). It never answers a write outside the roots or to a protected path |

Each lasts at one of two levels, and both only add:

| Level | Lasts | Kept in |
|---|---|---|
| this session | the session: `iota resume` and `/session` bring it back, `/new` starts without it | the session's own record (in memory until `/save` in a `--no-save` chat) |
| this project | until you revoke it: every session and every `-m` run rooted at the project | `~/.iota/sessions/projects/<project>/grants.json` |

The model is told the directories in force — the static roots and the
directory grants — on the `write roots:` line of its
[environment](./system-prompt.md), which is rewritten on the next turn after a
grant changes. The tool descriptions keep naming the static roots only.

**The permanent forms are configuration**, the same for every project:

| Grant | Its permanent form |
|---|---|
| a directory | [`write_roots:`](#write-roots) (every run), `--add-dir` (one run) |
| `shell` | `tools.shell.auto_run: true` |
| `edit_file`, `write_file` | `tools.code.auto_write: true` |
| an MCP tool | [`mcp_servers.<name>.auto_run: true`](./mcp.md#approval) |

None of them — no grant, no `write_roots:` entry, no `--add-dir`, no
`auto_write` or `auto_run` — opens a [protected path](#protected-paths): the
project's and your own `.iota.yaml`, git's hooks and config, and the trust
record and the grants themselves under `~/.iota`. A granted directory that is
a git repository keeps its own `.git/hooks` and `.git/config` protected, as a
`write_roots:` entry does. No config key writes a grant either: a repository's
`.iota.yaml` cannot ship one.

#### `outside_writes:` {#outside-writes}

Also top level: `ask` (the default) puts a write outside every root to you as
above; `refuse` refuses it with no prompt, as iota did before 0.9.0. It only
tightens: once a config file of the stack says `refuse`, a later `ask` changes
nothing. To let a directory in silently, in every mode, list it in
`write_roots:` instead.

#### Protected paths

A few files are never written unasked — not by the writers, not by a
sandboxed shell command — whatever `auto_write`, `auto_run`, `write_roots:`,
`--add-dir` or a grant say:

| Path | Why |
|---|---|
| `<project>/.iota.yaml`, `<project>/.iota.yml` | the project config iota loads |
| `<project>/.git/hooks/` | git runs them on your next git command |
| `<project>/.git/config`, `<project>/.git/config.worktree` | they can point git at another program (`core.fsmonitor`, `core.hooksPath`) |
| the same files of each submodule, under `<project>/.git/modules` | as above |
| `~/.iota.yaml`, `~/.iota.yml` | your own config |
| `~/.iota/trusted.json` | the record of the project configs you [trust](./config-file.md#trusting-a-project-config) |
| `~/.iota/sessions/` and everything under it | the sessions and the [grants](#grants) that let the model act without asking |

`<project>/.git` and `~/.iota` themselves cannot be renamed or replaced either
(their other contents stay writable). In a worktree made with `git worktree
add`, the main repository's `.git/hooks` and `.git/config` and the worktree's
`config.worktree` are covered too, and so is the `.git` of any `write_roots:`,
`--add-dir` or granted directory that is a repository. Listing `<project>/.git` in `write_roots:`
opens the rest of `.git`, not these files.

The writers ask about a protected file **every time**, one file at a time,
naming it and why — `write_file /Users/you/project/.git/hooks/pre-commit
(protected): git executes the files in .git/hooks on the user's next git
command — allow?` — and offer only **Allow once** and **Deny**. In a `-m` run,
or under `outside_writes: refuse`, the write is refused and the message says
why. `~/.iota/trusted.json` and `~/.iota/sessions/` are never written by a
tool and never asked about: `… no tool may write it; the user trusts a project
config by running `iota config trust` themselves`, and `… no tool may write
it; iota alone writes the sessions and the grants they hold`.

## `skills`

One tool, `load_skill`, that activates a skill from the catalog in the [system
prompt](./system-prompt.md#available_skills) and reads its bundled files. It
takes no configuration: `skills:` under `tools:` enables it, and any value is
ignored. `mode: agent` (and `mode: bot`) enables it on its own — an explicit `skills:` entry
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
