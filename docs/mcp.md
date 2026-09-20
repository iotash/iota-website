---
id: mcp
title: MCP servers
description: stdio and HTTP MCP servers, iota mcp add/list/remove, OAuth 2.1 login, namespaced tools, and deferred loading.
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

## Managing servers: `iota mcp`

`iota mcp` edits the `mcp_servers:` block from the command line, so a server is
one command away rather than a hand-written entry:

```bash
iota mcp add fs -- npx -y @modelcontextprotocol/server-filesystem /tmp   # stdio
iota mcp add fs -e LOG_LEVEL=info --defer "file tools" -- npx -y server-fs
iota mcp add gh --url https://mcp.example.com/mcp --header 'Authorization: Bearer ${env:GH_TOKEN}'
iota mcp add nb --url https://namebeta.com/api/mcp                # asks for the login on the spot
iota mcp list [--scope user|project|all] [--json] [--probe]      # name, transport, file, auth
iota mcp get nb                                                  # the entry as declared
iota mcp remove nb [--scope user|project]
```

**Two scopes, no third file.** `--scope user` (the default) writes
`~/.iota.yaml`, `--scope project` writes `./.iota.yaml`, and `-c <file>` makes
that file the only scope. A project file is shared, so a header or environment
value written there must be a `${…}` reference (`${env:GH_TOKEN}`), never the
secret itself — `add` refuses otherwise. `list` reads both tiers the way a run
merges them (the project entry wins a name), `--probe` connects to each server
and reports the outcome, and `--json` is one array with a stable shape.

**The block is machine-managed.** `add` and `remove` rewrite the `mcp_servers:`
section alone and leave every other byte of the file as you wrote it —
comments, blank lines, the order of the layers. What they do not keep is a
comment *inside* the block: the entries are serialised afresh each time. Adding
a name that already exists in the target file is refused; remove it first.

## OAuth 2.1

A server that answers the first request with `401` (the MCP way of asking for a
login) is one you log in to — nothing to declare, as in Claude Code and Codex:

`iota mcp add --url` probes the endpoint as soon as the entry is written: a
server that answers `401` gets the login right there (the browser opens; `--no-browser`
prints the URL instead, `--no-login` skips it for a script or a machine without a
desktop), a server that answers without one is left alone, and one that cannot be
reached is written anyway with a note. `iota mcp login` is how you log in again,
or later:

```bash
iota mcp login nb            # opens the browser; --no-browser prints the URL instead
iota mcp logout nb           # forgets the tokens (revoking them when the server allows)
```

`login` discovers the authorization server (RFC 9728 → RFC 8414), registers a
client when the server offers it (RFC 7591), and runs the PKCE authorization
code flow: the browser opens (`$BROWSER` when set, else the platform opener;
the URL is printed either way, for a machine without a desktop), a loopback
listener on `127.0.0.1:<random port>/callback` collects the code — or you paste
the redirect URL back into the terminal — and the tokens land in
`~/.iota/mcp/auth/<name>.json` (mode 0600). A token never enters a config
file. At run time the bearer token goes on every request and is refreshed
when the server rejects it; a server with no usable token is reported as
`not logged in: run iota mcp login <name>` and left out of that run while every
other server loads. In the chat, `/tools` shows each server's state, a server
waiting for a login included; the login itself is `iota mcp login <name>` from
the shell, and a new session picks the token up.

`auth:` is optional. Left out, a server is *auto*: with a token file it connects
through OAuth, without one a `401`/`403` at the handshake is reported as
`not logged in: run iota mcp login <name>`, and a server that never asks is
plain HTTP. An entry whose `headers:` carry an `Authorization` header is never
sent to a login — that credential is the one to fix. `auth: oauth` (`--auth
oauth`) forces the login path; `auth: none` (`--auth none`) forbids it, so a
`401` is a plain connection failure.

A login identifies iota one of three ways, in order: the entry's `client_id`
(a client registered out of band — `iota mcp add … --client-id <id>
--client-secret-env VAR`, the secret only ever a `${env:VAR}` reference), else
dynamic registration when the server offers it, else iota's Client ID Metadata
Document (`https://iota.sh/oauth/client.json`) when the server accepts one —
the shape of an authorization server like Logto, which registers nobody. A
pre-registered client's redirect URI must match what was registered, so for it
`login` listens on `127.0.0.1:17801` (or the entry's `redirect_port`,
`--redirect-port` on `add`) and `iota mcp get` shows the `redirect_uri` to
register. The authorization request asks for the scopes the resource names
(plus `offline_access` when the server lists it), carries the RFC 8707
`resource`, and sends `prompt=consent` — a Logto tenant answers a request
without it with a bare `access_denied` after the consent page; a server that
does not know the parameter ignores it.

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
