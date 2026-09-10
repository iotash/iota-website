---
id: quick-start
title: Your first run
description: The commands iota takes, the nine flags, and the environment variables that carry API keys.
sidebar_label: Your first run
---

# Your first run

An agent is what you run, and agents live in the config file — so a fresh
install starts by writing one:

```bash
iota config init          # writes ~/.iota.yaml with one provider, one model and agents.default
export OPENAI_API_KEY=…   # or put `key:` in the file
iota                      # runs agents.default
```

## Usage

```bash
iota [command] [flags]
```

| Command | What it does |
|---------|--------------|
| `iota` | Run the agent named `default`, interactively |
| `iota run <agent>` | Run that `agents:` entry, interactively |
| `iota run <agent> -m "…"` | One headless turn: message in, reply out |
| `iota run` | The same as a bare `iota` |
| `iota list [agents\|models\|providers\|sessions]` | What the config declares (no argument: `agents`); `iota list models <agent>` shows one agent's candidate set |
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
| `--system` | `-s` | System prompt for this run (beats the agent's `system:` / `system_file:`) |
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
`agents.<name>.workspace`.

:::

Headless resume (`iota resume <id> -m "…"`) takes what you did not pass from
the session bundle: the model (when the session was recorded under the same
provider type), temperature, reasoning effort, context window and image
settings all replay, and an explicit `-M` still wins. A resumed run prints
`Resumed session <id> (<n> messages)` on stderr, so stdout stays the reply (or
the JSON report) alone; the new turn is appended only when it succeeds.

## Environment Variables

| Variable | Provider |
|----------|----------|
| `OPENAI_API_KEY` | OpenAI / OpenResponses / Images |
| `ANTHROPIC_API_KEY` | Anthropic |
| `GOOGLE_API_KEY` | Gemini / Vertex AI / Imagen |

The API key is **env var > `providers.<name>.key`** — never a flag, so it stays
out of the shell history and out of `ps`. The two per-run flags that overlap the
config (`-M`, `-s`) win over it for that one invocation.
