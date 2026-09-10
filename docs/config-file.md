---
id: config-file
title: The config file
description: providers, models and agents — the three layers of ~/.iota.yaml, and how a name is resolved against them.
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

For individual values: **CLI flag > env var > config file**.

## The three layers

The config has three top-level maps, each answering one question:

| Map | Answers | Keys |
|-----|---------|------|
| `providers:` | *how do I reach the API?* | `type`, `key`, `url` |
| `models:` | *which model, and what does its protocol look like?* | `provider`, `id`, `context_window`, `defer_mode`, image knobs, `effort`/`temperature`/`top_p` defaults |
| `agents:` | *how do I use it?* | `models`, `system`/`system_file`, `tools`, `mcp_servers`, `workspace`, `no_save`, `notify`, `description`, and overrides for the three tunables |

The positional argument is resolved against all three, in that order, then
against the built-in provider types — so `iota reviewer`, `iota sonnet`,
`iota deepseek` and `iota openai -M gpt-4o` all work, and a name defined in
two layers is taken from the higher one.

:::tip

**`agents.default` is what a bare `iota` runs.** With no positional argument
iota falls back to the agent called `default`; a positional argument always
wins over it, and without such an agent the invocation still asks for one.
Only an `agents.default` you wrote counts — an entry the migration layer
synthesised from an old one-layer `providers.default` block does not, and
neither does a `models.default` or a `providers.default`.

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
    context_window: 400k     # context window for compaction accounting (--context-window overrides)
    defer_mode: system-tools # protocol for deferred MCP tools: normal|reference|tool-search|system-tools
    effort: high             # default reasoning effort: low|medium|high|xhigh|max
    temperature: 0.7         # default sampling temperature, 0.0-2.0 (-t and /model override)
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
    workspace: true          # project overlay + skills (what --agent switches on)

  reviewer:
    models: [sonnet]
    system_file: ${appHome}/prompts/reviewer.md  # prompt from a file (inline `system` wins)
    description: Reads a diff and reports what is wrong with it   # documentation of the entry
    effort: high             # overrides the model's default (one level, no deeper)

  scratch:
    models: ["openai:*"]     # a wildcard first entry starts in the model picker
    no_save: true            # start ephemeral (like --no-save); an explicit --resume outranks it
    notify: false            # no desktop notification while the terminal is unfocused (default: on)
```

With this config:

```bash
# The agent named "default": its first model (gpt5 → openai/gpt-5.2), prompt, tools and MCP subset
iota                              # …and with no argument at all, that is what runs
iota default -m "hello"

# A model entry on its own — no agent, so no tools and no system prompt
iota sonnet -m "hello"

# A provider on its own: -M picks the model, config key used, no need for -k
iota openai -m "hi" -M gpt-4o

# -M also takes provider:id, which moves the run to that endpoint
iota default -M "deepseek:deepseek-reasoner" -m "hi"

# CLI flags override the config
iota openai -k sk-override -m "hi" -M gpt-4o
```

`-M` accepts a candidate's name, a bare model id, or `provider:id`. A model
outside the agent's `models:` list is a warning, not a refusal — the list is
advice about what works well here, not a whitelist.

## Migrating from the one-layer config

Earlier versions kept everything under `providers.<name>`. That still works:
iota splits such a block into the three entries it means and prints one line
saying what moved.

```yaml
# before — one layer
providers:
  deepseek:
    type: openai
    key: ${env:DEEPSEEK_KEY}
    url: https://api.deepseek.com/v1
    model: deepseek-chat
    system: "You are terse"
    tools: {code: {}}
    agent: true

# after — three layers
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

Two keys were renamed on the way: a provider's `agent: true` is an agent's
`workspace: true`, and the `agent` toolset is now called `skills`. Both old
spellings are accepted with a warning. The `delegate` toolset was retired: a
`tools: {delegate: …}` key is dropped with a warning instead of failing (a
child agent is now a bash subprocess — see the [`shell`
set](./builtin-toolsets.md#shell--bash)). The compatibility layer will be
removed after 1.0.

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
