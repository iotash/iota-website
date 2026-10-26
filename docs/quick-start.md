---
id: quick-start
title: Your first run
description: The commands iota takes, the nine flags, and the environment variables iota reads.
sidebar_label: Your first run
---

# Your first run

An agent is what you run, and agents live in the config file — a fresh
install's first run writes one and runs it:

```bash
export OPENAI_API_KEY=…   # or put `key:` in the file afterwards
iota                      # writes ~/.iota.yaml (one provider, one model, agents.default) and runs agents.default
```

## Usage

```bash
iota [command] [flags]
```

| Command | What it does |
|---------|--------------|
| `iota` | Run the agent named `default`, interactively |
| `iota run <agent>` | Run that `agents:` entry, interactively |
| `iota run <agent> -m "…"` | One headless turn: message in, reply out (not for a [bot](./bot-mode.md), which is interactive only) |
| `iota run` | The same as a bare `iota` |
| `iota list [agents\|models\|providers\|sessions]` | What the config declares (no argument: `agents`); `iota list models <agent>` shows one agent's model and choices |
| `iota resume [<id>]` | Resume a saved session — any unique id prefix; with no id, pick from a list |
| `iota config [check\|path\|init]` | Validate the config, print which files it reads, or write a starter one (no argument: `check`) |
| `iota version` | Print the version (`--version` does the same) |

The positional argument is the **command**, never a name from your config, so
`--help` is the complete map of what iota can do and a future command can never
collide with an agent you named.

## Flags

Nine flags, and every one of them describes THIS invocation. Anything that
describes configuration — the key, the endpoint, the temperature, the context
window, the prompt you want every time — lives in [the three config
layers](./config-file.md) instead.

Only `-c/--config` is global; the rest belong to `iota run` (and `iota resume`,
which is a run that starts from a saved session), so they go after the command.

| Flag | Short | Description |
|------|-------|-------------|
| `--message` | `-m` | Send a single message and print the response (non-interactive; `-` reads stdin) |
| `--model` | `-M` | Model for this run: a `models:` entry, a bare id, or `provider:id` (`provider:*` opens the picker) |
| `--system` | `-s` | System prompt for this run (beats the agent's `system:` / `system_file:`; what iota puts around it is on [The system prompt](./system-prompt.md)) |
| `--config` | `-c` | Path to config file (default: `~/.iota.yaml`, then `./.iota.yaml`). Global: valid before or after the command, so `iota -c f.yaml list` and `iota list -c f.yaml` are the same |
| `--mcp` | | MCP server (command string or URL, repeatable) |
| `--no-save` | | Start ephemeral — nothing touches disk unless `/save` is run (interactive only) |
| `--max-turns` | | Limit agentic tool turns for the whole run (`-m` only; 0 = unlimited) |
| `--output-format` | | `-m` output: `text` (default, the reply alone) or `json` (one result object with per-round token usage) |
| `--version` | `-V` | Print the version |

:::warning

`-k/--key`, `-u/--url`, `-t/--temperature`, `-S/--system-input`,
`--context-window` and the boolean `--agent` were removed; the parser refuses
them. The key comes from an environment variable or `providers.<name>.key`, the
URL from `providers.<name>.url`, the temperature and the window from `models:`
or `agents:`, the prompt from `agents.<name>.system`, and agent mode from
`agents.<name>.mode`.

:::

Headless resume (`iota resume <id> -m "…"`) takes what you did not pass from
the session bundle: the provider (by its `providers:` name) and the model,
temperature, `top_p`, reasoning effort, the output ceiling, context window and
image settings all replay. An explicit `-M` still wins — and moves the session
for good, so the next plain resume continues there. A resumed run prints
`Resumed session <id> (<n> messages)` on stderr, so stdout stays the reply (or
the JSON report) alone; the new turn is appended only when it succeeds.

### Messaging a running chat

A session can be open in only one iota process. When `iota resume <id> -m "…"`
finds it open elsewhere — or `iota run <bot> -m "…"` finds that
[bot](./bot-mode.md) running — it does not open it: it hands the message to
that chat over a private Unix socket and prints the chat's receipt on stdout,
one line of JSON as the chat wrote it:

```text
{"ok":true,"state":"woken"}
```

| Receipt | Meaning |
|---|---|
| `woken` | The chat was idle; the message is its next turn. |
| `queued` (with `ahead`) | The chat is busy; the message goes in at the next safe point, after `ahead` others. |
| `held` | Taken, but the chat's tools run without asking (`auto_run`, `auto_write`), so it asks you — *Let the model read it* or *Discard it* — before the model sees it. |
| `blocked` | Not taken: the chat is waiting for you (an approval, a question, a held message). |
| `too-large` | Not taken: the message is over 64 KiB. |
| `refused` | Not taken: another OS user, or a request that is not this protocol (an older or newer one, not JSON, no text). |
| `flooded` | Not taken: too many messages too fast, the same one again within a minute, or eight already waiting. |

Only `ok` matters to the exit status: a receipt with `"ok":false` is printed
too, and the run exits 1. The message never interrupts a running tool call. In
the chat it shows up as a dim `[message from iota -m] …` line, not as
something you typed, and a leading `/` is never run as a command; the model is
told it came from another process and is nobody's approval. It is not held
back after a rate limit or an Esc the way a finished job's notice is (see
[Rate limits and Esc](./slash-commands.md#rate-limits-and-esc)).

Programs started from the chat — its `shell` calls and its stdio MCP servers —
find the chat's socket in `IOTA_SOCKET`, and an `iota … -m` run from there
tells the receiving chat where an answer can go. Only the same OS user can
connect; there is no network listener. Not available on Windows yet: there,
`-m` on a session open elsewhere fails with `… is open in another iota process
(pid N) and cannot be messaged`.

## Environment Variables

| Variable | Provider |
|----------|----------|
| `OPENAI_API_KEY` | OpenAI / OpenResponses / Images |
| `ANTHROPIC_API_KEY` | Anthropic |
| `GOOGLE_API_KEY` | Gemini / Vertex AI / Imagen |

The API key is **env var > `providers.<name>.key`** — never a flag, so it stays
out of the shell history and out of `ps`. The two per-run flags that overlap the
config (`-M`, `-s`) win over it for that one invocation.

Two more, `IOTA_SHELL` and `IOTA_GIT_BASH_PATH`, choose what the `shell`
toolset runs — see [which shell runs it](./builtin-toolsets.md#which-shell-runs-it).

One decides whether the terminal gets colors at all:

| Variable | What it does |
|----------|--------------|
| `NO_COLOR` | Set to any non-empty value ([no-color.org](https://no-color.org)), it turns color off for the run — as does `TERM=dumb`, or a stdout that is not a terminal. The chat itself (replies, tool output, diffs) is then plain text with no escape sequence at all; the frame around it (the composer, the status row, the panels) keeps bold, faint and reverse video so it stays readable, but drops every color. Images still render in color: their pixels are the picture |

Two are for whoever is debugging iota itself — `IOTA_LOG` below, and
`IOTA_DEBUG_REGION` for rendering glitches; every variable of iota's own is in
[the configuration reference](./config-reference.md#environment-variables):

| Variable | What it does |
|----------|--------------|
| `IOTA_LOG` | A file path. When set, iota appends its internal diagnostics there — its own events at debug level, its libraries' (the MCP client, HTTP) at info — one timestamped line each, no color. It is a developer's tap, not a switch for warnings: everything a run wants you to see is printed on stderr or in the chat whether or not this is set. A path that cannot be opened is one `Warning:` line and the run goes on |

And one iota sets rather than reads: every program a chat starts — its `shell`
calls, its stdio MCP servers — finds that chat's socket in `IOTA_SOCKET`, so it
can [message the chat](#messaging-a-running-chat) it came from.
