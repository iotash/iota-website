---
id: examples
title: Examples
description: Invocations, from an interactive run to headless turns, MCP servers and file attachments.
sidebar_label: Examples
---

# Examples

These assume a config like the one on [the config file](./config-file.md) page
— the agents, models and providers a run names live there, not on the command
line.

```bash
# The default agent, interactively
iota

# A configured agent (its models, prompt, tools and MCP subset)
iota run reviewer

# Pick the model at startup (a `provider:*` candidate, or -M)
iota run scratch
iota run default -M "openai:*"

# Specify the model directly
iota run default -M gpt-4o
iota run default -M "anthropic:claude-sonnet-4-20250514"

# A system prompt for this run only
iota run default -s 'You are a helpful translator' -m "Translate to French: hello"

# Non-interactive mode
iota run default -m "Explain quicksort in one paragraph"

# Non-interactive mode with a JSON report and a tool-turn budget
iota run default -m "Summarise this repo" --output-format json --max-turns 5

# Continue a saved session headlessly (any unique id prefix works)
iota resume k7q -m "And the second question?"

# …or pick one from a list
iota resume

# With MCP tools (ad-hoc server via CLI flag; config servers load automatically)
iota run default --mcp "npx -y @modelcontextprotocol/server-filesystem /tmp"

# Multiple MCP servers
iota run default --mcp "npx -y @modelcontextprotocol/server-filesystem /tmp" --mcp "https://mcp.example.com/sse"

# Read message from stdin (pipe-friendly)
echo "Explain quicksort" | iota run default -m -
cat prompt.txt | iota run default -m -

# One-shot image generation with a dedicated image provider (prints the saved path)
iota run seedream -m "A red bicycle leaning on a stone wall, golden hour"

# What is configured, and what is saved
iota list                     # agents (the default listing)
iota list models reviewer     # that agent's model and choices
iota list providers           # endpoints, and where each key comes from
iota list sessions            # saved sessions, newest first

# The config file itself
iota config init              # write a commented starter config (never overwrites)
iota config check             # load it and report the three layers
iota config path              # which files this invocation reads
```

## File attachment

```
You> /file photo.png
  Attached: photo.png (image/png, 245760 bytes)
You> /file report.pdf
  Attached: report.pdf (application/pdf, 102400 bytes)
You> /file
  (tabbed selector — "Attached" to remove, "Add" to browse and add)
You> Summarize the report and describe the photo
...
```
