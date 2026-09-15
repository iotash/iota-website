// https://iota.sh/install.sh — the shell installer of the LATEST release, served here so that
// `curl -fsSL https://iota.sh/install.sh | sh` is the whole install line. The body is GitHub's
// `iota-installer.sh` for the newest tag (cargo-dist writes one per release); this function only
// follows the `releases/latest` redirect and hands the bytes on with a shell content type, so a
// `curl` without -L still gets the script and not a 302.
const SOURCE = 'https://github.com/iotash/iota/releases/latest/download/iota-installer.sh';

export async function onRequestGet() {
  const upstream = await fetch(SOURCE, {redirect: 'follow', cf: {cacheTtl: 300, cacheEverything: true}});
  if (!upstream.ok) {
    return new Response(`#!/bin/sh\necho "iota: the installer could not be fetched from GitHub (${upstream.status})" >&2\nexit 1\n`, {
      status: 502,
      headers: {'content-type': 'application/x-sh; charset=utf-8', 'cache-control': 'no-store'},
    });
  }
  return new Response(upstream.body, {
    status: 200,
    headers: {
      'content-type': 'application/x-sh; charset=utf-8',
      'cache-control': 'public, max-age=300',
      'x-iota-source': SOURCE,
    },
  });
}
