// https://iota.sh/install.ps1 — the PowerShell installer of the LATEST release, so that
// `powershell -ExecutionPolicy Bypass -c "irm https://iota.sh/install.ps1 | iex"` is the whole
// install line on Windows. Same shape as install.sh.js: GitHub's `iota-installer.ps1` for the
// newest tag, served as text.
const SOURCE = 'https://github.com/iotash/iota/releases/latest/download/iota-installer.ps1';

async function serve(method) {
  const upstream = await fetch(SOURCE, {redirect: 'follow', cf: {cacheTtl: 300, cacheEverything: true}});
  if (!upstream.ok) {
    return new Response(`Write-Error "iota: the installer could not be fetched from GitHub (${upstream.status})"\nexit 1\n`, {
      status: 502,
      headers: {'content-type': 'text/plain; charset=utf-8', 'cache-control': 'no-store'},
    });
  }
  // HEAD gets the headers alone; a 404 there (the static fallback's) would make a tool that probes
  // first give up on a URL that serves.
  return new Response(method === 'HEAD' ? null : upstream.body, {
    status: 200,
    headers: {
      'content-type': 'text/plain; charset=utf-8',
      'cache-control': 'public, max-age=300',
      'x-iota-source': SOURCE,
    },
  });
}

export const onRequestGet = () => serve('GET');
export const onRequestHead = () => serve('HEAD');
