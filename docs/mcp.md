---
id: mcp
title: MCP servers
description: stdio and HTTP MCP servers, namespaced tools, and deferred loading.
sidebar_label: MCP servers
---

# MCP servers

iota connects to external MCP tool servers (filesystem, GitHub, databases,
etc.) and lets an agent call them. Tool names are namespaced per server
(`mcp__<server>__<tool>`), so same-named tools never collide.

## From the command line

`--mcp` takes a command string or a URL and is repeatable:

```bash
# an ad-hoc stdio server
iota run default --mcp "npx -y @modelcontextprotocol/server-filesystem /tmp"

# several at once, stdio and HTTP
iota run default \
  --mcp "npx -y @modelcontextprotocol/server-filesystem /tmp" \
  --mcp "https://mcp.example.com/sse"
```

## From the config file

Servers declared under `mcp_servers:` are loaded automatically, so
`iota run default` already has them:

```yaml title="~/.iota.yaml"
mcp_servers:
  filesystem:
    command: npx
    args: ["-y", "@modelcontextprotocol/server-filesystem", "${workspaceFolder}"]
    env:
      LOG_LEVEL: info

  github:
    url: https://mcp.example.com/sse
    headers:
      Authorization: "Bearer ${env:GITHUB_TOKEN}"
```

`command`, `args`, `url`, `env` and `headers` all go through [variable
expansion](./config-file.md#variable-expansion).

An agent picks which of them it wants with `mcp_servers:` — a list loads only
those servers, `[]` loads none, and leaving the key out loads all of them:

```yaml
agents:
  default:
    models: [gpt5]
    mcp_servers: [github]    # load only these MCP servers; [] = none; key absent = all
```

## Deferred loading

A server can be marked for deferred loading: instead of advertising every
schema on every request, only a `search_tools` entry is advertised and the
model loads that server's tools on demand. The value IS the group's one-line
summary shown in the manifest (that is why it is a string, not a bool). It is
worth it for servers with many tools; leave it unset for small ones.

The **model's** `defer_mode` selects the protocol
(`normal` | `reference` | `tool-search` | `system-tools`; default `normal`) —
and because a protocol belongs to a provider's dialect, a mode the provider
cannot speak is refused when the config loads rather than quietly downgraded:

```yaml
models:
  gpt5:
    provider: openai
    id: gpt-5.2
    defer_mode: system-tools
```

The mode belongs to the session, not to the model you are talking to: the
deferring wrapper is built once, at startup, so switching model with `/model`
prints a note when the model you arrive at asks for a different mode and keeps
the one the session started with. Changing it means a new session.

## Seeing what is connected

`/tools` opens a tabbed read-only view of the model's capabilities: a
**Tools** tab listing every built-in and MCP tool with its source, and an
**MCP** tab with server status, endpoints, and tools.
