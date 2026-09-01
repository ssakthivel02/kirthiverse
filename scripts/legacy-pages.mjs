/**
 * Authoritative manifest of legacy HTML pages deployed to dist/
 * 
 * This list is the single source of truth for:
 * - copy-static-production-files.mjs (source validation)
 * - validate-dist.mjs (deployment validation)
 * 
 * Total: 30 pages (29 legacy + 1 api-status)
 * 
 * Note: history-world.html was removed (not in origin/main)
 */

export const legacyPages = [
  '404.html',
  'ai-tutor.html',
  'api-status.html',
  'art-world.html',
  'coding-world.html',
  'community.html',
  'contact.html',
  'creativity-hub.html',
  'disclaimer.html',
  'download.html',
  'english-world.html',
  'faq.html',
  'features.html',
  'geography-world.html',
  'learning-worlds.html',
  'math-world.html',
  'music-world.html',
  'parent-dashboard.html',
  'parent-hub.html',
  'privacy.html',
  'roadmap.html',
  'safety.html',
  'school-companion.html',
  'school-hub.html',
  'science-world.html',
  'sources.html',
  'support.html',
  'tamil-world.html',
  'terms.html',
  'worlds.html',
];

export const requiredFiles = [
  'CNAME',
  '.nojekyll',
  'js/config.js',
  'js/api-client.js',
  'js/main.js',
];

export const requiredDirs = [
  'js',
];
