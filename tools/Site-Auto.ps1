param(
  [switch]$PickHeroBg,     # if set, opens a file picker for hero background
  [switch]$PickOgCover,    # if set, opens a file picker for social share image
  [switch]$SkipBuild
)

function Write-Step($m){ Write-Host "== $m" -ForegroundColor Cyan }
function Ensure-Dir($p){ if(!(Test-Path $p)){ New-Item -ItemType Directory -Path $p -Force | Out-Null } }

# --- Preconditions ---
Write-Step "Checking location & repo"
if (!(Test-Path ".\.git")) { Write-Error "Not in the project root (no .git). cd into your project root and re-run."; exit 1 }

# --- Optional pickers ---
Add-Type -AssemblyName System.Windows.Forms | Out-Null

if ($PickHeroBg) {
  $dlg = New-Object System.Windows.Forms.OpenFileDialog
  $dlg.Title  = "Select HERO BACKGROUND (jpg/png)"
  $dlg.Filter = "Images|*.jpg;*.jpeg;*.png"
  if ($dlg.ShowDialog() -eq 'OK') {
    Ensure-Dir ".\src\assets"
    $ext = [IO.Path]::GetExtension($dlg.FileName).ToLower()
    $dest = ".\src\assets\hero-bg$ext"
    Copy-Item $dlg.FileName $dest -Force
    Write-Step "Hero background copied => $dest"
  } else {
    Write-Host "Skipped hero background selection."
  }
}

if ($PickOgCover) {
  $dlg2 = New-Object System.Windows.Forms.OpenFileDialog
  $dlg2.Title  = "Select OG Cover (1200x630 recommended)"
  $dlg2.Filter = "Images|*.jpg;*.jpeg;*.png"
  if ($dlg2.ShowDialog() -eq 'OK') {
    Ensure-Dir ".\public\images"
    Copy-Item $dlg2.FileName ".\public\images\og-cover.jpg" -Force
    Write-Step "OG cover copied => public\images\og-cover.jpg"
  } else {
    Write-Host "Skipped OG image selection."
  }
}

# --- Ensure folders exist ---
Ensure-Dir ".\public\images"
Ensure-Dir ".\src\assets"
Ensure-Dir ".\src\assets\portfolio"

# --- 1) Patch src\App.tsx ---
Write-Step "Patching src\App.tsx"
$appPath = ".\src\App.tsx"
if (!(Test-Path $appPath)) { Write-Error "Missing $appPath"; exit 1 }
$app = Get-Content $appPath -Raw

# a) Ensure hero-bg glob supports png
$app = $app -replace '\("./assets/hero-bg\.\{jpg,jpeg\}", \{ eager: true \}\)', '("./assets/hero-bg.{jpg,jpeg,png}", { eager: true })'
$app = $app -replace 'hero-bg\.\{jpg,jpeg\}', 'hero-bg.{jpg,jpeg,png}'

# b) Ensure portfolio glob supports png (already there but idempotent)
$app = $app -replace 'portfolio/\*\.{jpg,jpeg}', 'portfolio/*.{jpg,jpeg,png}'

# c) Update email & mailto
$app = $app -replace 'email:\s*"[^"]+"', 'email: "info@johnhuntconstruction.com"'
$app = $app -replace 'emailHref:\s*"[^"]+"', 'emailHref: "mailto:info@johnhuntconstruction.com"'

# d) Remove phone/mail/text emojis if any slipped back
$app = $app -replace '📞\s*', '' -replace '✉️\s*', '' -replace '💬\s*', ''

# e) Ensure hero section applies heroBgUrl inline style
if ($app -notmatch 'section className="section heroBand".*style=\{\{.*heroBgUrl') {
  $app = $app -replace '<section className="section heroBand">', '<section className="section heroBand" style={{ background: heroBgUrl ? `url(''${heroBgUrl}'') center/cover no-repeat` : undefined }}>'
}

# f) Add premium CSS once (logo size / card hover / mobile nav scroll)
$cssMarker = '/* JH premium CSS */'
if ($app -notmatch [regex]::Escape($cssMarker)) {
  $extraCss = @"
        $cssMarker
        .brandLogo{ width:34px; height:34px; object-fit:contain; border-radius:6px }
        @media(min-width:1024px){ .brandLogo{ width:42px; height:42px } }
        .card.pad:hover{ transform:translateY(-2px); box-shadow:0 16px 40px rgba(15,17,21,.10); transition:all .2s }
        header.sticky nav ul{ display:flex; gap:10px; flex-wrap:nowrap; overflow-x:auto; padding:6px 0; margin:0; list-style:none; -webkit-overflow-scrolling:touch; scrollbar-width:none }
        header.sticky nav ul::-webkit-scrollbar{ display:none }
        header.sticky nav li{ flex:0 0 auto }
"@
  # insert before closing </style>
  $app = $app -replace '</style>', "$extraCss`r`n      </style>"
  # switch header logo to brandLogo class (idempotent)
  $app = $app -replace '(<img\s+[^>]*src=\{?logoUrl\}?[^>]*)(style=\{\{[^}]*\}\})?[^>]*>', '<img src={logoUrl} alt="John Hunt Construction logo" className="brandLogo" />'
}

Set-Content $appPath $app -Encoding UTF8
Write-Host "  - App.tsx updated"

# --- 2) Patch index.html head tags ---
Write-Step "Patching index.html"
$idx = ".\index.html"
if (!(Test-Path $idx)) { Write-Error "Missing index.html"; exit 1 }
$html = Get-Content $idx -Raw

$headStart = $html.IndexOf("<head", [StringComparison]::OrdinalIgnoreCase)
$headEnd   = $html.IndexOf("</head>", [StringComparison]::OrdinalIgnoreCase)
if ($headStart -lt 0 -or $headEnd -lt 0) { Write-Warning "Could not locate <head>…</head> block; skipping SEO head inject." }
else {
  $before = $html.Substring(0, $headEnd)
  $after  = $html.Substring($headEnd)

  $marker = "<!-- JH SEO HEAD -->"
  if ($html -notmatch [regex]::Escape($marker)) {
    $seo = @"
  $marker
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>John Hunt Construction – Handyman & Small Renovations in Seattle</title>
  <meta name="description" content="Licensed & insured handyman and light remodeling in Seattle: carpentry, kitchens, fencing, decks, drywall, paint. Free estimates." />
  <link rel="canonical" href="https://john-hunt-site.pages.dev/" />
  <meta property="og:type" content="website" />
  <meta property="og:title" content="John Hunt Construction" />
  <meta property="og:description" content="Handyman & small renovations in Seattle. Free estimates." />
  <meta property="og:url" content="https://john-hunt-site.pages.dev/" />
  <meta property="og:image" content="/images/og-cover.jpg" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="John Hunt Construction" />
  <meta name="twitter:description" content="Handyman & small renovations in Seattle." />
  <meta name="twitter:image" content="/images/og-cover.jpg" />
  <link rel="icon" type="image/png" href="/favicon.png" />
"@
    $html = $before + "`r`n    $seo`r`n" + $after
    Set-Content $idx $html -Encoding UTF8
    Write-Host "  - SEO head inserted"
  } else {
    Write-Host "  - SEO head already present"
  }
}

# --- 3) robots.txt + sitemap.xml ---
Write-Step "Ensuring robots.txt + sitemap.xml"
$robots = ".\public\robots.txt"
$smap   = ".\public\sitemap.xml"
Ensure-Dir ".\public"

@"
User-agent: *
Allow: /
Sitemap: https://john-hunt-site.pages.dev/sitemap.xml
"@ | Set-Content $robots -Encoding UTF8

@"
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://john-hunt-site.pages.dev/</loc></url>
</urlset>
"@ | Set-Content $smap -Encoding UTF8

Write-Host "  - robots.txt & sitemap.xml written"

# --- 4) Verify presence of hero-bg file (optional) ---
$hasHeroJpg = Test-Path ".\src\assets\hero-bg.jpg" -PathType Leaf
$hasHeroPng = Test-Path ".\src\assets\hero-bg.png" -PathType Leaf
if (-not ($hasHeroJpg -or $hasHeroPng)) {
  Write-Host "NOTE: No hero background found at src\assets\hero-bg.jpg|png. The site will fall back to light gray." -ForegroundColor Yellow
}

# --- 5) Build & push ---
if (-not $SkipBuild) {
  Write-Step "Building (vite)"
  npm run build
} else {
  Write-Host "Skipping build by flag."
}

Write-Step "Git add/commit/push"
git add .
git commit -m "Automated: SEO head, robots/sitemap, email, hero-bg handling, UI polish"
git push

Write-Host "`nAll set. Cloudflare Pages will deploy your latest commit." -ForegroundColor Green
