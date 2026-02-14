param(
    [string]$Date = (Get-Date -Format "yyyy-MM-dd")
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$baseDir = Split-Path -Parent $PSScriptRoot
$templateDir = Join-Path $baseDir "_template"
$targetDir = Join-Path $baseDir $Date

if (-not (Test-Path -Path $templateDir -PathType Container)) {
    throw "テンプレートディレクトリが見つかりません: $templateDir"
}

if (Test-Path -Path $targetDir -PathType Container) {
    throw "出力先が既に存在します: $targetDir"
}

New-Item -Path $targetDir -ItemType Directory | Out-Null

$fileMap = @(
    @{ Source = "README.md"; Target = "README.md" },
    @{ Source = "summary.md"; Target = "$Date`_summary.md" },
    @{ Source = "risks.md"; Target = "$Date`_risks.md" },
    @{ Source = "plan-10.md"; Target = "$Date`_plan-10.md" },
    @{ Source = "appendix.md"; Target = "$Date`_appendix.md" },
    @{ Source = "improvement-tracker.md"; Target = "improvement-tracker.md" }
)

foreach ($item in $fileMap) {
    $sourcePath = Join-Path $templateDir $item.Source
    if (-not (Test-Path -Path $sourcePath -PathType Leaf)) {
        throw "テンプレートファイルが見つかりません: $sourcePath"
    }

    $content = Get-Content -Path $sourcePath -Raw
    $content = $content.Replace("{{DATE}}", $Date)

    $targetPath = Join-Path $targetDir $item.Target
    Set-Content -Path $targetPath -Value $content -Encoding UTF8
}

Write-Host "監査フォルダを作成しました: $targetDir"
Get-ChildItem -Path $targetDir -File | ForEach-Object {
    Write-Host (" - " + $_.Name)
}
