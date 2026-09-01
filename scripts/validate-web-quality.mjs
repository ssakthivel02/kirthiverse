import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8')
const parse = (relativePath) => JSON.parse(read(relativePath))
const failures = []
let checks = 0
const BRAND = 'ArivuKids'
const ORIGIN = 'https://arivukids.omsaravanabhava.org'
const DOMAIN = 'arivukids.omsaravanabhava.org'

function check(condition, message) {
  checks += 1
  if (!condition) failures.push(message)
  else console.log(`✓ ${message}`)
}

function attribute(html, selectorName, selectorValue, attributeName = 'content') {
  const escaped = selectorValue.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const patterns = [
    new RegExp(`<meta[^>]+${selectorName}=["']${escaped}["'][^>]+${attributeName}=["']([^"']+)["'][^>]*>`, 'i'),
    new RegExp(`<meta[^>]+${attributeName}=["']([^"']+)["'][^>]+${selectorName}=["']${escaped}["'][^>]*>`, 'i'),
  ]
  return patterns.map((pattern) => html.match(pattern)?.[1]).find(Boolean) ?? null
}

const index = read('index.html')
const routeEffects = read('src/components/RouteEffects.tsx')
const searchPage = read('src/pages/Search.tsx')
const sitemap = read('public/sitemap.xml')
const robots = read('public/robots.txt')
const openSearch = read('public/opensearch.xml')
const release = parse('public/release-status.json')
const packageJson = parse('package.json')
const workflow = read('.github/workflows/deploy-frontend.yml')
const cname = read('public/CNAME').trim()

const title = index.match(/<title>([^<]+)<\/title>/i)?.[1] ?? ''
const description = attribute(index, 'name', 'description') ?? ''
const canonical = index.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i)?.[1] ?? ''
const robotsMeta = attribute(index, 'name', 'robots') ?? ''
const jsonLdText = index.match(/<script\s+type=["']application\/ld\+json["']>([\s\S]*?)<\/script>/i)?.[1]?.trim() ?? ''
let jsonLd = null
try { jsonLd = JSON.parse(jsonLdText) } catch {}

check(index.includes('<html lang="en">'), 'Document declares its primary language')
check(index.includes('width=device-width, initial-scale=1.0'), 'Viewport supports responsive layout')
check(!/maximum-scale|user-scalable\s*=\s*no/i.test(index), 'Viewport does not block browser zoom')
check(title.length >= 25 && title.length <= 65, 'Static title has a search-friendly length')
check(description.length >= 110 && description.length <= 180, 'Static description has a useful search-friendly length')
check(robotsMeta.includes('index') && robotsMeta.includes('max-snippet:-1'), 'Public shell publishes explicit crawler guidance')
check(canonical === `${ORIGIN}/`, 'Public shell canonical targets the legacy custom domain')
check(attribute(index, 'property', 'og:type') === 'website', 'Open Graph type is present')
check(attribute(index, 'property', 'og:site_name') === BRAND, 'Open Graph site name is present')
check(attribute(index, 'property', 'og:locale') === 'en_GB', 'Open Graph locale matches the primary launch locale')
check(Boolean(attribute(index, 'property', 'og:title')), 'Open Graph title is present')
check(Boolean(attribute(index, 'property', 'og:description')), 'Open Graph description is present')
check(attribute(index, 'property', 'og:url') === canonical, 'Open Graph URL matches the canonical URL')
check(attribute(index, 'name', 'twitter:card') === 'summary', 'Twitter summary-card metadata is present')
check(Boolean(attribute(index, 'name', 'twitter:title')), 'Twitter title metadata is present')
check(Boolean(attribute(index, 'name', 'twitter:description')), 'Twitter description metadata is present')
check(index.includes('rel="search"') && index.includes('/opensearch.xml'), 'Browser search discovery link is present')
check(jsonLd?.['@context'] === 'https://schema.org', 'Structured data uses Schema.org context')
check(jsonLd?.['@type'] === 'WebApplication', 'Structured data describes a web application')
check(jsonLd?.name === BRAND, `Structured data identifies ${BRAND}`)
check(jsonLd?.url === canonical, 'Structured data URL matches the canonical URL')
check(jsonLd?.applicationCategory === 'EducationalApplication', 'Structured data identifies the educational category')
check(jsonLd?.isAccessibleForFree === true, 'Structured data accurately marks the current web experience as free to access')
check(Array.isArray(jsonLd?.inLanguage) && jsonLd.inLanguage.includes('en') && jsonLd.inLanguage.includes('ta'), 'Structured data publishes English and Tamil language intent')
check(!/<script[^>]+src=["']https?:\/\//i.test(index), 'Application shell loads no third-party scripts')
check(!/<iframe\b/i.test(index), 'Application shell embeds no third-party frames')
check(!/(google-analytics|googletagmanager|gtag\(|facebook pixel|doubleclick|hotjar|mixpanel|segment\.com)/i.test([index, routeEffects, searchPage].join('\n')), 'Public experience contains no behavioural tracking markers')
check(index.includes('strict-origin-when-cross-origin'), 'Application shell uses a restrictive referrer policy')
check(index.includes('application-category" content="Education"'), 'Application shell declares the education category')
check(index.includes('mobile-web-app-capable" content="yes"'), 'Application shell declares mobile web-app capability')

check(routeEffects.includes('PUBLIC_ROBOTS') && routeEffects.includes('PRIVATE_ROBOTS'), 'Route metadata distinguishes public and personalised indexing')
check(routeEffects.includes('noindex, nofollow, noarchive, nosnippet'), 'Personalised routes receive strict no-index metadata')
check(routeEffects.includes('link[rel="canonical"]'), 'Route changes update the canonical URL')
check(routeEffects.includes('meta[name="description"]'), 'Route changes update the description')
check(routeEffects.includes('meta[property="og:title"]') && routeEffects.includes('meta[property="og:url"]'), 'Route changes update Open Graph metadata')
check(routeEffects.includes('meta[name="twitter:title"]'), 'Route changes update Twitter metadata')
check(routeEffects.includes("canonicalPath = metadata.indexable ? location : '/'"), 'Personalised routes canonicalise to the public root')
check(routeEffects.includes("document.body.dataset.route = location"), 'Rendered pages expose a deterministic route marker for diagnostics')

check(searchPage.includes("new URLSearchParams(window.location.search).get('q')"), 'Search supports direct q query URLs')
check(searchPage.includes('MAX_QUERY_LENGTH = 120'), 'Search query length is bounded')
check(searchPage.includes('type="search"') && searchPage.includes('autoComplete="off"'), 'Search input uses appropriate browser semantics')
check(searchPage.includes('77 lessons and 77 quiz questions'), 'Search publishes the current validated catalogue totals')
check(!searchPage.includes('autoFocus'), 'Search does not unexpectedly steal focus on route entry')
check(searchPage.includes('aria-live="polite"'), 'Search result changes are announced politely')

const sitemapUrls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1])
const personalisedPaths = ['/today', '/practice', '/mistake-review', '/study-planner', '/activity', '/learning-notes', '/bookmarks', '/progress-report', '/weekly-review', '/family-goals', '/wellbeing', '/platform-health', '/dashboard', '/parent-dashboard', '/teacher-dashboard', '/profile', '/settings', '/onboarding', '/achievements', '/leaderboards']
const subjectPaths = ['mathematics', 'science', 'english', 'coding', 'geography', 'history', 'tamil', 'music', 'arts', 'life-skills']
check(sitemapUrls.length >= 25, 'Sitemap contains the expected public learning and trust resources')
check(new Set(sitemapUrls).size === sitemapUrls.length, 'Sitemap contains no duplicate URLs')
check(sitemapUrls.every((url) => url.startsWith(`${ORIGIN}/`)), 'Every sitemap URL uses the legacy custom domain')
check(personalisedPaths.every((route) => !sitemapUrls.some((url) => new URL(url).pathname === route)), 'Sitemap excludes personalised learner and family routes')
for (const subject of subjectPaths) check(sitemapUrls.includes(`${ORIGIN}/subject/${subject}`), `Sitemap includes public subject world: ${subject}`)
check(robots.includes(`Sitemap: ${ORIGIN}/sitemap.xml`), 'robots.txt publishes the legacy sitemap')
for (const route of personalisedPaths) check(robots.includes(`Disallow: ${route}`), `robots.txt excludes personalised route: ${route}`)
check(!robots.includes('Disallow: /learning-worlds'), 'robots.txt permits public Learning Worlds discovery')
check(!robots.includes('Disallow: /teacher-resources'), 'robots.txt permits public Teacher Resources discovery')

check(openSearch.includes(`<ShortName>${BRAND}</ShortName>`), `OpenSearch descriptor identifies ${BRAND}`)
check(openSearch.includes('/search?q={searchTerms}'), `OpenSearch descriptor targets local ${BRAND} search`)
check(openSearch.includes('method="get"'), 'OpenSearch descriptor uses a non-mutating GET request')
check(!openSearch.includes('http://arivukids.'), 'OpenSearch descriptor contains no insecure legacy URL')
check(cname === DOMAIN, 'CNAME matches the legacy custom domain')

check(release.rootDomainDeploymentContract === true, 'Release status preserves the root-domain deployment contract')
check(release.localFirst === true && release.cloudChildProfiles === false, 'Release status preserves the local-first child-data boundary')
check(release.subjects === 10 && release.lessons === 77 && release.quizQuestions === 77, 'Release status publishes accurate catalogue totals')
check(Array.isArray(release.qualityGates) && release.qualityGates.includes('metadata-and-discoverability-contract'), 'Release status publishes the metadata contract gate')
check(Array.isArray(release.qualityGates) && release.qualityGates.includes('tracking-free-public-shell'), 'Release status publishes the tracking-free shell gate')
check(packageJson.scripts?.['validate:web'] === 'node scripts/validate-web-quality.mjs', 'Package registers the web-quality validator')
check(workflow.includes('pnpm run validate:web'), 'GitHub Actions executes the web-quality gate')
check(workflow.includes('web-quality.log'), 'GitHub Actions retains web-quality diagnostics')

if (failures.length) {
  console.error('\nWeb-quality validation failed:')
  failures.forEach((failure) => console.error(`✗ ${failure}`))
  process.exit(1)
}

console.log(`\n✓ Web-quality gate passed (${checks} discoverability, privacy, search and metadata controls)`)
