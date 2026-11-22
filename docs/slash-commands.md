---
id: slash-commands
title: Slash commands
description: Every slash command available in an interactive session, and the keys that drive it.
sidebar_label: Slash commands
---

# Slash commands

In interactive mode, the following commands are available. Type `/` and a list
opens above the input: one command per row, its description beside it, and it
narrows as you keep typing. `↑`/`↓` move through it, **Enter** runs the
highlighted command, **Tab** completes it, **Esc** puts back what you typed,
and a click highlights a row. `/skills ` lists each skill with its own
description. Commands that do not apply to the
current session (for example `/edit` on a text provider) are not offered at all,
and an unknown `/word` is sent as a normal message.

| Command | Description |
|---------|-------------|
| `/file [path]` | Attach a file (image, PDF, or text). With a path, attaches directly. With no path, opens a tabbed selector: "Attached" to remove attachments, "Add" to pick one from a directory browser. |
| `/edit [prompt]` | Edit a generated image by re-sending it as this turn's reference. With a prompt it takes the newest image (consecutive `/edit`s iterate). With no prompt it opens a picker — preview on the left, every image this session generated on the right (newest first, labeled by its prompt, clickable path below) — and after you choose, type the prompt in the composer. Dedicated image providers (`type: imagen` / `images`) only. |
| `/redo [prompt]` | Re-send the last request: same reference images, same prompt unless you supply a new one. Bare `/redo` rolls the dice again (image models vary per call); `/redo <reworded prompt>` retries from the *same* canvas, so a rejected result never becomes the next input. Dedicated image providers only. |
| `/new` | Start a new session in the same run. The session you leave is saved and stays on disk — `/session` or `iota resume <id>` brings it back. The new one gets its own id, in the same place, and keeps what the chat runs under: the model and its settings (with where each came from, so one you set by hand stays yours), the system prompt, the tools and MCP servers, the directory, and whether the chat is being saved. It starts with an empty conversation, no attachments and the token counts at zero. The screen is not cleared: a dim `New session <id>` line marks where the new session begins (`New session · not saved · /save keeps it` for an unsaved chat). Background jobs keep running, and their results go to the new session. An unsaved chat a model has replied in asks `Discard this unsaved chat and start a new one?` first, and a session nothing has been said in yet is already new (`Already a new session.`). `/clear` is a hidden alias: it does the same and is not listed. A [bot](./bot-mode.md) does not list it and refuses it: `A bot's session never ends: to start over, run another agent or rename the bot.` |
| `/session` | Tabbed selector over saved sessions: "Resume" to resume one, "Delete" to multi-select and delete others. A session open in another iota process is skipped by Delete, and a [bot](./bot-mode.md)'s session is neither offered nor deleted; inside a bot, `/session` is not a command. |
| `/save [title]` | Start persisting an ephemeral session (one started with `--no-save` or `no_save: true`): the whole backlog is written at once and auto-save continues from then on. An optional title is kept as-is; otherwise the model-generated one is used. Only offered while the session is ephemeral. |
| `/model` | Tabbed settings for the current session: "Model" picks the model (a combo box over the agent's choices — type to filter, or type a model name nothing lists and commit that), "Context" the context window, "Effort" the reasoning effort (`default`, `low`, `medium`, `high`, `xhigh`, `max` — passed to the provider verbatim, so a level the model doesn't support surfaces as an API error and you pick another), "Temperature" a slider (`default` omits the parameter), and a read-only "System" tab showing the [system prompt](./system-prompt.md) exactly as sent — harness, your instructions and the overlay. Enter applies all tabs; only changed values are announced. Picking another model re-evaluates the five layered parameters against it — a window or effort the session inherited from the model it leaves is dropped, one you set here yourself is kept (see [the five layered parameters](./config-file.md#the-five-layered-parameters)). The rows are `agents.<name>.choices`: `models:` entries and inline `provider:id`s as they are, every `provider:*` listed at once — a source that cannot answer costs only its own rows, named in the panel's dim subtitle, and the input row stays open either way. A row reads `provider:model` (just the model when every choice is on one provider), with the `models:` entries that name it in brackets; typed text is read as `-M` reads it, so the name of a `models:` entry picks that entry, whether or not it is among the choices. The only annotation is `(current)`; a row does not say what picking it does — the pick reports itself. A row on another provider moves the chat there: at once before the first reply; after a reply iota saves the chat, says how many replies carry payload the new provider will not replay, and asks `Move this chat to <provider>:<model>?` first — an unsaved chat is told to `/save` first. A bot refuses such a pick (see [the choices](./config-file.md#the-choices-are-what-model-offers)). Image providers get their own tabs instead (see [Image generation](./image-generation.md)). |
| `/compact [hint]` | Summarize older history to free context; optional hint guides what to keep. While the summary is written, a `Compacting context…` spinner row — the one thinking uses — shows in the transcript, and the outcome replaces it; with nothing to summarize it says only `Nothing to compact yet.` Offered only while token accounting is live. |
| `/export [file]` | Export the conversation (saved sessions: the full on-disk log, so compaction never hides older rounds) to a single self-contained HTML file — the default — or Markdown with a `.md`/`.markdown` extension. With no argument, a selector picks the format and the filename is generated from the session title. Never overwrites an existing file. |
| `/status` | Show provider, model, context usage, last-turn token counts, the version, the mode (`chat`, `agent` or `bot`) and the session's title — an unsaved chat's too, `(untitled)` until it has one. While anything is granted or allowed, a `Grants` row counts it: `3 static, 2 for this session, 1 for this project (/allow lists them)`, each part present only when it is not zero — `static` being what the agent's `allow:` and `--allow` give. |
| `/jobs` | Two tabs over the background jobs, refreshed every second: "Jobs" is a single-select list — id, elapsed, command; pick one for its full command, clock, pid, output file and the last lines of its output (Esc returns to the list) — and "Kill" a multi-select list that ends the jobs you tick (Space toggles, Enter kills; each one's notice lands as `killed`). Exists only while a job is running: a `shell` call that yielded after 20 s, or one started with `background: true` (see [Background jobs](./builtin-toolsets.md#background-jobs)). |
| `/tools` | One list of where the model's tools come from, refreshed while it is open: `built in` (the tools iota ships with) first, then each MCP server — its tool count and how it stands: `connected`, `connecting…`, `down`, `needs login` or `failed`, with the reason in a few words. Enter opens that source's page; Esc goes back to the list, on the row you left. A server's page shows its status, endpoint, transport, login, the names its tools go by (`mcp__<server>__<tool>`), its call timeout, the full reason it failed or went down (its stderr included), and its tools; **Enter there reconnects the server** in the background — the page shows it happening and how it went, and the chat gets one line, `MCP <name> reconnected · N tools` or why it did not. The `built in` page lists the tools and has nothing to reconnect. See [Seeing what is connected](./mcp.md#seeing-what-is-connected). |
| `/allow [what] [project]` | Make a directory writable, or stop the approval question for a tool — for this session, or with `project` last for this project. Bare `/allow` opens the grants panel. See [`/allow`](#allow) below. |
| `/debug [on\|off]` | Request inspector. `/debug on` / `/debug off` toggle recording of API round trips (a `debug` marker appears in the status row while on); bare `/debug` opens the two-tab console — "Messages" (newest first, drill into a request/response pair) and the "Verbose" switch. Recording is off by default and MCP traffic is not recorded. |
| `/exit` | Quit iota, exactly as Ctrl+D does, with no confirmation — the session is already saved as it goes. The conversation is written into the terminal's own history on the way out. A [bot](./bot-mode.md) quits on it too and keeps its session. |
| `/skills [name [instructions]]` | Bare `/skills` lists discovered agent skills — name, source (project/user), description, and any invalid skills that were skipped. `/skills <name>` runs one: its instructions (plus anything you add after the name) are sent as the message. Agent mode only; every discovered skill also shows up as a completion row. |

Attached files are sent with your next message, then cleared automatically.

## `/allow`

A **grant** is an answer to the approval question that you give once and that
stays: a directory made writable, or a tool that stops asking. The approval
dialog makes one when you pick a "for this session" or "for this project" item;
`/allow` makes one by hand. It is the only way to widen the boundary for the
[`shell`](./builtin-toolsets.md#the-sandbox) tool: a sandboxed command cannot
stop to ask, so a directory a build must write is allowed here first.

| Form | What it grants |
|------|----------------|
| `/allow <dir>` | `<dir>` and everything under it is writable for this session — by `edit_file`/`write_file` and by the sandboxed `shell` alike |
| `/allow <dir> project` | the same, for this project: every session and every run rooted here, `-m` included |
| `/allow <server>:<tool> [project]` | one MCP tool of a connected server runs without asking |
| `/allow <server>:* [project]` | every tool of the server runs without asking, tools it starts offering later included |
| `/allow <tool> [project]` | a built-in tool runs without asking, by the name the model sees: `shell` (every call that would ask — an unsandboxed one, or one that [leaves the sandbox](./builtin-toolsets.md#the-iota-exception)), `edit_file` and `write_file` (a write inside the roots) |
| `/allow` | opens the grants panel (below) |

The scope goes **last**: when the last word is exactly `project`, the grant is
for this project and the target is what comes before it; otherwise it is for
this session. A line that starts with `project` grants nothing and says what
to type (`the scope goes last: /allow shell project`). A directory whose name
ends in ` project` keeps the word with a trailing `/` (`/allow ~/my
project/`). The target is then read in this order: a connected MCP server's
whole name followed by `:` (a `--mcp` server is named by its URL or its
command, which may itself hold a `:` or start with `/`); then a directory —
anything starting with `~` or `.`, or with a root (`/x`; on Windows also
`C:\x` and `\\server\share`), a relative one against the project root; then
`<server>:<tool>`; then a bare word, a built-in tool. It is the grammar of an
agent's [`allow:`](./config-reference.md#allow) entries, which have no scope
word.

- **A directory** must exist. What is stored is its real location: `/allow
  ~/link` where `link` leads to `/data/x` says `✓ /data/x is writable for this
  session (~/link leads there)`. If that directory is later replaced by a
  symlink, the grant stops applying and the panel marks it `(stale)`; it
  applies again if the directory comes back.
- **A tool** is checked against what the run has: an MCP tool against the
  server's current tool list, a built-in against the tools that ask. A tool
  grant never answers a write outside the roots or to a protected path — those
  are asked every time.
- **A grant for this session** is kept with the session: `iota resume` and
  `/session` bring it back, `/new` starts without it. In a `--no-save` chat it
  lives in memory until `/save`.
- **A grant for this project** is kept in
  `~/.iota/sessions/projects/<project>/grants.json` and applies to every
  session in the project, and to `-m` runs. It is written even in a `--no-save`
  chat: it is not part of the conversation.

The model cannot run `/allow`, and neither can a message [from another
program](./quick-start.md#messaging-a-running-chat): it is the user's, typed
at the prompt. Grants in force are loaded without a word — at a start, a
resume, a `/session` switch and in a `-m` run alike; `/status` counts them in
its `Grants` row, present only while something is granted, and the bare
`/allow` panel lists them.

Each outcome is one line:

```text
/allow ~/scratch                     ✓ /Users/you/scratch is writable for this session
/allow ../lib project                ✓ /Users/you/lib is writable for this project (/Users/you/proj)
/allow github:*                      ✓ every tool of github runs without asking in this session
/allow github:search_issues project  ✓ github:search_issues runs without asking in this project (/Users/you/proj)
/allow shell project                 ✓ shell runs without asking in this project (/Users/you/proj)
```

Refusals start with `/allow: ` and store nothing:

| Case | Text |
|------|------|
| `project` first | `the scope goes last: /allow <target> project` |
| a directory too | `"<arg>" is a directory too: write "<arg>/" for it, or "<dir>/ project" for <dir> in this project` |
| not a directory | `<arg> is not a directory` |
| a [protected path](./builtin-toolsets.md#protected-paths) | `<dir> is protected: <why>` |
| already covered | `<dir> is already writable (the project root \| allow: \| --allow \| this project \| this session)` |
| no such server | `no MCP server named "<s>" is connected (connected: a, b)` |
| no such tool | `server "<s>" has no tool "<t>"` |
| two `--mcp` servers share the name | `"<s>" names 2 connected servers; add one to mcp_servers: under its own name to grant it` |
| already allowed or granted | `<key> already runs without asking (allow: \| --allow \| this project \| this session)` |
| an unknown built-in | `no built-in tool named "<t>" (tools that ask: shell, write_file)` |
| a built-in that never asks | `<t> never asks (tools that ask: …)` — `(no built-in tool of this run asks)` when none does |
| neither form | `expected a directory (~/…, ./… or an absolute path) or <server>:<tool>` |
| the project file cannot be written | `could not save the grant (<error>)` |

### The grants panel

Bare `/allow` grants nothing: it lists the grants and takes them back. With
nothing to list — no grant, and nothing in the agent's `allow:` or `--allow` —
it opens nothing and prints one line:

```text
No grants. /allow <dir> makes a directory writable for this session; /allow <dir> project for this project.
```

(in a run with no project: `No grants. /allow <dir> makes a directory writable for this session.`). Otherwise it opens a tabbed
panel: **Enter** on **Grants** revokes the checked rows, **Enter** on
**Static** closes it, and **Esc** changes nothing.

| Tab | What it is |
|-----|------------|
| **Grants** | Every grant in force, this session's first, then this project's — each row its level (`this session`, `this project`) and the directory or the tool, a `--mcp` server's tool marked `(--mcp <command>)`, a directory that no longer leads anywhere `(stale)`. **Space** checks rows, **Enter** revokes the checked ones — each from every level that holds it — with one line per grant: `✓ revoked /Users/you/scratch (this session, this project)`. |
| **Static** | Read-only, and present only when the agent's [`allow:`](./config-reference.md#allow) or `--allow` gives something: the directories and the tools allowed by configuration, the agent's `allow:` first, each row labelled with its source — `allow:   /Users/you/scratch`, `allow:   shell`, `allow:   github:*`, `--allow  /data/out`. They are not grants and cannot be revoked here; its prompt says so: `From the config and the command line: not grants made here, so none can be revoked here — edit agents.<name>.allow, or drop the flag.` |

There is no directory browser: granting is the typed form, `/allow <dir>`, or
the approval dialog's item. There is no `/revoke`: taking a grant back is the
panel's **Grants** tab.

## Keys

| Key | What it does |
|-----|--------------|
| **Tab** | Complete the highlighted slash command in the completion list. |
| **Esc** | Cancel the innermost running scope — a streaming reply, or a running `shell` call. Background-job notices queued behind a turn you stop wait for your next message instead of starting turns of their own (see [Rate limits and Esc](#rate-limits-and-esc)). |
| **Ctrl+C** | Cancel the turn. |
| **Enter** | Send. You can keep typing while a reply streams; queued submits are sent in order. **Ctrl+Enter** sends too. |
| **Ctrl+J** | Insert a line break. Works in every terminal. |
| **Alt+Enter**, **Shift+Enter** | Insert a line break where the terminal reports the modifier (below); elsewhere they are a plain Enter and send. |
| **Ctrl+D**, `/exit` | Quit. Ctrl+C at the prompt quits too. |
| **PgUp** / **PgDn** | Scroll the conversation half a screen (Fn+↑/↓ on a MacBook). |
| **Ctrl+Home** / **Ctrl+End** | Go to the first line of the conversation / back to the latest output. |
| **Ctrl+R** | Search the conversation (below). |
| **Ctrl+O** | Write the conversation into the terminal's own history (below). |
| **Ctrl+Z** | Suspend iota and give the terminal back to the shell; `fg` brings it back, redrawn at the window's size. |

A reply interrupted with **Esc** or **Ctrl+C** keeps its partial text in the
history, marked interrupted.

### Scrolling and search

iota runs full screen: the conversation fills the window and the input stays at
the bottom. Scroll with **PgUp**/**PgDn** or the mouse wheel. Scrolled back, new
output does not pull you down — the bottom line counts the new lines below
(`↓ N new lines`) — and **Ctrl+End** (or scrolling to the bottom) follows the
output again.

**Ctrl+R** searches the conversation; so does `/` while you are scrolled back
and the input is empty. Matches are highlighted and counted, `n`/`p` step
through them, **Enter** stays where you are and **Esc** goes back. **Ctrl+F**
is not search: it moves the cursor one character right.

While iota runs, your terminal's own scrollbar, Cmd+F and tmux copy mode reach
only what is on the screen now. **Ctrl+O** writes the conversation into the
terminal's history, so they reach all of it; press any key to come back. Each
line is written once, however often you press it. When you quit, the rest is
written there too (not after a crash or `kill -9`: `iota resume` brings the
session back). A resumed session shows its last three rounds; `/export` has the
whole conversation.

Lists and pickers take at most half the window and never more than 15 rows; a
longer list scrolls inside them: `↑`/`↓` a row, `←`/`→` a page, `g`/`G` the top
and the bottom.

### The mouse

- **The wheel** scrolls the conversation, like PgUp/PgDn.
- **A click** puts the input's cursor where you clicked. In a dialog a click
  moves to a row and a second click on it chooses it, so one stray click never
  answers an approval.
- **Drag** over the conversation to select; **double-click** a word,
  **triple-click** a line. Letting go copies the text. Hold the drag at the top
  or bottom edge and the conversation keeps scrolling, so a selection can span
  several screens.

The copy goes to your clipboard (`pbcopy`, `wl-copy`, `xclip`), to tmux's paste
buffer inside tmux, and over SSH to your local terminal (OSC 52). It is plain
text, and a line the screen wrapped is copied as one line. The status row says
`copied N characters · Shift+drag selects in the terminal` — Shift-drag
(Option-drag in iTerm2) gives you the terminal's own selection instead.

To leave the mouse to the terminal altogether, set
[`mouse: false`](./config-reference.md#mouse) in `~/.iota.yaml`.

### Line breaks in the composer

**Ctrl+J** is the one that always works: it reaches iota as a different key
from Enter in every terminal, with nothing to configure (unless a tmux plugin
such as vim-tmux-navigator has bound `C-j`). The other two depend on what your
terminal sends:

- **Alt+Enter** inserts a line break in Ghostty and tmux by default, and in
  Terminal.app with *Use Option as Meta key* on — without it, Option+Enter is a
  plain Enter and sends. Windows Terminal takes Alt+Enter for full screen by
  default.
- **Shift+Enter** inserts a line break where the terminal sends it as a key of
  its own; in most terminals it is a plain Enter and sends.
- **Ghostty's default config** sends Shift+Enter in a form iota cannot read, so
  it does nothing at all. Add this line to Ghostty's config file
  (`ghostty +edit-config` opens it) and reload the config or restart Ghostty:

  ```text
  keybind = shift+enter=text:\n
  ```

  Shift+Enter then sends what Ctrl+J sends, and it works through tmux too.
- **Ctrl+Enter** stays a send. Most terminals send it as a plain Enter; in
  Ghostty's default config it, too, does nothing.

The composer grows with the rows a draft wraps to, and a queued message with
line breaks shows each one as `⏎`.

### A reply that never comes

Esc and Ctrl+C always work, at any point of a request — press either to stop
waiting. If you leave it, a provider that stops sending is not waited on
forever: a streamed reply that sends no byte for **300 seconds** fails with
`Response stalled` and is **not retried**. What the turn finished before the
stall is kept — its tool calls and their results, and the partial reply,
marked as cut short — so sending your message again picks up from there; if
it keeps happening, check the provider's `url` and the model. The 300 seconds
is fixed, not a setting. A reply that fails after its text has reached the
screen is **not retried** either: the failure is shown once, and what arrived
is kept the same way, marked as possibly incomplete. A failure before any text
arrives is still retried. While the request is out, the status row says
`Waiting for the model`, and `Waiting for the first token` once the provider
has answered; its clock counts the whole turn, from the moment you sent the
message.

### Rate limits and Esc

A finished [background job](./builtin-toolsets.md#background-jobs) normally
wakes the model on its own. Two things stop that, so that iota does not keep
starting turns nobody asked for:

- **A rate limit or a usage cap.** When a turn ends in `Rate limited (429)` —
  after at most three more tries — notices from jobs that finish afterwards
  wait instead of each starting a new attempt. Each leaves a dim line:

  ```text
  ⏸ [background job b2 finished] — held until 17:42
  ```

  At that time iota tries once more with everything waiting (`▶ Trying again
  with 2 held notice(s)`): when the provider's `retry-after` says it may,
  otherwise a minute after the refusal, then less and less often, at most
  every 30 minutes. A try that is refused again leaves one dim line —
  `⏸ Still rate limited (429) — 2 notice(s) held; next try 18:12` — not
  another error block. **Sending a message tries at once** and takes the
  waiting notices with it; switching to another model or provider with
  `/model` tries at once there. Your own messages are never overtaken by
  these tries. The provider's own message, with its reset time if it gives
  one, is shown with the first refusal.
- **Esc or Ctrl+C.** Notices queued behind the turn you stopped, and any that
  arrive afterwards, wait the same way (`⏸ … — held; it goes with your next
  message`) and go with your next message. Nothing restarts until you speak.

A provider that asks to wait more than a minute — with a 429 or any other
error — is not waited out in silence either: iota stops and holds until then
(a day at the most, however long it asks), unless the provider explicitly
insists on being retried. A message [from another
program](./quick-start.md#messaging-a-running-chat) is not held: it goes at
once, as something you typed would.

## Supported file types

| Type | Extensions |
|------|-----------|
| Images | `.jpg`, `.jpeg`, `.png`, `.gif`, `.webp` |
| Documents | `.pdf` |
| Text | `.txt`, `.md`, `.rs`, `.py`, `.js`, `.ts`, `.jsx`, `.tsx`, `.java`, `.c`, `.cpp`, `.h`, `.rb`, `.sh`, `.json`, `.yaml`, `.yml`, `.toml`, `.xml`, `.html`, `.css`, `.sql`, `.csv`, `.log`, `.ini`, `.cfg`, `.conf`, and more |
