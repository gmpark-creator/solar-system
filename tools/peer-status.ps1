param(
    [string]$PeerPath
)

$ErrorActionPreference = "Stop"

$projectRoot = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot "..")).Path
$solarProjectName = [string]::Concat(
    [char]0xD0DC,
    [char]0xC591,
    [char]0xACC4,
    [char]0xD504,
    [char]0xB85C,
    [char]0xC81D,
    [char]0xD2B8
)

function Resolve-PeerPath {
    param([string]$Path)

    if ([System.IO.Path]::IsPathRooted($Path)) {
        return $Path
    }

    return Join-Path $projectRoot $Path
}

if ($PeerPath) {
    $candidates = @((Resolve-PeerPath $PeerPath))
} else {
    $candidates = @(
        (Resolve-PeerPath ("..\" + $solarProjectName + " - claude")),
        (Resolve-PeerPath ("..\" + $solarProjectName + " - Claude")),
        (Resolve-PeerPath "..\solar-system")
    )
}

$peerRoot = $null
foreach ($candidate in $candidates) {
    if (Test-Path -LiteralPath $candidate -PathType Container) {
        $peerRoot = (Resolve-Path -LiteralPath $candidate).Path
        break
    }
}

if (-not $peerRoot) {
    Write-Host "Peer folder not found. Checked:"
    foreach ($candidate in $candidates) {
        Write-Host "  $candidate"
    }
    exit 2
}

Write-Host "Peer folder: $peerRoot"

$gitDir = Join-Path $peerRoot ".git"
if (-not (Test-Path -LiteralPath $gitDir)) {
    Write-Host ""
    Write-Host "Peer folder is not a git repository. Top-level files:"
    Get-ChildItem -LiteralPath $peerRoot -Force |
        Select-Object Mode, LastWriteTime, Name |
        Format-Table -AutoSize
    exit 0
}

Write-Host ""
Write-Host "Branch:"
git -C $peerRoot branch --show-current

Write-Host ""
Write-Host "Status:"
git -C $peerRoot status --short

Write-Host ""
Write-Host "Recent commits:"
git -C $peerRoot log --oneline -n 8

Write-Host ""
Write-Host "Worktree diff stat:"
git -C $peerRoot diff --stat

Write-Host ""
Write-Host "Tracked files sample:"
git -C $peerRoot ls-files | Select-Object -First 80
