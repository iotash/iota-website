---
id: config-reference
title: Configuration reference
description: Every key of ~/.iota.yaml, one by one — providers, models, agents and mcp_servers, their types, defaults, accepted values and the error a wrong one gets.
sidebar_label: Configuration reference
---

# Configuration reference

Every key the config file accepts, layer by layer: its type, its default, what
it means, what it accepts, and what you are told when it is wrong. [The config
file](./config-file.md) is the concept page — the three layers, how an agent
reaches a model, the layered parameters; this is the lookup table. Facts are
as of v0.3.2.

## Files, lookup and merge

A run reads, in this order, each file merged over the previous:

| Tier | File | Notes |
|---|---|---|
| user | `~/.iota.yaml`, else `~/.iota.yml` | the first of the two that exists; skipped when there is no home directory |
| project | `./.iota.yaml`, else `./.iota.yml` | in the **working directory**, not the project root; skipped when there is no cwd |
| explicit | `-c/--config <path>` | **alone** — with `-c` neither tier is read, whether or not the file exists |

Merging is by **whole entry**: a `models.gpt` in the project file replaces the
user file's `models.gpt` outright, it does not fill in its missing keys. Within
a tier the four top-level maps are independent, so a project file that only
declares `mcp_servers:` leaves every provider, model and agent of the user file
in place. `${…}` references in `providers.<name>.key`/`url` and
`agents.<name>.system_file` are [expanded](#variable-expansion) once, at merge
time; MCP server values are expanded when the server is started.

What happens to a file that is not right:

| File | What you get |
|---|---|
| missing | silence — a missing tier says nothing about what you meant |
| unreadable (permissions, a directory) | `Warning: config <path>: <error> (ignored)` — the file is dropped, the run goes on |
| not YAML | `Warning: config <path>: <error> (file ignored)` — the parser's own message, since it is the only thing that knows what went wrong |
| a key in the wrong place, misspelled, or unknown | `config <path>: <coordinate>: <message>` — the load **fails**, naming the file and the coordinate (`agents.coder.tools.delegate`); see [Errors](#errors) |
| a reference that points nowhere, a protocol the dialect cannot speak | the same failure, unprefixed, once every file is merged (there is no single file to blame) |

The whole document is audited **before** it is decoded, so a mistake is an
error with a fix rather than a line that silently does nothing.

### The first run writes a starter

A run with no `-c` and no config file at either tier writes `~/.iota.yaml`
itself, names it on stderr —

```text
Wrote /Users/you/.iota.yaml (a starter config: openai + gpt-5.2; edit it, or set OPENAI_API_KEY and go)
```

— and goes on: with `OPENAI_API_KEY` in the environment that is a working
first run, without it the key error says what to set. Nothing is written when
a config exists in either spelling, when `-c` names one, or without a home
directory. `iota config init` writes the same file without running anything.
This is the starter, verbatim:

```yaml title="~/.iota.yaml (as written)"
# iota config. Three layers, each answering one question.
#
#   providers:  how do I reach the API?      (type, key, url)
#   models:     which model, and how does its protocol work?
#   agents:     how is it driven?            (prompt, tools, MCP servers, sessions)
#
# `iota` runs the agent named `default`; `iota run <agent>` runs any other.
# See `iota list agents` and https://iota.sh for the full reference.

providers:
  openai:
    # The key is read from $OPENAI_API_KEY when this is absent — keep it out of the file if you can.
    # key: sk-...
    type: openai

models:
  gpt:
    provider: openai
    id: gpt-5.2
    # context_window: 400k    # what /compact accounts against

agents:
  default:
    model: gpt                # the model the run starts on; choices: (absent here) is what -M and /model offer
    # Your own instructions. iota already tells the model what it runs inside and where (the
    # built-in harness prompt: identity, environment, and its own command line when `shell` is on).
    system: "You are a careful coding assistant."
    tools:
      code:                   # read/write/edit/grep over the project
      shell:                  # shell commands, with a sandbox by default
    # workspace: true         # AGENTS.md overlay, skills, project-scoped sessions

# MCP servers go under a top-level `mcp_servers:` block, which `iota mcp add <name> -- <command>`
# (or `--url <url>`) writes and `iota mcp remove <name>` edits for you.
```

### `iota config`

| Command | Does |
|---|---|
| `iota config check` (the default action) | loads exactly what a run would — every warning on stderr, the first hard error as the run's own — then prints the files read and `OK: N provider(s), N model(s), N agent(s), N mcp server(s)`, with a one-line warning when no `agents.default` exists |
| `iota config path` | prints the files this invocation reads, in merge order, each marked `(missing)` when it is not there — the answer to "why is my change not taking effect" |
| `iota config init` | writes the starter above to `~/.iota.yaml` (or to the `-c` path), refusing a file that exists: `<path> already exists (use -c <path> to write somewhere else)` |

`-c` is global, so `iota -c f.yaml config check` and `iota config check -c
f.yaml` are the same invocation.

## Top level

Exactly four keys are accepted; each is a map from a name you choose to an
entry. A name is any YAML string, and it is what the other layers refer to.

| Key | Holds | Reference |
|---|---|---|
| `providers:` | endpoints — how to reach an API and how to authenticate | [`providers.<name>`](#providersname) |
| `models:` | configured models — which provider serves a model id, and the properties of the model itself | [`models.<name>`](#modelsname) |
| `agents:` | usages — what a run names: a model and its choices, a prompt, tools, MCP servers, session switches | [`agents.<name>`](#agentsname) |
| `mcp_servers:` | the MCP servers an agent may select | [`mcp_servers.<name>`](#mcp_serversname) |

Any other top-level key fails the load:

```text
config ~/.iota.yaml: agnets: unknown top-level key (want providers:, models:, agents:, mcp_servers:)
```

An empty document, and an empty section (`providers:` with nothing under it),
are both fine.

## `providers.<name>`

The endpoint layer: three keys, all optional, and nothing else. A provider is
reached through a model, never named by a run.

| Key | Type | Default | Meaning |
|---|---|---|---|
| `type` | string | the entry's own name | the built-in provider type behind this entry — one of `openai`, `anthropic`, `gemini`, `vertexai`, `openresponses`, `imagen`, `images`. Omit it when the entry is named after its type (`providers.anthropic:`); write it for an alias (`providers.deepseek: {type: openai, …}`). Any other value fails when the run resolves the endpoint: `unknown provider type: opnai (supported: openai, anthropic, gemini, vertexai, openresponses, imagen, images)` |
| `key` | string | `""` | the API key. `${env:VAR}` is expanded at merge time, so the file can name a variable rather than hold a secret. It is the **second** choice: the type's environment variable wins when set (below) |
| `url` | string | `""` = the type's official endpoint | the base URL, for a relay or a self-hosted endpoint. `${…}` expanded at merge time |

A name that no `providers:` entry declares but that **is** a built-in type
(`models.x: anthropic:claude-…` with no `providers.anthropic`) resolves to
that type over an empty entry — the official endpoint, the key from the
environment.

**Where the key comes from.** One rule, used by the run, by `iota list
providers` and by `/model`'s catalog alike: the type's environment variable
when it is set, else `key:`, else nothing — and a run with nothing says
`API key is required: set OPENAI_API_KEY or providers.<name>.key in your
config`. An exported-but-empty variable counts as unset. The variable is
decided by the **type**, not the entry name:

| Type | Variable |
|---|---|
| `openai`, `openresponses`, `images` | `OPENAI_API_KEY` |
| `anthropic` | `ANTHROPIC_API_KEY` |
| `gemini`, `vertexai`, `imagen` | `GOOGLE_API_KEY` |

So two `type: openai` entries — the official one and a relay — both read
`OPENAI_API_KEY` when it is set, whatever their `key:` says; give a relay its
own secret through `key: ${env:RELAY_KEY}` and keep `OPENAI_API_KEY` unset, or
accept that the variable wins.

The two dialects of the OpenAI protocol are two types: `openai` is
chat-completions, `openresponses` the Responses API. The three Google types
share a dialect: `gemini` is the Gemini API, `vertexai` is Vertex AI, and
`imagen` is image generation; `images` is OpenAI-shaped image generation (see
[Image generation](./image-generation.md)).

## `models.<name>`

The model layer. An entry is written in one of two forms:

```yaml
models:
  sonnet: anthropic:claude-sonnet-4-20250514   # shorthand: "provider:id", nothing else
  gpt5:                                        # the full mapping
    provider: openai
    id: gpt-5.2
    context_window: 400k
```

The shorthand must name a provider **and** a model: a bare name has no
endpoint (`models.x: "sonnet" names no provider (want "provider:model")`), and
`provider:*` is a choice list, which only an agent can hold (`models.x:
"openai:*" is a candidate set, not a model (use it in `agents.<name>.choices`)`).
Everything after the **first** colon is the id, so a relay's `vendor/model`
shape survives (`openrouter:anthropic/claude-3.5-sonnet`).

The mapping form takes these twelve keys; the last four parameters are defaults
an agent may [override](#the-four-layered-parameters).

| Key | Type | Default | Meaning |
|---|---|---|---|
| `provider` | string | the entry's own name | the `providers:` entry (or built-in type) that serves this model, so `models.openai: {id: gpt-5.2}` needs no `provider:` line. A name that is neither fails the load: `models.gpt: unknown provider "opnai"` |
| `id` | string | `""` | the wire model id, verbatim. Empty leaves the model unchosen and the run starts in the model picker |
| `context_window` | string | `""` = the built-in default | the budget compaction accounts against. A number with an optional unit suffix — `200000`, `200k`, `1m`, `1.5m`, `2b` (`k`/`m`/`b` = ×1 000, ×1 000 000, ×1 000 000 000; case-insensitive; decimals allowed; whitespace trimmed). Refused when empty (`empty size`), when the number is not positive (`invalid context window size: "abc"`), or when it truncates to zero or overflows (`invalid context window size`) — reported as `config context_window: …` when written here, `agent context_window: …` when written on an agent. Interactive only: `-m` runs never compact |
| `defer_mode` | string | `normal` | the protocol [deferred MCP tools](./mcp.md#deferred-loading) are mounted with. Each mode belongs to a dialect and is checked when the config loads: `normal` (the `search_tools` wrapper) on every type; `reference` (Anthropic's deferred-tool protocol) on `anthropic` only; `tool-search` (the Responses tool-search protocol) on `openresponses` only; `system-tools` (the frozen system-message mount) on `openai` only. A mismatch fails the load — `models.gpt: defer_mode "reference" does not apply to provider type openai (see docs/design/tool-defer.md)`; an unknown spelling is a warning and `normal` is used. Set without any server carrying `defer:`, it is a warning at startup. It lives here and not on an agent because the dialect is fixed by the provider a model points at; two protocols for one model are two entries |
| `effort` | string | `""` = the provider's default | the default reasoning effort: `low`, `medium`, `high`, `xhigh` or `max`, exactly. Anything else: `config effort "extreme": want low|medium|high|xhigh|max`. On the Google dialects (`gemini`, `vertexai`) the five map onto Gemini's three `thinking_level`s — `xhigh` and `max` are sent as `HIGH` rather than refused |
| `temperature` | number | unset = the provider's default | the default sampling temperature, `0.0`–`2.0` inclusive; outside that range the run refuses to start: `config temperature 3: want 0.0-2.0`. On a provider type that has no temperature (the image types) it is a warning and is dropped |
| `top_p` | number | unset = the provider's default | nucleus sampling, `0.0`–`1.0`; outside: `config top_p 1.5: want 0.0-1.0`. Tune this **or** `temperature`, not both, and expect reasoning models to reject or ignore it |
| `image` | boolean | `false` | opts into image generation on a chat provider that needs the request-side switch (`openresponses` advertises the `image_generation` tool, the Google types add `responseModalities`). Redundant on `imagen`/`images` (a warning: they always generate) — see [Image generation](./image-generation.md) |
| `aspect_ratio` | string | `""` = omitted | an image-provider generation default, passed through verbatim (`"3:2"`) |
| `image_size` | string | `""` = omitted | an image-provider generation default, verbatim (`"2K"`, `"1536x1024"` for `images`) |
| `negative_prompt` | string | `""` = omitted | an image-provider generation default, verbatim |
| `json_edits` | boolean | `false` | send image edits as a JSON body instead of multipart — `images` type only; on any other type a warning, and the key is ignored |

The three verbatim image knobs are warned about and dropped on a type that is
not an image provider: `Warning: aspect_ratio/image_size/negative_prompt
apply only to image providers (ignored for type openai)`.

## `agents.<name>`

The usage layer, and the only thing a run can name: `iota run <name>`
resolves this map alone, and a bare `iota` runs `agents.default`. An entry
must have at least one model; everything else is optional.

| Key | Type | Default | Meaning |
|---|---|---|---|
| `model` | a model reference | unset — the run starts in the `/model` picker | the model the run starts on: a `models:` entry name (`sonnet`) or an inline `provider:id` (`anthropic:claude-sonnet-4`). Never a wildcard: `agents.a.model: "openai:*" is a wildcard — put it in choices: and leave model: unset to start in the picker`. Outside `choices` it is a warning, not a refusal. `-M` replaces it for one run; a headless run with neither is refused (`no model chosen: set agents.<name>.model or pass -M`) |
| `choices` | a model reference, or a list of them | every `models:` entry, in declaration order | what `/model` and `-M` offer. Each item is one of three forms: a `models:` entry name (`sonnet`); an inline `provider:id` (`anthropic:claude-sonnet-4`, everything after the first colon being the id); or a wildcard `provider:*`, every model that provider lists, fetched when the picker opens. `choices: sonnet` and `choices: [sonnet]` are the same; the order is the picker's. Errors: `choices: unknown model "sonet"` for an entry name nothing declares, `choices: unknown provider "opnai"` for an inline or wildcard on a provider that is neither configured nor built in — and `- anthropic: claude-x` (a space after the colon, which YAML reads as a mapping) gets `a model reference must be a string like "provider:model", but `anthropic: claude-x` parses as a YAML mapping — remove the space after the colon (`anthropic:claude-x`)` |
| `system` | string | `""` | the system prompt, inline. Wins over `system_file` when both are set; `-s` replaces either for one run. What iota puts around it is on [The system prompt](./system-prompt.md) |
| `system_file` | string | `""` | a file holding the system prompt, read when the run starts; `${…}` [expanded](#variable-expansion) at merge time (`${appHome}/prompts/reviewer.md`). A file that cannot be read fails the run rather than sending an empty prompt: `system_file: open /path: No such file or directory (os error 2)` |
| `tools` | mapping | none | the [built-in toolsets](./builtin-toolsets.md) this agent gets. The **presence of a key** enables the set; its value is the set's configuration (nothing or `{}` = defaults), and any YAML-1.1 false spelling (`false`, `no`, `off`) disables it — the way to switch off `ask`, which is on by default interactively. The four names are `shell`, `code`, `skills`, `ask`; anything else fails the load (`agents.a.tools.web: unknown toolset (want shell, skills, code, ask)`), and the two retired names say what replaced them: `agent` → `the `agent` toolset is now called `skills` (the word `agent` names a config layer)`, `delegate` → `the `delegate` toolset was removed — run child agents from bash instead (see README)`. A set whose value does not decode is a startup warning (`toolset "shell": … (ignored)`), not an error. Naming at least one set here is also what makes iota send its [harness prompt](./system-prompt.md) |
| `mcp_servers` | list of names | key absent | which of the top-level `mcp_servers:` this agent loads. **Absent** = all of them; `[]` = none; a list = exactly those. A name the top-level map does not define fails the run at startup: `mcp_servers: "gh" is not defined under the top-level mcp_servers` |
| `workspace` | boolean | `false` | [agent mode](./agent-mode.md): the AGENTS.md chain and the skills catalog in the system prompt, the `skills` toolset (`load_skill`) enabled on its own, and sessions stored per project. It is the only way in — there is no flag. A run in agent mode that cannot resolve its working directory fails (`failed to resolve working directory: …`) |
| `no_save` | boolean | `false` | start ephemeral, as `--no-save` does: nothing is written until `/save`. An explicit `iota resume` outranks it |
| `notify` | boolean | absent = **on** | the desktop notification sent when a reply lands or the model needs you while the terminal is unfocused. Three states: absent means on, so only an explicit `notify: false` silences it (`notify: true` is the default spelled out) |
| `description` | string | `""` | what the agent is for — documentation of the entry, printed beside the name by `iota list agents`; the model never sees it |
| `context_window` | string | `""` | overrides the model's own, same spelling and same errors (labelled `agent context_window: …`). One level: the agent over the model, no deeper |
| `effort` | string | `""` | overrides the model's default; same five values |
| `temperature` | number | unset | overrides the model's default; same range |
| `top_p` | number | unset | overrides the model's default; same range |

### The four layered parameters

`context_window`, `effort`, `temperature` and `top_p` may be written in both
`models:` and `agents:` — the only keys that may — and the rule is one line:
the agent's value when it has one, else the model's, else the built-in
default, evaluated when a session starts and again whenever `/model` switches
model. It is exactly **one** level of inheritance, deliberately not a chain:
an agent that knows it keeps long conversations says `context_window: 400k`
once instead of forking a `models:` entry per usage. How a value you set by
hand in `/model` fits in is on [the config file](./config-file.md#the-four-layered-parameters).

### Booleans

Every boolean key (`workspace`, `no_save`, `notify`, `image`, `json_edits`,
and the toolsets' `network`, `auto_run`, `auto_write`, `read_only`) takes the
YAML 1.1 spellings in any case, quoted or plain: `true`/`yes`/`on` and
`false`/`no`/`off`. A null value (`workspace:` with nothing after it) reads as
`false` — or, for `notify`, as absent. Anything else fails the decode with
`invalid value: expected a boolean (true/yes/on/false/no/off)`.

## `mcp_servers.<name>`

One MCP server the agents may select. `iota mcp add` writes these entries and
`iota mcp remove` deletes them, rewriting only this block of the file (see [MCP
servers](./mcp.md#managing-servers-iota-mcp)); every key is also fine to write
by hand. A server is either **stdio** (`command`, with `args` and `env`) or
**streamable HTTP** (`url`, with `headers` and the OAuth keys).

| Key | Type | Default | Meaning |
|---|---|---|---|
| `command` | string | `""` | stdio transport: the program to spawn. `${…}` expanded when the server starts |
| `args` | list of strings | `[]` | stdio transport: its arguments, each expanded (`["-y", "@modelcontextprotocol/server-filesystem", "${workspaceFolder}"]`) |
| `url` | string | `""` | streamable-HTTP transport: the endpoint URL, expanded |
| `env` | map of string to string | `{}` | extra environment for the child process; **values** are expanded, names are not |
| `headers` | map of string to string | `{}` | extra HTTP headers; values expanded, names not. An `Authorization` header (any case) makes the entry `auth: none` in effect — you wrote the credential, so a `401` means that one is wrong, not that a login is missing |
| `defer` | string | absent = advertise fully | [deferred loading](./mcp.md#deferred-loading): the presence of the key defers the server, and the value **is** the one-line summary of its tools shown in the manifest — which is why it is a string, not a bool. An empty string is a loud warning and the server is **not** deferred: `Warning: mcp server <name>: defer needs a one-line summary of the server's tools (not deferred)` |
| `auth` | `auto` \| `oauth` \| `none` | `auto` | how an HTTP server is authenticated. `auto` discovers it — a token file when there is one, else the server's own `401` at the handshake; `oauth` forces the login (no token = not logged in, no bare attempt); `none` forbids it (a `401` is a failed connect, and `iota mcp login` refuses the entry). On a stdio server `auth: oauth` fails the load: `mcp_servers.<name>: auth: oauth needs a url (a stdio server has nothing to log in to)` |
| `client_id` | string | `""` = dynamic registration, else the Client ID Metadata Document | an OAuth client registered with the authorization server out of band |
| `client_secret` | string | `""` = a public client | the secret paired with `client_id`, written as a `${env:VAR}` reference and expanded like every other value. Needs a `client_id`: `mcp_servers.<name>: client_secret needs a client_id` |
| `redirect_port` | integer | absent = `17801` | with a `client_id`: the loopback port the registered redirect URI (`http://127.0.0.1:<port>/callback`) was registered with — a pre-registered client's URI must match exactly, so the port is fixed, where a client registered on the spot gets a random one. Needs a `client_id`: `mcp_servers.<name>: redirect_port needs a client_id (only a pre-registered client has a fixed redirect URI)` |

The three client keys describe a login, so any of them on a stdio server
(`mcp_servers.<name>: client_id/client_secret/redirect_port describe an OAuth
login, and a stdio server has nothing to log in to`) or beside `auth: none`
(`… describe an OAuth login, which `auth: none` rules out`) fails the load.
An unknown key here is `mcp_servers.fs.commadn: unknown key (want command,
args, url, env, headers, defer, auth, client_id, client_secret,
redirect_port)`.

**Project scope holds references, not secrets.** `./.iota.yaml` is shared with
everyone who clones the project, so `iota mcp add --scope project` refuses a
header or environment value that is not a `${…}` reference: `mcp: a
project-scope value must reference an environment variable (${NAME}), not the
secret itself: headers.Authorization`. Nothing stops you writing a secret there
by hand; the command will not do it for you.

## Variable expansion

`${…}` references are substituted in these fields and no others:
`providers.<name>.key` and `.url`, `agents.<name>.system_file` (all three at
merge time), and every MCP server's `command`, `args`, `url`, `env` values,
`headers` values, `client_id` and `client_secret` (when the server starts).
Map **keys** — an `env` variable's name, a header's name — are never expanded.

| Variable | Expands to |
|---|---|
| `${env:VAR}` | the environment variable `VAR`; **always** substituted, an unset or empty one becoming the empty string |
| `${workspaceFolder}`, `${cwd}` | the working directory |
| `${userHome}` | the home directory |
| `${appHome}` | iota's own directory, `~/.iota` |
| `${pathSeparator}`, `${/}` | the OS path separator |

One pass, left to right: the result of a substitution is never rescanned, so
a variable whose value is itself `${cwd}` stays literal. A name the table does
not know — or one whose lookup failed (no home, no cwd) — is left untouched as
written, and `${}` is not a reference at all. Names are case-sensitive.

## Errors

The key audit runs on the raw document, before it is decoded, so every message
carries the coordinate the key was written at; the loader prefixes it with the
file. In order of precedence:

| Case | Example | Message |
|---|---|---|
| unknown top-level key | `agnets:` | `agnets: unknown top-level key (want providers:, models:, agents:, mcp_servers:)` |
| a retired key | `providers.p.model` | `providers.p.model: `model` is now a `models:` entry — write `models.<name>: <provider>:<id>` and name it in `agents.<name>.model` (or list it in `choices:`)` |
| | `agents.a.models` | `agents.a.models: `models` is now `choices:` (what /model and -M pick from) plus `model:` (the one the run starts on)` |
| | `providers.p.agent` | `providers.p.agent: `agent` is now `workspace:` on an `agents:` entry` |
| a key of another layer | `providers.p.system` | `providers.p.system: `system` belongs under `agents:` (see README, "The three layers")` |
| | `agents.a.url` | `agents.a.url: `url` belongs under `providers:` (see README, "The three layers")` |
| an unknown key | `providers.p.kye` | `providers.p.kye: unknown key (want type, key, url)` |
| a retired toolset | `agents.a.tools.agent` | `agents.a.tools.agent: the `agent` toolset is now called `skills` (the word `agent` names a config layer)` |
| | `agents.a.tools.delegate` | `agents.a.tools.delegate: the `delegate` toolset was removed — run child agents from bash instead (see README)` |
| an unknown toolset | `agents.a.tools.web` | `agents.a.tools.web: unknown toolset (want shell, skills, code, ask)` |

The four layered parameters are valid in both `models:` and `agents:`, so
neither layer reports the other for them. A `models:` shorthand and a `tools:`
value are not mappings the audit owns, so their contents are checked by the
code that decodes them — the messages above under each key.

There is no migration layer and no compatibility shim. A key that silently did
nothing is the failure this audit exists to close.
