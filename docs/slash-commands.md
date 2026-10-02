---
id: slash-commands
title: Slash commands
description: Every slash command available in an interactive session, and the keys that drive it.
sidebar_label: Slash commands
---

# Slash commands

In interactive mode, the following commands are available. When the line starts
with `/`, a suggestion row appears below the input and narrows as you keep typing;
press Tab to cycle through the completions. Commands that do not apply to the
current session (for example `/edit` on a text provider) are not offered at all,
and an unknown `/word` is sent as a normal message.

| Command | Description |
|---------|-------------|
| `/file [path]` | Attach a file (image, PDF, or text). With a path, attaches directly. With no path, opens a tabbed selector: "Attached" to remove attachments, "Add" to pick one from a directory browser. |
| `/edit [prompt]` | Edit a generated image by re-sending it as this turn's reference. With a prompt it takes the newest image (consecutive `/edit`s iterate). With no prompt it opens a picker — preview on the left, every image this session generated on the right (newest first, labeled by its prompt, clickable path below) — and after you choose, type the prompt in the composer. Dedicated image providers (`type: imagen` / `images`) only. |
| `/redo [prompt]` | Re-send the last request: same reference images, same prompt unless you supply a new one. Bare `/redo` rolls the dice again (image models vary per call); `/redo <reworded prompt>` retries from the *same* canvas, so a rejected result never becomes the next input. Dedicated image providers only. |
| `/session` | Tabbed selector over saved sessions: "Resume" to resume one, "Delete" to multi-select and delete others. A session open in another iota process is skipped by Delete, and a [bot](./bot-mode.md)'s session is neither offered nor deleted; inside a bot, `/session` is not a command. |
| `/save [title]` | Start persisting an ephemeral session (one started with `--no-save` or `no_save: true`): the whole backlog is written at once and auto-save continues from then on. An optional title is kept as-is; otherwise the model-generated one is used. Only offered while the session is ephemeral. |
| `/model` | Tabbed settings for the current session: "Model" picks the model (a combo box over the agent's choices — type to filter, or type a model name nothing lists and commit that), "Context" the context window, "Effort" the reasoning effort (`default`, `low`, `medium`, `high`, `xhigh`, `max` — passed to the provider verbatim, so a level the model doesn't support surfaces as an API error and you pick another), "Temperature" a slider (`default` omits the parameter), and a read-only "System" tab showing the [system prompt](./system-prompt.md) exactly as sent — harness, your instructions and the overlay. Enter applies all tabs; only changed values are announced. Picking another model re-evaluates the four layered parameters against it — a window or effort the session inherited from the model it leaves is dropped, one you set here yourself is kept (see [the four layered parameters](./config-file.md#the-four-layered-parameters)). The rows are `agents.<name>.models`: `models:` entries and inline `provider:id`s as they are, every `provider:*` listed at once — a source that cannot answer costs only its own rows, named in the panel's dim subtitle, and the input row stays open either way. A row on another provider is reported rather than applied, with the `iota run <agent> -M provider:id` that starts a run there (see [the choices](./config-file.md#the-choices-are-what-model-offers)). Image providers get their own tabs instead (see [Image generation](./image-generation.md)). |
| `/compact [hint]` | Summarize older history to free context; optional hint guides what to keep. Offered only while token accounting is live. |
| `/export [file]` | Export the conversation (saved sessions: the full on-disk log, so compaction never hides older rounds) to a single self-contained HTML file — the default — or Markdown with a `.md`/`.markdown` extension. With no argument, a selector picks the format and the filename is generated from the session title. Never overwrites an existing file. |
| `/status` | Show provider, model, context usage, and last-turn token counts. |
| `/jobs` | Two tabs over the background jobs, refreshed every second: "Jobs" is a single-select list — id, elapsed, command; pick one for its full command, clock, pid, output file and the last lines of its output (Esc returns to the list) — and "Kill" a multi-select list that ends the jobs you tick (Space toggles, Enter kills; each one's notice lands as `killed`). Exists only while a job is running: a `shell` call that yielded after 20 s, or one started with `background: true` (see [Background jobs](./builtin-toolsets.md#background-jobs)). |
| `/tools` | Tabbed read-only view of the model's capabilities: a "Tools" tab (every built-in and MCP tool with its source) and an "MCP" tab (server status, endpoints, and tools). |
| `/debug [on\|off]` | Request inspector. `/debug on` / `/debug off` toggle recording of API round trips (a `debug` marker appears in the status row while on); bare `/debug` opens the two-tab console — "Messages" (newest first, drill into a request/response pair) and the "Verbose" switch. Recording is off by default and MCP traffic is not recorded. |
| `/skills [name [instructions]]` | Bare `/skills` lists discovered agent skills — name, source (project/user), description, and any invalid skills that were skipped. `/skills <name>` runs one: its instructions (plus anything you add after the name) are sent as the message. Agent mode only; every discovered skill also shows up as a completion row. |

Attached files are sent with your next message, then cleared automatically.

## Keys

| Key | What it does |
|-----|--------------|
| **Tab** | Cycle through the slash-command completions in the suggestion row. |
| **Esc** | Cancel the innermost running scope — a streaming reply, or a running `shell` call. |
| **Ctrl+C** | Cancel the turn. |
| **Enter** | Send. You can keep typing while a reply streams; queued submits are sent in order. **Ctrl+Enter** sends too. |
| **Ctrl+J** | Insert a line break. Works in every terminal. |
| **Alt+Enter**, **Shift+Enter** | Insert a line break where the terminal reports the modifier (below); elsewhere they are a plain Enter and send. |

A reply interrupted with **Esc** or **Ctrl+C** keeps its partial text in the
history, marked interrupted.

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
is fixed, not a setting. While the request is out, the busy row says
`Waiting for the model`, and `Waiting for the first token` once the provider
has answered.

## Supported file types

| Type | Extensions |
|------|-----------|
| Images | `.jpg`, `.jpeg`, `.png`, `.gif`, `.webp` |
| Documents | `.pdf` |
| Text | `.txt`, `.md`, `.rs`, `.py`, `.js`, `.ts`, `.jsx`, `.tsx`, `.java`, `.c`, `.cpp`, `.h`, `.rb`, `.sh`, `.json`, `.yaml`, `.yml`, `.toml`, `.xml`, `.html`, `.css`, `.sql`, `.csv`, `.log`, `.ini`, `.cfg`, `.conf`, and more |
