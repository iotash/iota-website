---
id: config-file
title: The config file
description: providers, models and agents — the three layers of ~/.iota.yaml, how an agent reaches a model, and what the loader refuses.
sidebar_label: The config file
---

# The config file

iota supports YAML config files for persistent settings, models and agents.

## Config lookup order

1. `~/.iota.yaml` or `~/.iota.yml` (global)
2. `./.iota.yaml` or `./.iota.yml` (project-local, merges over global)
3. `-c/--config <path>` (explicit, highest priority, used alone)

Same-name entries in later files override earlier ones, whole entry at a time.

## Priority

The API key is **env var > `providers.<name>.key`** — never a flag, so it stays
out of the shell history and out of `ps`. The two per-run flags that overlap the
config (`-M`, `-s`) win over it for that one invocation.

## The three layers

The config has three top-level maps, each answering one question:

| Map | Answers | Keys |
|-----|---------|------|
| `providers:` | *how do I reach the API?* | `type`, `key`, `url` |
| `models:` | *which model, and what does its protocol look like?* | `provider`, `id`, `context_window`, `defer_mode`, image knobs, `effort`/`temperature`/`top_p` defaults |
| `agents:` | *how do I use it?* | `models`, `system`/`system_file`, `tools`, `mcp_servers`, `workspace`, `no_save`, `notify`, `description`, and overrides for the three tunables |

**A run names an agent.** `iota run <name>` resolves `agents:` and nothing
else: the agent decides which model it drives, and the model decides which
endpoint it talks to. A `models:` or `providers:` entry is reached through an
agent, never named directly — one name meant four things once, and a collision
silently changed what ran.

:::tip

**`agents.default` is what a bare `iota` runs.** With no name iota takes the
agent called `default`; a name always wins over it, and without such an agent
the invocation asks for one. A `models.default` or a `providers.default` says
which model or endpoint it is, never how to drive one, so neither is an entry
point.

:::

## Referring to a model

Wherever a model is named — `agents.<name>.models`, a `models:` shorthand,
`-M` — three forms are accepted:

| Form | Means |
|------|-------|
| `sonnet` | the `models:` entry called `sonnet` |
| `anthropic:claude-sonnet-4` | that model id, on that provider (everything after the FIRST colon is the id, so `openrouter:anthropic/claude-3.5-sonnet` works) |
| `anthropic:*` | every model the provider lists, fetched at startup |

:::warning

**No space after the colon.** `- anthropic: claude-x` is a YAML *mapping*, not
a string; iota says so rather than failing with a type error.

:::

## Example

```yaml title="~/.iota.yaml"
providers:                   # endpoints: how to connect, how to authenticate
  openai:
    key: sk-official
  anthropic:
    key: ${env:ANTHROPIC_KEY}
  deepseek:                  # a custom endpoint
    type: openai             # the underlying provider type
    key: ${env:DEEPSEEK_KEY} # key/url expand ${…} variables
    url: https://api.deepseek.com/v1

models:                      # configured models: provider + id + protocol + defaults
  sonnet: anthropic:claude-sonnet-4-20250514    # shorthand: provider:id
  gpt5:
    provider: openai
    id: gpt-5.2
    context_window: 400k     # context window for compaction accounting (/model's Context tab overrides)
    defer_mode: system-tools # protocol for deferred MCP tools: normal|reference|tool-search|system-tools
    effort: high             # default reasoning effort: low|medium|high|xhigh|max
    temperature: 0.7         # default sampling temperature, 0.0-2.0 (/model overrides)
    top_p: 0.9               # nucleus sampling, 0.0-1.0 (advanced: tune this OR temperature, not both;
                             # reasoning models reject/ignore it — omit to use the provider default)
  chat: deepseek:deepseek-chat

agents:                      # usage: how a model is driven
  default:
    models: [gpt5, sonnet, "deepseek:*"]   # candidate set, best first; the FIRST one is the default
    system: "You are a helpful coding assistant"
    tools:
      code:
      shell:
    mcp_servers: [github]    # load only these MCP servers; [] = none; key absent = all
    workspace: true          # project overlay (AGENTS.md) + skills + project-scoped sessions

  reviewer:
    models: [sonnet]
    system_file: ${appHome}/prompts/reviewer.md  # prompt from a file (inline `system` wins)
    description: Reads a diff and reports what is wrong with it   # documentation of the entry
    effort: high             # overrides the model's default (one level, no deeper)

  scratch:
    models: ["openai:*"]     # a wildcard first entry starts in the model picker
    no_save: true            # start ephemeral (like --no-save); an explicit `iota resume` outranks it
    notify: false            # no desktop notification while the terminal is unfocused (default: on)
```

With this config:

```bash
# The agent named "default": its first model (gpt5 → openai/gpt-5.2), prompt, tools and MCP subset
iota                              # …and with no argument at all, that is what runs
iota run default -m "hello"

# Another agent: its own models, prompt, tools and MCP subset
iota run reviewer -m "what is wrong with this diff?"

# -M picks another model from the candidate set (a warning if it is outside it — the set is advice)
iota run default -M sonnet -m "hi"

# -M also takes provider:id, which moves the run to that endpoint
iota run default -M "deepseek:deepseek-reasoner" -m "hi"

# …and provider:* starts in the model picker
iota run default -M "deepseek:*"
```

`-M` accepts a candidate's name, a bare model id, or `provider:id`. A model
outside the agent's `models:` list is a warning, not a refusal — the list is
advice about what works well here, not a whitelist.

## One layer per key

Every key belongs to exactly one layer, and writing it in another is an error
naming the layer that owns it. The whole document is audited **before** it is
decoded, and five things are fatal:

| What | Example | What you get |
|------|---------|--------------|
| A key of another layer | `providers.p.model` | ``config ~/.iota.yaml: providers.p.model: `model` is now a `models:` entry`` |
| A retired key | `agents.a.tools.delegate` | the toolset was removed — run child agents from bash instead |
| An unknown key | `agents.a.sytem` | the coordinate and the file it is in |
| An unknown top-level key | `agent:` | the same |
| An unknown toolset | `tools: {web: {}}` | the same |

There is no migration layer and no compatibility shim: a key that silently does
nothing is exactly the failure this audit exists to close. (A YAML *syntax*
error still drops the file with a warning, because the parser is the only thing
that knows what went wrong.)

Two keys changed name when the layers split: a provider's `agent: true` is an
agent's `workspace: true`, and the `agent` toolset is now called `skills`. The
`delegate` toolset was removed outright — a child agent is a bash subprocess
now (see the [`shell` set](./builtin-toolsets.md#child-agents)).

```yaml
# what a single-layer config used to look like — every key of it is refused today
providers:
  deepseek:
    type: openai                      # ✓ the endpoint
    key: ${env:DEEPSEEK_KEY}          # ✓
    url: https://api.deepseek.com/v1  # ✓
    model: deepseek-chat              # ✗ → a `models:` entry
    system: "You are terse"           # ✗ → `agents.<name>.system`
    tools: {code: {}}                 # ✗ → `agents.<name>.tools`
    agent: true                       # ✗ → `agents.<name>.workspace`

# the same thing, in three layers
providers:
  deepseek: {type: openai, key: "${env:DEEPSEEK_KEY}", url: https://api.deepseek.com/v1}
models:
  deepseek: deepseek:deepseek-chat
agents:
  deepseek:
    models: [deepseek]
    system: "You are terse"
    tools: {code: {}}
    workspace: true
```

`iota config check` loads the files and reports the three layers, warning when
no `agents.default` exists; `iota config path` prints which files a run reads.

## Variable expansion

Provider values (`key`, `url`), an agent's `system_file` and MCP server values
(`command`, `args`, `url`, `env`, `headers`) support VS Code-style variable
expansion:

| Variable | Expands to |
|----------|-----------|
| `${workspaceFolder}` / `${cwd}` | Current working directory |
| `${userHome}` | User home directory |
| `${appHome}` | iota's global directory (`~/.iota`) |
| `${pathSeparator}` / `${/}` | OS path separator (`/`) |
| `${env:VAR}` | Value of environment variable `VAR` |

Unknown variables are left untouched.
