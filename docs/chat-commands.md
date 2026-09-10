---
id: chat-commands
title: Chat commands
description: Every slash command available in an interactive session, and the keys that drive it.
sidebar_label: Chat commands
---

# Chat commands

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
| `/session` | Tabbed selector over saved sessions: "Resume" to resume one, "Delete" to multi-select and delete others. |
| `/save [title]` | Start persisting an ephemeral session (one started with `--no-save` or `no_save: true`): the whole backlog is written at once and auto-save continues from then on. An optional title is kept as-is; otherwise the model-generated one is used. Only offered while the session is ephemeral. |
| `/model` | Tabbed settings for the current session: "Model" picks the model, "Context" the context window, "Effort" the reasoning effort (`default`, `low`, `medium`, `high`, `xhigh`, `max` — passed to the provider verbatim, so a level the model doesn't support surfaces as an API error and you pick another), "Temperature" a slider (`default` omits the parameter), and a read-only "System" tab showing the system prompt exactly as sent. Enter applies all tabs; only changed values are announced. Image providers get their own tabs instead (see [Image generation](./image-generation.md)). |
| `/compact [hint]` | Summarize older history to free context; optional hint guides what to keep. Offered only while token accounting is live. |
| `/export [file]` | Export the conversation (saved sessions: the full on-disk log, so compaction never hides older rounds) to a single self-contained HTML file — the default — or Markdown with a `.md`/`.markdown` extension. With no argument, a selector picks the format and the filename is generated from the session title. Never overwrites an existing file. |
| `/status` | Show provider, model, context usage, and last-turn token counts. |
| `/tools` | Tabbed read-only view of the model's capabilities: a "Tools" tab (every built-in and MCP tool with its source) and an "MCP" tab (server status, endpoints, and tools). |
| `/debug [on\|off]` | Request inspector. `/debug on` / `/debug off` toggle recording of API round trips (a `debug` marker appears in the status row while on); bare `/debug` opens the two-tab console — "Messages" (newest first, drill into a request/response pair) and the "Verbose" switch. Recording is off by default and MCP traffic is not recorded. |
| `/skills [name [instructions]]` | Bare `/skills` lists discovered agent skills — name, source (project/user), description, and any invalid skills that were skipped. `/skills <name>` runs one: its instructions (plus anything you add after the name) are sent as the message. Agent mode only; every discovered skill also shows up as a completion row. |

Attached files are sent with your next message, then cleared automatically.

## Keys

| Key | What it does |
|-----|--------------|
| **Tab** | Cycle through the slash-command completions in the suggestion row. |
| **Esc** | Cancel the innermost running scope — a streaming reply, or a running `bash` call. |
| **Ctrl+C** | Cancel the turn. |
| **Enter** | Send. You can keep typing while a reply streams; queued submits are sent in order. |

A reply interrupted with **Esc** or **Ctrl+C** keeps its partial text in the
history, marked interrupted.

## Supported file types

| Type | Extensions |
|------|-----------|
| Images | `.jpg`, `.jpeg`, `.png`, `.gif`, `.webp` |
| Documents | `.pdf` |
| Text | `.txt`, `.md`, `.rs`, `.py`, `.js`, `.ts`, `.jsx`, `.tsx`, `.java`, `.c`, `.cpp`, `.h`, `.rb`, `.sh`, `.json`, `.yaml`, `.yml`, `.toml`, `.xml`, `.html`, `.css`, `.sql`, `.csv`, `.log`, `.ini`, `.cfg`, `.conf`, and more |
