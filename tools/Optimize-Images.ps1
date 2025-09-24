param(
  [string]$Root = ".\public\images",
  [switch]$BuildAndPush
)

Add-Type -AssemblyName System.Drawing

function Get-JpegEncoder {
  return [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq "image/jpeg" }
}

function Save-Jpeg($bmp, $outPath, [int]$quality = 85) {
  $enc = Get-JpegEncoder
  $p = New-Object System.Drawing.Imaging.EncoderParameters(1)
  $p.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter([System.Drawing.Imaging.Encoder]::Quality, [int64]$quality)
  $dir = Split-Path $outPath; if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Path $dir | Out-Null }
  $bmp.Save($outPath, $enc, $p)
}

function Fix-Orientation([System.Drawing.Image]$img) {
  # EXIF orientation property id 0x0112 = 274
  $propId = 274
  if ($img.PropertyIdList -contains $propId) {
    $orientation = $img.GetPropertyItem($propId).Value[0]
    switch ($orientation) {
      3 { $img.RotateFlip([System.Drawing.RotateFlipType]::Rotate180FlipNone) }
      6 { $img.RotateFlip([System.Drawing.RotateFlipType]::Rotate90FlipNone) }
      8 { $img.RotateFlip([System.Drawing.RotateFlipType]::Rotate270FlipNone) }
    }
    # remove the orientation tag so it won't be reapplied
    try { $img.RemovePropertyItem($propId) } catch {}
  }
}

function Resize-ToWidth($srcPath, $dstPath, [int]$targetWidth) {
  if (-not (Test-Path $srcPath)) { return }
  $src = [System.Drawing.Image]::FromFile($srcPath)
  try {
    Fix-Orientation $src
    # if smaller than target, just recompress to target file
    if ($src.Width -le $targetWidth) {
      Save-Jpeg $src $dstPath 85
      return
    }
    $ratio = $targetWidth / $src.Width
    $w = [int]$targetWidth
    $h = [int][Math]::Round($src.Height * $ratio)
    $bmp = New-Object System.Drawing.Bitmap($w, $h)
    $gfx = [System.Drawing.Graphics]::FromImage($bmp)
    try {
      $gfx.CompositingQuality = "HighQuality"
      $gfx.SmoothingMode = "HighQuality"
      $gfx.InterpolationMode = "HighQualityBicubic"
      $gfx.PixelOffsetMode = "HighQuality"
      $gfx.DrawImage($src, 0, 0, $w, $h)
    } finally {
      $gfx.Dispose()
    }
    try { Save-Jpeg $bmp $dstPath 85 } finally { $bmp.Dispose() }
  } finally {
    $src.Dispose()
  }
}

function Recompress-Original($srcPath) {
  if (-not (Test-Path $srcPath)) { return }
  $tmp = [System.IO.Path]::ChangeExtension($srcPath, ".tmp.jpg")
  $img = [System.Drawing.Image]::FromFile($srcPath)
  try {
    Fix-Orientation $img
    Save-Jpeg $img $tmp 85
  } finally { $img.Dispose() }
  # Replace original atomically
  Remove-Item $srcPath -Force
  Rename-Item $tmp $srcPath
}

function New-Variants($basePathNoExt) {
  $src = "$basePathNoExt.jpg"
  if (-not (Test-Path $src)) { return }

  # Variants
  $v800   = "${basePathNoExt}_800.jpg"
  $v1200  = "${basePathNoExt}_1200.jpg"
  $v1600  = "${basePathNoExt}_1600.jpg"

  # Only (re)generate when source is newer than variant or variant missing
  if ((-not (Test-Path $v800))  -or ((Get-Item $src).LastWriteTimeUtc -gt (Get-Item $v800 -EA SilentlyContinue).LastWriteTimeUtc))  { Resize-ToWidth $src $v800 800 }
  if ((-not (Test-Path $v1200)) -or ((Get-Item $src).LastWriteTimeUtc -gt (Get-Item $v1200 -EA SilentlyContinue).LastWriteTimeUtc)) { Resize-ToWidth $src $v1200 1200 }
  if ((-not (Test-Path $v1600)) -or ((Get-Item $src).LastWriteTimeUtc -gt (Get-Item $v1600 -EA SilentlyContinue).LastWriteTimeUtc)) { Resize-ToWidth $src $v1600 1600 }
}

Write-Host "== Optimizing images under: $Root =="

# 1) Hero + hero-bg
$hero    = Join-Path $Root "hero.jpg"
$heroBg  = Join-Path $Root "hero-bg.jpg"
if (Test-Path $hero)   { Write-Host "Recompress hero.jpg";   Recompress-Original $hero;   New-Variants (Join-Path $Root "hero") }
if (Test-Path $heroBg) { Write-Host "Recompress hero-bg.jpg";Recompress-Original $heroBg; New-Variants (Join-Path $Root "hero-bg") }

# 2) Portfolio 01..NN (process any .jpg files at that level)
$portfolio = Join-Path $Root "portfolio"
if (Test-Path $portfolio) {
  Get-ChildItem $portfolio -Filter *.jpg -File | ForEach-Object {
    $base = [System.IO.Path]::Combine($portfolio, [System.IO.Path]::GetFileNameWithoutExtension($_.Name))
    # Only recompress the base if it's the plain "##.jpg" (not a _800/_1200/_1600)
    if ($base -notmatch '_\d{3,4}$') {
      Write-Host "Recompress $($_.Name)"
      Recompress-Original $_.FullName
      New-Variants $base
    }
  }
}

Write-Host "== Done =="
if ($BuildAndPush) {
  Write-Host "== Building and pushing =="
  pushd .
  try {
    npm run build
    git add .
    git commit -m "Optimize images (recompress + responsive variants)" | Out-Null
    git push
  } finally { popd }
}
