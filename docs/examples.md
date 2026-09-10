---
id: examples
title: Examples
description: Invocations, from a plain interactive chat to headless runs, MCP servers and file attachments.
sidebar_label: Examples
---

# Examples

```bash
# Interactive model selection
iota openai -k sk-xxx

# Specify model directly
iota openai -k sk-xxx -M gpt-4o

# Use Anthropic
iota anthropic -M claude-sonnet-4-20250514

# Use Gemini
iota gemini -M gemini-2.5-flash

# Use Vertex AI (with custom endpoint)
iota vertexai -u https://your-proxy.com/api/vertex-ai -M gemini-2.5-flash -m "Hello"

# Use OpenAI Responses API
iota openresponses -M gpt-4o -m "Hello"

# With system prompt
iota openai -M gpt-4o -s 'You are a helpful translator' -m "Translate to French: hello"

# Interactive system prompt input (prompts inside the chat UI before the first message)
iota openai -M gpt-4o -S

# Non-interactive mode (requires -M)
iota openai -M gpt-4o -m "Explain quicksort in one paragraph"

# Non-interactive mode with a JSON report and a tool-turn budget
iota openai -M gpt-4o -m "Summarise this repo" --output-format json --max-turns 5

# Continue a saved session headlessly (any unique id prefix works)
iota openai --resume=k7q -m "And the second question?"

# Adjust temperature
iota anthropic -M claude-sonnet-4-20250514 -t 0.5 -m "Write a haiku"

# Custom API endpoint
iota openai -u https://your-proxy.com/v1 -k sk-xxx

# With MCP tools (ad-hoc server via CLI flag)
iota openai -M gpt-4o --mcp "npx -y @modelcontextprotocol/server-filesystem /tmp"

# Multiple MCP servers
iota anthropic -M claude-sonnet-4-20250514 --mcp "npx -y @modelcontextprotocol/server-filesystem /tmp" --mcp "https://mcp.example.com/sse"

# MCP servers from config file are loaded automatically
iota openai -M gpt-4o

# Read message from stdin (pipe-friendly)
echo "Explain quicksort" | iota openai -M gpt-4o -m -
cat prompt.txt | iota openai -M gpt-4o -m -

# Use a configured agent (its models, prompt and tools)
iota reviewer -m "Explain quicksort"

# Use a configured model on its own
iota sonnet -m "Explain quicksort"

# One-shot image generation with a dedicated image provider (prints the saved path)
iota seedream -m "A red bicycle leaning on a stone wall, golden hour"

# List all configured providers
iota -l

# List available models for a provider
iota -l openai
iota -l deepseek
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
