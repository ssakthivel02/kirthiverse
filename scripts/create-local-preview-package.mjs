import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const dist = path.join(root, 'dist')

if (!fs.existsSync(path.join(dist, 'index.html'))) {
  throw new Error('dist/index.html is missing; build the preview before creating launchers')
}

const cmd = `@echo off
setlocal
cd /d "%~dp0"
echo.
echo Starting the KirthiVerse local preview...
echo This launcher does not require Node.js or internet access.
echo.
powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0START_KIRTHIVERSE_PREVIEW.ps1"
set "KVS_EXIT=%ERRORLEVEL%"
if not "%KVS_EXIT%"=="0" (
  echo.
  echo KirthiVerse preview could not start. Error code: %KVS_EXIT%
  echo Read LOCAL_PREVIEW_README.txt for recovery steps.
  pause
)
endlocal & exit /b %KVS_EXIT%
`

const powershell = `$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath $PSScriptRoot

$Root = [System.IO.Path]::GetFullPath($PSScriptRoot)
$RootPrefix = $Root.TrimEnd([System.IO.Path]::DirectorySeparatorChar) + [System.IO.Path]::DirectorySeparatorChar
$Address = [System.Net.IPAddress]::Loopback
$Port = 4173
$PreviewUrl = 'http://127.0.0.1:4173/'
$Utf8 = [System.Text.UTF8Encoding]::new($false)
$Ascii = [System.Text.Encoding]::ASCII
$CrLf = [string][char]13 + [string][char]10

function Get-ContentType([string]$FilePath) {
  switch ([System.IO.Path]::GetExtension($FilePath).ToLowerInvariant()) {
    '.css' { return 'text/css; charset=utf-8' }
    '.html' { return 'text/html; charset=utf-8' }
    '.ico' { return 'image/x-icon' }
    '.js' { return 'text/javascript; charset=utf-8' }
    '.json' { return 'application/json; charset=utf-8' }
    '.map' { return 'application/json; charset=utf-8' }
    '.png' { return 'image/png' }
    '.svg' { return 'image/svg+xml' }
    '.txt' { return 'text/plain; charset=utf-8' }
    '.webmanifest' { return 'application/manifest+json; charset=utf-8' }
    '.xml' { return 'application/xml; charset=utf-8' }
    default { return 'application/octet-stream' }
  }
}

function Send-Response {
  param(
    [System.Net.Sockets.NetworkStream]$Stream,
    [int]$Status,
    [string]$Reason,
    [string]$ContentType,
    [byte[]]$Body,
    [hashtable]$Headers,
    [bool]$HeadOnly = $false
  )

  if ($null -eq $Body) { $Body = [byte[]]::new(0) }
  $HeaderText = 'HTTP/1.1 ' + $Status + ' ' + $Reason + $CrLf
  $HeaderText += 'Content-Type: ' + $ContentType + $CrLf
  $HeaderText += 'Content-Length: ' + $Body.Length + $CrLf
  $HeaderText += 'Cache-Control: no-store' + $CrLf
  $HeaderText += 'X-Content-Type-Options: nosniff' + $CrLf
  if ($null -ne $Headers) {
    foreach ($Key in $Headers.Keys) {
      $HeaderText += $Key + ': ' + $Headers[$Key] + $CrLf
    }
  }
  $HeaderText += 'Connection: close' + $CrLf + $CrLf

  $HeaderBytes = $Ascii.GetBytes($HeaderText)
  $Stream.Write($HeaderBytes, 0, $HeaderBytes.Length)
  if (-not $HeadOnly -and $Body.Length -gt 0) {
    $Stream.Write($Body, 0, $Body.Length)
  }
  $Stream.Flush()
}

function Send-TextResponse {
  param(
    [System.Net.Sockets.NetworkStream]$Stream,
    [int]$Status,
    [string]$Reason,
    [string]$Message,
    [bool]$HeadOnly = $false
  )
  $SafeMessage = [System.Net.WebUtility]::HtmlEncode($Message)
  $Html = '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>KirthiVerse preview</title></head><body><main><h1>' + $Status + ' ' + $Reason + '</h1><p>' + $SafeMessage + '</p><p><a href="/">Return to KirthiVerse</a></p></main></body></html>'
  Send-Response -Stream $Stream -Status $Status -Reason $Reason -ContentType 'text/html; charset=utf-8' -Body $Utf8.GetBytes($Html) -Headers @{} -HeadOnly $HeadOnly
}

$Listener = [System.Net.Sockets.TcpListener]::new($Address, $Port)
try {
  try {
    $Listener.Start()
  } catch {
    Write-Host ''
    Write-Host 'KirthiVerse could not use local port 4173.' -ForegroundColor Red
    Write-Host 'Close any previous preview window and run START_KIRTHIVERSE_PREVIEW.cmd again.'
    Write-Host ('Technical detail: ' + $_.Exception.Message)
    exit 2
  }

  Write-Host ''
  Write-Host 'KirthiVerse preview is ready.' -ForegroundColor Green
  Write-Host ('Address: ' + $PreviewUrl) -ForegroundColor Cyan
  Write-Host 'No Node.js installation and no internet connection are required.'
  Write-Host 'Keep this window open. Press Ctrl+C here to stop the preview.'
  Write-Host ''

  Start-Process $PreviewUrl

  while ($true) {
    $Client = $Listener.AcceptTcpClient()
    $Client.NoDelay = $true
    try {
      $Stream = $Client.GetStream()
      $Reader = [System.IO.StreamReader]::new($Stream, $Ascii, $false, 4096, $true)
      $RequestLine = $Reader.ReadLine()
      if ([string]::IsNullOrWhiteSpace($RequestLine)) { continue }

      while ($true) {
        $HeaderLine = $Reader.ReadLine()
        if ($null -eq $HeaderLine -or $HeaderLine.Length -eq 0) { break }
      }

      $Parts = $RequestLine.Split(' ')
      if ($Parts.Length -lt 2) {
        Send-TextResponse -Stream $Stream -Status 400 -Reason 'Bad Request' -Message 'The browser sent an invalid local preview request.'
        continue
      }

      $Method = $Parts[0].ToUpperInvariant()
      $HeadOnly = $Method -eq 'HEAD'
      if ($Method -ne 'GET' -and -not $HeadOnly) {
        Send-Response -Stream $Stream -Status 405 -Reason 'Method Not Allowed' -ContentType 'text/plain; charset=utf-8' -Body $Utf8.GetBytes('Only GET and HEAD are supported.') -Headers @{ 'Allow' = 'GET, HEAD' }
        continue
      }

      $RawTarget = $Parts[1]
      $PathOnly = $RawTarget.Split('?')[0]
      try {
        $DecodedPath = [System.Uri]::UnescapeDataString($PathOnly)
      } catch {
        Send-TextResponse -Stream $Stream -Status 400 -Reason 'Bad Request' -Message 'The requested local path is invalid.' -HeadOnly $HeadOnly
        continue
      }

      if ($DecodedPath -eq '/index.html') {
        Send-Response -Stream $Stream -Status 302 -Reason 'Found' -ContentType 'text/plain; charset=utf-8' -Body $Utf8.GetBytes('Redirecting to KirthiVerse home.') -Headers @{ 'Location' = '/' } -HeadOnly $HeadOnly
        continue
      }

      $RelativePath = $DecodedPath.TrimStart('/').Replace('/', [System.IO.Path]::DirectorySeparatorChar)
      if ([string]::IsNullOrWhiteSpace($RelativePath)) { $RelativePath = 'index.html' }

      $Candidate = [System.IO.Path]::GetFullPath([System.IO.Path]::Combine($Root, $RelativePath))
      $InsideRoot = $Candidate.Equals($Root, [System.StringComparison]::OrdinalIgnoreCase) -or $Candidate.StartsWith($RootPrefix, [System.StringComparison]::OrdinalIgnoreCase)
      if (-not $InsideRoot) {
        Send-TextResponse -Stream $Stream -Status 403 -Reason 'Forbidden' -Message 'The requested path is outside the preview folder.' -HeadOnly $HeadOnly
        continue
      }

      if ([System.IO.Directory]::Exists($Candidate)) {
        $Candidate = [System.IO.Path]::Combine($Candidate, 'index.html')
      }

      if (-not [System.IO.File]::Exists($Candidate)) {
        if ([string]::IsNullOrEmpty([System.IO.Path]::GetExtension($DecodedPath))) {
          $Candidate = [System.IO.Path]::Combine($Root, 'index.html')
        } else {
          Send-TextResponse -Stream $Stream -Status 404 -Reason 'Not Found' -Message 'This preview file was not found.' -HeadOnly $HeadOnly
          continue
        }
      }

      $Bytes = [System.IO.File]::ReadAllBytes($Candidate)
      Send-Response -Stream $Stream -Status 200 -Reason 'OK' -ContentType (Get-ContentType $Candidate) -Body $Bytes -Headers @{} -HeadOnly $HeadOnly
    } catch {
      try {
        if ($null -ne $Stream -and $Stream.CanWrite) {
          Send-TextResponse -Stream $Stream -Status 500 -Reason 'Internal Server Error' -Message 'The local preview server encountered an error.'
        }
      } catch {}
      Write-Host ('Preview request error: ' + $_.Exception.Message) -ForegroundColor Yellow
    } finally {
      if ($null -ne $Reader) { $Reader.Dispose() }
      if ($null -ne $Stream) { $Stream.Dispose() }
      $Client.Dispose()
      $Reader = $null
      $Stream = $null
    }
  }
} finally {
  $Listener.Stop()
}
`

const readme = `KIRTHIVERSE LOCAL PREVIEW
============================

Recommended Windows method
--------------------------
1. Extract this ZIP completely. Do not run it from inside the ZIP viewer.
2. Open the extracted folder.
3. Double-click START_KIRTHIVERSE_PREVIEW.cmd.
4. Keep the black/blue command window open.
5. Your browser opens http://127.0.0.1:4173/ automatically.

This preview launcher uses built-in Windows PowerShell and .NET only.
Node.js, npm, npx, Python and internet access are not required.

Important URL rule
------------------
Use only:

  http://127.0.0.1:4173/

Do not use the production /index.html address for local preview testing.
The production website is:

  https://kirthiverse.omsaravanabhava.org/

Recovery steps
--------------
- If Windows shows a security prompt, select More info and Run anyway only when this ZIP was downloaded from the KirthiVerse GitHub Actions artifact supplied for PR #15.
- If port 4173 is already in use, close any earlier KirthiVerse preview command window and start again.
- If the browser does not open automatically, type http://127.0.0.1:4173/ manually.
- Keep the preview command window open while testing.
- Press Ctrl+C in the preview command window to stop it.

Screen-reader review
--------------------
Start Microsoft Narrator with Windows key + Ctrl + Enter, then test Home, Learning Worlds, one lesson, one quiz, Mistake Review, Parent View and Settings.

Privacy
-------
Use a temporary nickname such as QA Learner. Do not enter a real child's legal name, exact date of birth, address, phone number, Aadhaar or APAAR data.
`

fs.writeFileSync(path.join(dist, 'START_KIRTHIVERSE_PREVIEW.cmd'), cmd, 'utf8')
fs.writeFileSync(path.join(dist, 'START_KIRTHIVERSE_PREVIEW.ps1'), powershell, 'utf8')
fs.writeFileSync(path.join(dist, 'LOCAL_PREVIEW_README.txt'), readme, 'utf8')

console.log('✓ Added dependency-free Windows preview launchers to dist/')
