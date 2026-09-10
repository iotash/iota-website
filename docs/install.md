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
cargo install --git https://github.com/joyqi/iota
```

Requires Rust 1.98 or newer.

## Build from source

```bash
git clone https://github.com/joyqi/iota.git
cd iota
cargo build --release
```

The binary is at `target/release/iota`. The toolchain is pinned by
`rust-toolchain.toml`, which `rustup` picks up automatically; building with
another toolchain needs Rust 1.98 or newer.

## Platforms

macOS and Linux.
