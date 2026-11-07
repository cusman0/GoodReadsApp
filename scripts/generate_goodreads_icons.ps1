Add-Type -AssemblyName System.Drawing

$baseDir = "android/app/src/main/res"

$densities = @(
    @{ name = "mipmap-mdpi";    size = 48;  fgSize = 108 },
    @{ name = "mipmap-hdpi";    size = 72;  fgSize = 162 },
    @{ name = "mipmap-xhdpi";   size = 96;  fgSize = 216 },
    @{ name = "mipmap-xxhdpi";  size = 144; fgSize = 324 },
    @{ name = "mipmap-xxxhdpi"; size = 192; fgSize = 432 }
)

$bgColor = [System.Drawing.ColorTranslator]::FromHtml("#F4F1EA")
$textColor = [System.Drawing.ColorTranslator]::FromHtml("#382110")
$borderColor = [System.Drawing.ColorTranslator]::FromHtml("#DDD8CD")

function Get-RoundedRectPath([float]$x, [float]$y, [float]$width, [float]$height, [float]$radius) {
    $path = New-Object System.Drawing.Drawing2D.GraphicsPath
    $diameter = $radius * 2.0

    # Top-left
    $path.AddArc($x, $y, $diameter, $diameter, 180.0, 90.0)
    # Top-right
    $path.AddArc(($x + $width - $diameter), $y, $diameter, $diameter, 270.0, 90.0)
    # Bottom-right
    $path.AddArc(($x + $width - $diameter), ($y + $height - $diameter), $diameter, $diameter, 0.0, 90.0)
    # Bottom-left
    $path.AddArc($x, ($y + $height - $diameter), $diameter, $diameter, 90.0, 90.0)
    $path.CloseFigure()
    return $path
}

function Generate-Icon([int]$size, [string]$path, [string]$type) {
    $bmp = New-Object System.Drawing.Bitmap($size, $size)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality

    $g.Clear([System.Drawing.Color]::Transparent)

    if ($type -eq "square") {
        # Rounded rectangle with ~22% corner radius
        $radius = [float]($size * 0.22)
        $w = [float]($size - 2)
        $h = [float]($size - 2)
        $rPath = Get-RoundedRectPath 1.0 1.0 $w $h $radius

        $bgBrush = New-Object System.Drawing.SolidBrush($bgColor)
        $g.FillPath($bgBrush, $rPath)

        $penWidth = [Math]::Max(1.0, [float]($size * 0.02))
        $pen = New-Object System.Drawing.Pen($borderColor, [float]$penWidth)
        $g.DrawPath($pen, $rPath)
    } elseif ($type -eq "round") {
        # Perfect circle
        $bgBrush = New-Object System.Drawing.SolidBrush($bgColor)
        $g.FillEllipse($bgBrush, [float]1.0, [float]1.0, [float]($size - 2), [float]($size - 2))

        $penWidth = [Math]::Max(1.0, [float]($size * 0.02))
        $pen = New-Object System.Drawing.Pen($borderColor, [float]$penWidth)
        $g.DrawEllipse($pen, [float]1.0, [float]1.0, [float]($size - 2), [float]($size - 2))
    }

    # Font: Georgia Bold
    $fontSize = if ($type -eq "foreground") { [float]($size * 0.44) } else { [float]($size * 0.62) }
    $font = New-Object System.Drawing.Font("Georgia", $fontSize, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
    $textBrush = New-Object System.Drawing.SolidBrush($textColor)

    $sf = New-Object System.Drawing.StringFormat
    $sf.Alignment = [System.Drawing.StringAlignment]::Center
    $sf.LineAlignment = [System.Drawing.StringAlignment]::Center

    $yOffset = if ($type -eq "foreground") { [float](-($size * 0.035)) } else { [float](-($size * 0.04)) }
    $rect = New-Object System.Drawing.RectangleF([float]0.0, [float]$yOffset, [float]$size, [float]$size)
    $g.DrawString("g", $font, $textBrush, $rect, $sf)

    $g.Dispose()
    $bmp.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()
}

foreach ($d in $densities) {
    $folder = $d.name
    $dir = Join-Path $baseDir $folder
    if (-not (Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
    }

    $size = $d.size
    $fgSize = $d.fgSize

    $squarePath = Join-Path $dir "ic_launcher.png"
    $roundPath = Join-Path $dir "ic_launcher_round.png"
    $fgPath = Join-Path $dir "ic_launcher_foreground.png"

    Generate-Icon -size $size -path $squarePath -type "square"
    Generate-Icon -size $size -path $roundPath -type "round"
    Generate-Icon -size $fgSize -path $fgPath -type "foreground"

    Write-Host "Generated $folder icons (size: ${size}x${size}, fg: ${fgSize}x${fgSize})"
}

# Adaptive icons (Android 8.0+)
$anydpiDir = Join-Path $baseDir "mipmap-anydpi-v26"
if (-not (Test-Path $anydpiDir)) {
    New-Item -ItemType Directory -Path $anydpiDir -Force | Out-Null
}

$adaptiveSquareXml = @"
<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@color/ic_launcher_background"/>
    <foreground android:drawable="@mipmap/ic_launcher_foreground"/>
</adaptive-icon>
"@

$adaptiveRoundXml = @"
<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@color/ic_launcher_background"/>
    <foreground android:drawable="@mipmap/ic_launcher_foreground"/>
</adaptive-icon>
"@

Set-Content -Path (Join-Path $anydpiDir "ic_launcher.xml") -Value $adaptiveSquareXml -Encoding UTF8
Set-Content -Path (Join-Path $anydpiDir "ic_launcher_round.xml") -Value $adaptiveRoundXml -Encoding UTF8
Write-Host "Generated mipmap-anydpi-v26 adaptive icon XMLs"

# Ensure colors.xml has ic_launcher_background
$valuesDir = Join-Path $baseDir "values"
$colorsPath = Join-Path $valuesDir "colors.xml"
$colorsXml = @"
<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="ic_launcher_background">#F4F1EA</color>
</resources>
"@
Set-Content -Path $colorsPath -Value $colorsXml -Encoding UTF8
Write-Host "Updated colors.xml"
