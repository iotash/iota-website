---
id: quick-start
title: Your first chat
description: How iota is invoked, every flag it takes, and the environment variables that carry API keys.
sidebar_label: Your first chat
---

# Your first chat

## Usage

```bash
iota [openai|anthropic|gemini|vertexai|openresponses|imagen|images] [flags]
```

## Flags

| Flag | Short | Description |
|------|-------|-------------|
| `--key` | `-k` | API key (or set via env var) |
| `--url` | `-u` | Custom base URL |
| `--model` | `-M` | Model name (skip interactive selection) |
| `--temperature` | `-t` | Sampling temperature, 0.0-2.0 (omit to use provider default) |
| `--message` | `-m` | Send a single message and print the response (non-interactive, use `-` to read from stdin) |
| `--system` | `-s` | System prompt |
| `--system-input` | `-S` | Enter system prompt interactively (interactive mode only) |
| `--list` | `-l` | List configured providers, or models for a given provider |
| `--mcp` | | MCP server (command string or URL, repeatable) |
| `--resume` | | Resume a saved session (`--resume` to pick interactively, `--resume=<id>` for a specific one — note the `=`; any unique id prefix works). With `-m`, `--resume=<id>` continues that session headlessly |
| `--no-save` | | Start ephemeral — nothing touches disk unless `/save` is run (interactive mode only) |
| `--max-turns` | | Limit agentic tool turns for the whole run (`-m` only; 0 = unlimited) |
| `--output-format` | | `-m` output: `text` (default, the reply alone) or `json` (one result object with per-round token usage) |
| `--context-window` | | Context window size for compaction accounting (e.g. `200k`, `1m`; default 128k) |
| `--agent` | | Enable agent mode (AGENTS.md overlay, skills, `load_skill`, project-scoped sessions) |
| `--config` | `-c` | Path to config file (default: `~/.iota.yaml`) |

Headless resume (`-m` with `--resume=<id>`) takes what you did not pass from
the session bundle: the model (when the session was recorded under the same
provider type), temperature, reasoning effort, context window and image
settings all replay, and an explicit flag always wins. A resumed run prints
`Resumed session <id> (<n> messages)` on stderr, so stdout stays the reply (or
the JSON report) alone; the new turn is appended only when it succeeds.

## Environment Variables

| Variable | Provider |
|----------|----------|
| `OPENAI_API_KEY` | OpenAI / OpenResponses / Images |
| `ANTHROPIC_API_KEY` | Anthropic |
| `GOOGLE_API_KEY` | Gemini / Vertex AI / Imagen |

For individual values the order is **CLI flag > env var > config file**.
