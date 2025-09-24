# Create tools folder
New-Item -ItemType Directory -Path ".\tools" -Force | Out-Null

# Create tools\Deploy-Auto.ps1
$script = @'
param(
  [string]$ProjectRoot = ".",
  # Optional: path to your PNG logo; if provided, it will become the site favicon
  [string]$FaviconPng = ".\public\favicon.png",
  [switch]$SkipBuild,
  [switch]$SkipPush
)

function Update-File {
  param([string]$Path, [string]$Content)
  $dir = Split-Path $Path
  if (!(Test-Path $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }
  Set-Content -Path $Path -Value $Content -Encoding UTF8
}

Push-Location $ProjectRoot
try {
  Write-Host "== Working in $(Get-Location) =="

  # 1) Ensure src/assets exists & sync hero images from public if present
  $assets = ".\src\assets"
  New-Item -ItemType Directory -Path $assets -Force | Out-Null

  $pubHero    = ".\public\images\hero.jpg"
  $pubHeroBg  = ".\public\images\hero-bg.jpg"
  $srcHero    = ".\src\assets\hero.jpg"
  $srcHeroBg  = ".\src\assets\hero-bg.jpg"

  if (Test-Path $pubHero)   { Copy-Item $pubHero   $srcHero   -Force }
  if (Test-Path $pubHeroBg) { Copy-Item $pubHeroBg $srcHeroBg -Force }

  if (!(Test-Path $srcHero)) {
    Write-Error "Missing $srcHero. Put your hero photo at public\images\hero.jpg or src\assets\hero.jpg and re-run."
    exit 1
  }
  if (!(Test-Path $srcHeroBg)) {
    Write-Warning "No hero-bg.jpg found; hero background will still work, just without a custom image."
  }

  # 2) Patch src\App.tsx to import the hero images and use them for constants
  $appPath = ".\src\App.tsx"
  if (!(Test-Path $appPath)) { Write-Error "Can't find $appPath"; exit 1 }
  $app = Get-Content $appPath -Raw

  # 2a) Ensure import lines exist (insert right after the React import line)
  if ($app -notmatch "import\s+heroUrl\s+from\s+'\.\/assets\/hero\.jpg';") {
    # Find the first import line that imports from "react"
    $reactImport = [regex]::Match($app, 'import\s+[^;]*from\s+"react";')
    if ($reactImport.Success) {
      $idx = $reactImport.Index + $reactImport.Length
      $inserts = "`r`nimport heroUrl from './assets/hero.jpg';"
      if (Test-Path $srcHeroBg) { $inserts += "`r`nimport heroBgUrl from './assets/hero-bg.jpg';" }
      $app = $app.Insert($idx, $inserts)
      Write-Host "Inserted hero imports after React import."
    }
  }

  # 2b) Normalize constants: HERO_IMAGE_URL = heroUrl; HERO_BG_URL = heroBgUrl;
  # Remove any previous definitions for these constants
  $app = [regex]::Replace($app, 'const\s+HERO_IMAGE_URL\s*=\s*[^;]+;', 'const HERO_IMAGE_URL = heroUrl;', 'Singleline')
  if (Test-Path $srcHeroBg) {
    $app = [regex]::Replace($app, 'const\s+HERO_BG_URL\s*=\s*[^;]+;', 'const HERO_BG_URL = heroBgUrl;', 'Singleline')
  } else {
    # If no bg, set a neutral background URL so code compiles
    $app = [regex]::Replace($app, 'const\s+HERO_BG_URL\s*=\s*[^;]+;', 'const HERO_BG_URL = "";', 'Singleline')
  }

  # 2c) If constants missing entirely, inject them near BUSINESS or at top
  if ($app -notmatch 'const\s+HERO_IMAGE_URL\s*=') {
    $insertAt = [regex]::Match($app, 'const\s+BUSINESS\s*=\s*\{')
    $inject = "const HERO_IMAGE_URL = heroUrl;`r`n"
    $inject += (Test-Path $srcHeroBg) ? "const HERO_BG_URL = heroBgUrl;`r`n" : "const HERO_BG_URL = '' ;`r`n"
    if ($insertAt.Success) {
      $app = $app.Insert($insertAt.Index, $inject)
    } else {
      $app = $inject + $app
    }
    Write-Host "Inserted HERO_* constants."
  }

  # 2d) Ensure the hero section uses the HERO_BG_URL inline style (avoid nested template pitfalls)
  $app = [regex]::Replace(
    $app,
    '(<section\s+className="section\s+hero"[^>]*style=\{\{[^}]*\}\}[^>]*>)',
    '<section className="section hero" style={{ background: `url(''${HERO_BG_URL}'') center/cover no-repeat` }}',
    'Singleline'
  )

  Update-File -Path $appPath -Content $app
  Write-Host "Patched $appPath ✅"

  # 3) Ensure PNG favicon is wired (if you provided or already have one)
  $indexPath = ".\index.html"
  if (Test-Path $indexPath) {
    $html = Get-Content $indexPath -Raw
    $linkTag = '<link rel="icon" type="image/png" href="/favicon.png" />'
    if ($html -match '<link\s+rel="icon"[^>]+>') {
      $html = [regex]::Replace($html, '<link\s+rel="icon"[^>]+>', $linkTag)
    } else {
      # inject in <head> if no icon existed
      $html = [regex]::Replace($html, '<head>', "<head>`r`n  $linkTag")
    }
    Update-File -Path $indexPath -Content $html
    if (Test-Path $FaviconPng) {
      Copy-Item $FaviconPng ".\public\favicon.png" -Force
      Write-Host "Favicon set to public\favicon.png"
    } else {
      Write-Warning "No favicon PNG supplied; using existing (if present)."
    }
  }

  if (-not $SkipBuild) {
    Write-Host "== Building =="
    npm run build
  } else {
    Write-Host "Skipping build per flag."
  }

  git add .
  if (-not $SkipPush) {
    git commit -m "Automated: fingerprinted hero imports + favicon + build"
    git push
    Write-Host "Pushed to origin; Cloudflare will auto-deploy. ✅"
  } else {
    Write-Host "Changes staged; skipping push per flag."
  }
}
finally {
  Pop-Location
}
'@
Set-Content -Path ".\tools\Deploy-Auto.ps1" -Value $script -Encoding UTF8

Write-Host "Created tools\Deploy-Auto.ps1 ✅"
