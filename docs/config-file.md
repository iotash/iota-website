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
| `agents:` | *how do I use it?* | `models`, `system`/`system_file`, `tools`, `mcp_servers`, `workspace`, `no_save`, `notify`, `description`, and overrides for `context_window`/`effort`/`temperature`/`top_p` |

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
| `anthropic:*` | every model the provider lists, fetched when the picker opens |

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
    context_window: 400k     # context window for compaction accounting (an agent may override it)
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
    context_window: 200k     # …as may the window, for an agent that knows how long its chats run

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
# (and brings the models: entry serving that pair, if there is one — otherwise nothing:
#  the parameters of the candidate it replaces do not follow it)
iota run default -M "deepseek:deepseek-reasoner" -m "hi"

# …and provider:* starts in the model picker
iota run default -M "deepseek:*"
```

`-M` accepts a candidate's name, a bare model id, or `provider:id`. A model
outside the agent's `models:` list is a warning, not a refusal — the list is
advice about what works well here, not a whitelist.

## The candidate set is what `/model` offers

`agents.<name>.models` is also the row list of the [`/model`](./slash-commands.md)
picker. Entries and inline `provider:id`s are rows on the spot; every
`provider:*` in the set is a listing request, and **several of them go out at
once** — the wait is the slowest endpoint, not the sum of them, and Esc cancels
all of them together.

A source that cannot answer costs **only its own rows**: `provider: <what went
wrong>` appears as the panel's dim subtitle and everything else is listed as if
that source had never been asked. Nothing takes the picker away from you,
because the picker is a combo box — its input row is open from the first frame,
filters the list as you type, and commits what you typed through a `use "…" as
typed` row. A provider that does not implement a model listing at all (most
relays) is therefore an ordinary case, not a failure mode.

Rows on the endpoint the session is talking to are written bare; rows from
another provider carry it (`relay:vendor/model`). Choosing one of those is
reported rather than applied — a session keeps the endpoint it started on,
since the history it replays is that dialect's own — and the message names the
`iota run <agent> -M provider:id` that starts a run there.

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

## The four layered parameters

`context_window`, `effort`, `temperature` and `top_p` can be written in TWO
layers and changed a third way, in `/model`. Which one wins is one rule, and it
holds at every moment of a session:

| Tier | Says |
|------|------|
| 1. `agents.<name>` | the agent's override — highest, whatever model it drives |
| 2. `models.<name>` | what the model the chat is RUNNING declares |
| 3. the session's current value | what the chat is running under right now — lowest |

**When the config speaks the config decides; when the config is silent your
hand-set value stands.** Adjusting a knob in `/model` is the answer for what no
declaration covers, not a permanent override of one — to change a config for
good, edit it.

That third tier is why iota remembers not just each value but where it came
from, and what happens at each of the four moments follows from it:

| Moment | What happens |
|--------|--------------|
| A new session starts | the two config layers are evaluated: agent, else model, else the built-in default |
| `/model` switches model | evaluated again against the NEW model — and a value the chat had INHERITED from the model it is leaving is dropped rather than carried over, while one you set by hand is kept |
| `/model` changes a knob | no evaluation: the value is yours, it applies at once, and it survives a later switch that finds no declaration |
| `iota resume` | no evaluation: the bundle's values and their origins come back as they were. Only a parameter the bundle never recorded is evaluated |

So switching from a model with a 400k window to one that declares none puts you
back on the default rather than silently keeping 400k — but a window you chose
in the Context tab follows you. And resuming an old session after editing
`agents:` continues that session as it was: the new declaration reaches it the
first time you switch models inside it, so a conversation never changes shape
halfway through because a file on disk did.

Sessions written by older builds have no record of where their values came
from; those values are treated as yours, which is the reading that cannot lose
something you chose.

:::note

`defer_mode` is not one of the four. It lives in `models:` alone and does not
follow the model: the deferring wrapper is built once, at startup, so switching
to a model that asks for a different mode prints a note saying the session
keeps the mode it started with — [deferred MCP tools](./mcp.md#deferred-loading)
are mounted once.

:::

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
