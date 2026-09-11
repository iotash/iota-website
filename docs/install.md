---
id: install
title: Installation
description: Homebrew, cargo, or a build from source. macOS and Linux.
sidebar_label: Installation
---

# Installation

iota is a single binary. Pick whichever of the three routes below you already
have a package manager for.

## Homebrew

```bash
brew install joyqi/tap/iota
```

## Cargo

```bash
cargo install --git https://github.com/iotash/iota
```

Requires Rust 1.98 or newer.

## Build from source

```bash
git clone https://github.com/iotash/iota.git
cd iota
cargo build --release
```

The binary is at `target/release/iota`. The toolchain is pinned by
`rust-toolchain.toml`, which `rustup` picks up automatically; building with
another toolchain needs Rust 1.98 or newer.

## Platforms

macOS and Linux.

## First run

iota runs agents, and an agent lives in the config file — so the first thing to
do after installing is write one. `iota config init` does it for you:

```bash
iota config init          # writes ~/.iota.yaml with one provider, one model and agents.default
export OPENAI_API_KEY=…   # or put `key:` in the file
iota                      # runs agents.default
```

`iota config check` tells you whether the file says what you think it says, and
`iota config path` which files a run actually reads. `init` refuses to
overwrite an existing config.

From there, [your first run](./quick-start.md) has the commands and the flags,
and [the config file](./config-file.md) has the three layers you will edit.
