import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8')
const failures = []
let checks = 0

function check(condition, message) {
  checks += 1
  if (condition) console.log(`✓ ${message}`)
  else failures.push(message)
}

const app = read('src/app/App.tsx')
const notFound = read('src/pages/NotFound.tsx')
const launcher = read('scripts/create-local-preview-package.mjs')
const workflow = read('.github/workflows/deploy-frontend.yml')
const packageJson = JSON.parse(read('package.json'))

check(app.includes("import { Redirect, Router, Route, Switch } from 'wouter'"), 'Application imports the declarative redirect component')
check(app.includes('<Route path="/index.html">'), 'Legacy /index.html route is registered')
check(app.includes('<Redirect to="/" replace />'), 'Legacy /index.html route replaces history with the homepage')
check(!notFound.includes("import Header from '../components/Header'"), 'Not-found page does not import the global header')
check(!notFound.includes("import Footer from '../components/Footer'"), 'Not-found page does not import the global footer')
check(!notFound.includes('<Header />'), 'Not-found page does not duplicate the global header')
check(!notFound.includes('<Footer />'), 'Not-found page does not duplicate the global footer')
check(notFound.includes('<main '), 'Not-found page exposes one semantic main landmark')
check(notFound.includes('aria-labelledby="not-found-title"'), 'Not-found page heading labels the main region')
check(notFound.includes('href="/learning-worlds"'), 'Not-found recovery offers Learning Worlds')
check(launcher.includes('START_KIRTHIVERSE_PREVIEW.cmd'), 'Preview package creates a Windows command launcher')
check(launcher.includes('START_KIRTHIVERSE_PREVIEW.ps1'), 'Preview package creates a PowerShell launcher')
check(launcher.includes('LOCAL_PREVIEW_README.txt'), 'Preview package creates plain-language instructions')
check(launcher.includes('http://127.0.0.1:4173/'), 'Preview launcher opens the correct local address')
check(launcher.includes('powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass'), 'Command launcher invokes built-in Windows PowerShell directly')
check(launcher.includes('[System.Net.Sockets.TcpListener]'), 'PowerShell launcher uses a dependency-free loopback TCP server')
check(launcher.includes('[System.Net.IPAddress]::Loopback'), 'Preview server binds only to the local computer')
check(launcher.includes("$Port = 4173"), 'Preview server uses the documented local port')
check(launcher.includes("$Method -ne 'GET'") && launcher.includes("$Method -eq 'HEAD'"), 'Preview server restricts requests to GET and HEAD')
check(launcher.includes("$DecodedPath -eq '/index.html'"), 'Preview server redirects legacy /index.html entry')
check(launcher.includes("$Candidate.StartsWith($RootPrefix"), 'Preview server blocks path traversal outside the extracted folder')
check(launcher.includes("$Candidate = [System.IO.Path]::Combine($Root, 'index.html')"), 'Preview server provides SPA fallback for extensionless routes')
check(launcher.includes('X-Content-Type-Options: nosniff'), 'Preview server adds a MIME-sniffing protection header')
check(launcher.includes('Cache-Control: no-store'), 'Preview server avoids stale local preview caching')
check(!launcher.includes('npx --yes'), 'Preview launcher no longer requires npx')
check(!launcher.includes('serve@14.2.4'), 'Preview launcher no longer downloads an external serving package')
check(!launcher.includes('where node'), 'Preview launcher no longer requires Node.js')
check(launcher.includes('Node.js, npm, npx, Python and internet access are not required.'), 'Preview instructions clearly state the dependency-free design')
check(launcher.includes('Do not use the production /index.html address'), 'Preview instructions prevent production/preview URL confusion')
check(Boolean(packageJson.scripts?.['validate:entry']), 'validate:entry package script is registered')
check(Boolean(packageJson.scripts?.['package:preview']), 'package:preview package script is registered')
check(packageJson.scripts?.check?.includes('validate:entry'), 'Aggregate check includes entry recovery validation')
check(workflow.includes('pnpm run validate:entry'), 'GitHub Actions runs the entry recovery gate')
check(workflow.includes('pnpm run package:preview'), 'Pull-request artifact receives the local preview launchers')
check(workflow.includes("if: github.event_name == 'pull_request'"), 'Preview packaging remains pull-request-only')

if (failures.length) {
  console.error('\nEntry recovery validation failed:')
  failures.forEach((failure) => console.error(`✗ ${failure}`))
  process.exit(1)
}

console.log(`\n✓ Entry recovery gate passed (${checks} controls)`)
