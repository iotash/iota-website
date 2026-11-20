---
id: mcp
title: MCP servers
description: stdio and HTTP MCP servers, iota mcp add/list/remove, approval and per-tool grants, OAuth 2.1 login, namespaced tools, and deferred loading.
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
expansion](./config-reference.md#variable-expansion); every key of an entry,
with its default and its errors, is in the [configuration
reference](./config-reference.md#mcp_serversname).

An agent picks which of them it wants with `mcp_servers:` — a list loads only
those servers, `[]` loads none, and leaving the key out loads all of them:

```yaml
agents:
  default:
    model: gpt5
    mcp_servers: [github]    # load only these MCP servers; [] = none; key absent = all
```

## Approval

**Every MCP tool call asks first**, like a file edit or a shell command:
`github:create_issue <a summary of its arguments> — allow?`. A server process
is not sandboxed — it can read, write, fetch and post with your permissions —
and iota does not guess which tools are safe from their names or
descriptions. The items are:

| Item | What it does |
|---|---|
| `Allow once` | runs this call |
| `Always allow github:create_issue in this session` | runs it, and that one tool stops asking for this session |
| `Always allow github:create_issue in this project` | runs it, and that one tool stops asking in every session and every `-m` run of this project |
| `Deny` | the call does not run; the model is told so |

The two "always" items are [grants](./builtin-toolsets.md#grants): a session
grant comes back with `iota resume` and `/session` and is gone after `/new`,
a project grant lasts until you revoke it. The server's other tools still ask.
To allow **every tool of a server** — those it starts offering later
included — type it with [`/allow`](./slash-commands.md#allow); the dialog
never offers it:

```text
/allow github:search_issues            one tool, this session
/allow github:*                        every tool of the server, this session
/allow project github:*                every tool of the server, this project
```

The server must be connected and the tool one it lists now, so a typo is
refused rather than stored. A grant is keyed by the server's name in
`mcp_servers:` and the tool's own name, not by the `mcp__…` name the model
sees. Grants are listed and taken back in bare `/allow`'s **Grants** tab.

For a server you trust to act unasked everywhere, set `auto_run: true` on its
entry (default `false`) — the config-level form, which still means "never
ask", in a chat and in `-m`, in every project:

```yaml
mcp_servers:
  filesystem:
    command: npx
    args: ["-y", "@modelcontextprotocol/server-filesystem", "${workspaceFolder}"]
    auto_run: true           # its tools run without asking, in a chat and in -m
```

A grant cannot be made for a server that is `auto_run` (`/allow: github's
tools already run without asking (auto_run)`): there is nothing left to ask.

A run with nobody to ask (`-m`) runs a tool that `auto_run` or a project grant
covers, and refuses any other call, telling the model what would allow it:

```text
mcp__github__create_issue was not executed: the tools of MCP server "github" need the user's approval, which this non-interactive run cannot ask for; set `mcp_servers.github.auto_run: true`, or allow it for the project from a chat (/allow project github:create_issue).
```

A `--mcp` server has no entry to put `auto_run` in. Its grants are keyed by
its whole command line (or URL), exactly as passed to `--mcp`, so the same
flag value in a later run is the same server and a different one is not; a
project grant made for it in a chat therefore lets `-m … --mcp …` run that
tool too. Its refusal reads `…; write it as an `mcp_servers` entry with
`auto_run: true`, or allow it for the project from a chat (/allow project
<name>:<tool>).`, where `<name>` is how `/tools` names the server — its URL or
its command's first word. In the **Grants** tab its rows carry the whole flag
value: `this project  npx:push (--mcp npx -y @acme/mcp)`. Two `--mcp` servers
that share that name cannot be told apart by `/allow`; give one an
`mcp_servers:` entry of its own.

:::warning

**Upgrading from before v0.9.0**, when MCP tools ran unasked: a script or CI
job that calls MCP tools in `-m` needs `auto_run: true` on each server it
relies on, or a project grant for the tools it calls.

:::

## Servers in a project file

A project's `./.iota.yaml` is read only once you have
[trusted it](./config-file.md#trusting-a-project-config), and until then none
of its servers is started or logged in to. `iota mcp list --probe` lists an
untrusted file's servers without starting them (`not probed (project config
not trusted)`), and `iota mcp login <name>` refuses one: `cannot log in to
<name>: it is declared in project config … (it is not trusted): run `iota
config trust` to trust it, or pass it with -c`.

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
the shell, and reconnecting the server from its page in `/tools` picks the
token up in the chat you are in (a new session picks it up too).

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

`/tools` is one list of where the model's tools come from: `built in` (the
tools iota ships with) first, then each server, with how many tools it has and
how it stands — the reason in a few words when it is not connected. The list
refreshes while it is open, so a server that finishes connecting in the
background, goes down or is reconnected changes in front of you.

```text
 4 MCP servers · 10 tools · Enter: open · Esc: close
▸ built in  2 tools  available
  dead      3 tools  down: exited (its last stderr line: "mock_mcp: <- tools/list") — its tools will fail until it …
  flaky     3 tools  down: exited (its last stderr line: "mock_mcp: <- tools/list") — its tools will fail until it …
  ok        2 tools  connected
  refused   —        failed: can't reach http://127.0.0.1:1/mcp: connection refused — check the url, and that the s…
```

| State | Means |
|---|---|
| `connected` | the server answered and its tools are offered to the model |
| `connecting…` / `reconnecting…` | still starting; a server being reconnected keeps its tools meanwhile |
| `down` | it connected, then stopped (killed, crashed); its tools are still offered, and a call to them says it has exited |
| `needs login` | an HTTP server with no usable token: `run iota mcp login <name>` |
| `failed` | it never connected; the reason follows |

**Enter opens a source's page; Esc goes back to the list.** A server's page
shows its status, endpoint (the URL, or the whole command line), transport,
login, the names its tools go by (`mcp__<server>__<tool>`), its call timeout,
the full reason it failed or went down — the cause and what it wrote to stderr
— and its tools; a connected stdio server shows its last lines of stderr
instead. The `built in` page lists the built-in tools and nothing else.

**Enter on a server's page reconnects it.** The old process or session is
closed and the server started again in the background; the page shows
`Reconnecting…` and then how it went, and the chat gets one line —
`MCP db reconnected · 3 tools`, or the same `⚠` notice a failed start gets. A
reconnect that fails does not take a server's tools away: one that had tools
stays `down` with them, showing why the new start failed, and Enter tries
again. This is also how a chat picks up a login made with `iota mcp login`
after it started.

## When a server fails

A server that does not connect is reported once, in one line that names it,
says what went wrong and what to check, and points at `/tools` for the rest:

```text
⚠ MCP nb: can't reach https://example.com/mcp: connection refused — check the url, and that the server is running · details in /tools
```

A 404, a 5xx, a web page where the MCP endpoint should be, a command that is
not installed, a server that exits during startup (with its last stderr line),
a handshake that never finishes and a rejected header are each worded this
way. The server's page in `/tools` carries the full cause and its stderr; a
headless `iota run` prints them under the warning. Every other server loads
as usual.

**A server that stops mid-session is marked `down`** — as soon as `/tools` is
opened or a call finds it gone — and the chat says so once:

```text
⚠ MCP db: exited (its last stderr line: "RuntimeError: database connection lost") — its tools will fail until it is reconnected from /tools · details in /tools
```

Its tools are not taken away from the model (that would change the tool list
mid-conversation); a call to one answers that the server has exited and that
it can be reconnected from `/tools`.

**A tool call nobody answers ends at a deadline**, 30 minutes by default: the
call is given up and the model is told the server did not answer in time. The
deadline is a backstop for a server that stopped answering, not a speed limit;
a server whose tools legitimately run longer can raise it with
[`tool_timeout_sec`](./config-reference.md#mcp_serversname) in its entry. There
is no "never": `0` is refused when the config loads, since a headless run or a
bot has no ESC to end a call nobody answers — for a tool that runs for hours,
write a large number. A call that times out does not mark the server down.
