const CACHE_NAME = 'kirthiverse-shell-v4-runtime-20260729'
const COMPILED_ASSET_PREFIX = '/assets/'
const CONNECTIVITY_ENDPOINT = '/__kvs_connectivity__'
const RELEASE_MARKER = 'name="kvs-release-shell" content="KVS-PLATFORM-001"'
const OFFLINE_META = '<meta name="kvs-offline-recovery" content="true">'
const OFFLINE_DOCUMENT_BANNER = '<div id="kvs-offline-document-banner" role="status" aria-live="polite" style="box-sizing:border-box;width:100%;padding:10px 16px;background:#fef3c7;color:#451a03;text-align:center;font:700 14px/1.5 system-ui,-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif">You are offline. Installed lessons and progress saved on this device remain available; cloud services are not in use in this release.</div>'
const CORE_ASSETS = [
  '/',
  '/index.html',
  '/offline.html',
  '/reset-site.html',
  '/manifest.webmanifest',
  '/opensearch.xml',
  '/icons/kirthiverse-icon.svg',
  '/release-status.json',
  '/child-privacy.html',
  '/accessibility.html',
  '/data-retention.html',
  '/grievance.html',
  '/privacy.html',
  '/safety.html',
  '/security.html',
  '/security.txt',
  '/.well-known/security.txt',
  '/parent-guide.html',
  '/acceptable-use.html',
  '/device-storage.html',
]

function compiledAssetUrls(html) {
  return [...html.matchAll(/(?:src|href)=["']([^"']*\/assets\/[^"']+\.(?:js|css))["']/gi)]
    .map((match) => new URL(match[1], self.location.origin).pathname)
    .filter((value) => value.startsWith(COMPILED_ASSET_PREFIX))
    .filter((value, index, values) => values.indexOf(value) === index)
}

function connectivityRequest() {
  return new Request(new URL(CONNECTIVITY_ENDPOINT, self.location.origin), { method: 'GET' })
}

function createConnectivityResponse(offlineRecoveryActive) {
  return new Response(JSON.stringify({ offlineRecoveryActive }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  })
}

async function writeConnectivityState(cache, offlineRecoveryActive) {
  await cache.put(connectivityRequest(), createConnectivityResponse(offlineRecoveryActive))
}

async function readConnectivityState() {
  const cache = await caches.open(CACHE_NAME)
  return (await cache.match(connectivityRequest())) || createConnectivityResponse(false)
}

function isLocalOfflineAudit(request) {
  const url = new URL(request.url)
  return (url.hostname === '127.0.0.1' || url.hostname === 'localhost') && url.searchParams.get('offline-audit') === '1'
}

function requiresCurrentApplicationShell(request) {
  const url = new URL(request.url)
  return url.pathname === '/' || url.pathname === '/index.html' || !url.pathname.split('/').at(-1)?.includes('.')
}

async function isCurrentApplicationShell(response) {
  const contentType = response.headers.get('Content-Type') ?? ''
  if (!contentType.includes('text/html')) return false
  const html = await response.clone().text()
  return html.includes(RELEASE_MARKER) && /\/assets\/[^"']+\.js/.test(html) && /\/assets\/[^"']+\.css/.test(html)
}

async function markOfflineDocument(response) {
  const contentType = response.headers.get('Content-Type') ?? ''
  if (!contentType.includes('text/html')) return response
  let html = await response.text()
  if (!html.includes('name="kvs-offline-recovery"')) html = html.replace(/<head([^>]*)>/i, `<head$1>${OFFLINE_META}`)
  if (!html.includes('id="kvs-offline-document-banner"')) html = html.replace(/<body([^>]*)>/i, `<body$1>${OFFLINE_DOCUMENT_BANNER}`)
  const headers = new Headers(response.headers)
  headers.delete('Content-Length')
  headers.set('Cache-Control', 'no-store')
  return new Response(html, {
    status: response.status,
    statusText: response.statusText,
    headers,
  })
}

async function fetchAndCache(cache, url) {
  const response = await fetch(url, { cache: 'reload' })
  if (!response.ok) throw new Error(`Unable to precache ${url}: ${response.status}`)
  await cache.put(url, response.clone())
  return response
}

async function precacheShell() {
  const cache = await caches.open(CACHE_NAME)
  await cache.addAll(CORE_ASSETS)
  await writeConnectivityState(cache, false)

  const indexResponse = await fetchAndCache(cache, '/index.html')
  const html = await indexResponse.clone().text()
  if (!html.includes(RELEASE_MARKER)) throw new Error('Current release marker is missing from index.html')
  const assets = compiledAssetUrls(html)
  if (!assets.length) throw new Error('No compiled JavaScript or CSS assets were found in index.html')
  await Promise.all(assets.map((asset) => fetchAndCache(cache, asset)))
}

async function notifyClient(clientId, message) {
  if (!clientId) return
  const client = await self.clients.get(clientId)
  client?.postMessage(message)
}

async function notifyAllClients(message) {
  const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
  clients.forEach((client) => client.postMessage(message))
}

self.addEventListener('install', (event) => {
  event.waitUntil(precacheShell())
})

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key.startsWith('kirthiverse-') && key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
      .then(() => notifyAllClients({ type: 'KVS_RELEASE_UPDATED', cacheName: CACHE_NAME })),
  )
})

async function networkFirstNavigation(request, clientId) {
  const cache = await caches.open(CACHE_NAME)
  try {
    if (isLocalOfflineAudit(request)) throw new Error('Local CI offline recovery audit')
    const response = await fetch(request, { cache: 'no-store' })
    if (!response.ok) throw new Error(`Navigation returned ${response.status}`)
    if (requiresCurrentApplicationShell(request) && !(await isCurrentApplicationShell(response))) {
      throw new Error('Navigation returned a stale or incomplete KirthiVerse application shell')
    }
    await cache.put(request, response.clone())
    await writeConnectivityState(cache, false)
    await notifyClient(clientId, { type: 'KVS_CONNECTION_AVAILABLE' })
    return response
  } catch {
    await writeConnectivityState(cache, true)
    await notifyClient(clientId, { type: 'KVS_OFFLINE_RECOVERY' })
    const fallback = (await cache.match(request)) || (await cache.match('/index.html')) || (await cache.match('/offline.html'))
    return fallback ? markOfflineDocument(fallback) : Response.error()
  }
}

async function staleWhileRevalidate(request, event) {
  const cache = await caches.open(CACHE_NAME)
  const cached = await cache.match(request)
  const refresh = fetch(request, { cache: 'no-store' })
    .then(async (response) => {
      if (response.ok) await cache.put(request, response.clone())
      return response
    })
    .catch(() => null)

  if (cached) {
    event.waitUntil(refresh)
    return cached
  }
  return (await refresh) || Response.error()
}

async function cacheFirstDocument(request) {
  const cache = await caches.open(CACHE_NAME)
  const cached = await cache.match(request)
  if (cached) return cached
  try {
    const response = await fetch(request, { cache: 'no-store' })
    if (response.ok) await cache.put(request, response.clone())
    return response
  } catch {
    return (await cache.match('/offline.html')) || Response.error()
  }
}

self.addEventListener('fetch', (event) => {
  const request = event.request
  if (request.method !== 'GET') return
  const url = new URL(request.url)
  if (url.origin !== self.location.origin || url.pathname.startsWith('/api/')) return

  if (url.pathname === CONNECTIVITY_ENDPOINT) {
    event.respondWith(readConnectivityState())
    return
  }

  if (request.mode === 'navigate') {
    event.respondWith(networkFirstNavigation(request, event.clientId))
    return
  }

  if (['style', 'script', 'font', 'image'].includes(request.destination)) {
    event.respondWith(staleWhileRevalidate(request, event))
    return
  }

  if (request.destination === 'document' || CORE_ASSETS.includes(url.pathname)) {
    event.respondWith(cacheFirstDocument(request))
  }
})
