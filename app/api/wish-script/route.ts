export const dynamic = "force-static";

// PowerShell helper that extracts the wish-history URL from the game's web
// cache, validates the authkey against the gacha API, and copies the URL to
// the clipboard. Users run it with:  iex (irm <site>/api/wish-script)
// NOTE: this is a TS template literal; keep the script free of backticks
// and "$\{" sequences.
const SCRIPT = String.raw`
$ErrorActionPreference = 'Stop'
Write-Host ''
Write-Host 'Genshin Analytics - wish history URL extractor' -ForegroundColor Cyan
Write-Host 'Make sure you opened Wish > History in the game at least once.'
Write-Host ''

# 1) find the game log to locate the install folder
$logPath = $null
foreach ($dir in @('miHoYo\Genshin Impact', 'miHoYo\YuanShen', ('miHoYo\' + [char]0x539F + [char]0x795E))) {
    $p = Join-Path $env:USERPROFILE (Join-Path 'AppData\LocalLow' (Join-Path $dir 'output_log.txt'))
    if (Test-Path $p) { $logPath = $p; break }
}
if (-not $logPath) {
    Write-Host 'Could not find the Genshin Impact log file. Start the game, open Wish > History, then run this again.' -ForegroundColor Red
    return
}

# 2) find the game data folder from the log; the log can hold stale paths
#    from old installs (moved drives), so collect every match and keep the
#    most recent one that still exists on disk
$log = Get-Content $logPath -Raw
$paths = @([regex]::Matches($log, '([A-Za-z]:[\\/][^\r\n*?"<>|]+?(GenshinImpact_Data|YuanShen_Data))') |
    ForEach-Object { $_.Groups[1].Value -replace '/', '\' } | Select-Object -Unique)
if ($paths.Count -eq 0) {
    Write-Host 'Could not locate the game folder from the log. Start the game once and retry.' -ForegroundColor Red
    return
}
[array]::Reverse($paths)
$webCaches = $null
foreach ($candidatePath in $paths) {
    try {
        $wc = Join-Path $candidatePath 'webCaches'
        if (Test-Path $wc) { $webCaches = $wc; break }
    } catch { }
}
if (-not $webCaches) {
    Write-Host 'Found these game folders in the log, but none has a webCaches folder:' -ForegroundColor Red
    $paths | ForEach-Object { Write-Host ('  ' + $_) -ForegroundColor Yellow }
    Write-Host 'Start the game, open Wish > History, then run this again.' -ForegroundColor Yellow
    return
}

# 3) newest webCaches version folder -> Cache_Data\data_2
$verDir = Get-ChildItem $webCaches -Directory | Where-Object { $_.Name -match '^[0-9.]+$' } |
    Sort-Object { [version]$_.Name } -Descending | Select-Object -First 1
$cacheFile = if ($verDir) { Join-Path $verDir.FullName 'Cache\Cache_Data\data_2' } else { Join-Path $webCaches 'Cache\Cache_Data\data_2' }
if (-not (Test-Path $cacheFile)) {
    Write-Host ('Cache file not found: ' + $cacheFile) -ForegroundColor Red
    Write-Host 'Open Wish > History in the game, then run this again.' -ForegroundColor Yellow
    return
}

# 4) copy (game keeps it locked) and scan for gacha URLs
$tmp = Join-Path $env:TEMP ('ga_data2_' + [IO.Path]::GetRandomFileName())
Copy-Item $cacheFile $tmp -Force
$content = Get-Content -Raw -Encoding UTF8 $tmp
Remove-Item $tmp -Force
$candidates = @(($content -split '1/0/') | Where-Object {
    $_ -like 'http*' -and $_ -match 'e20190909gacha|getGachaLog|webview_gacha' -and $_ -match 'authkey='
} | ForEach-Object { ($_ -split [string][char]0)[0].Trim() })
if ($candidates.Count -eq 0) {
    Write-Host 'No wish URL in the cache yet. Open Wish > History in the game, wait for it to load, then run this again.' -ForegroundColor Red
    return
}
[array]::Reverse($candidates)

# 5) validate newest-first against the gacha API
Add-Type -AssemblyName System.Web
foreach ($candidate in $candidates) {
    try {
        $uri = [uri]$candidate
        $q = [System.Web.HttpUtility]::ParseQueryString($uri.Query)
        $ak = $q['authkey']
        if (-not $ak) { continue }
        $biz = $q['game_biz']; if (-not $biz) { $biz = 'hk4e_global' }
        $api = if ($biz -eq 'hk4e_cn') { 'https://hk4e-api.mihoyo.com/event/gacha_info/api/getGachaLog' }
               else { 'https://hk4e-api-os.hoyoverse.com/event/gacha_info/api/getGachaLog' }
        $test = $api + '?authkey_ver=1&sign_type=2&lang=en&gacha_type=301&size=5&end_id=0&game_biz=' + $biz +
                '&authkey=' + [uri]::EscapeDataString($ak)
        $resp = Invoke-RestMethod $test -TimeoutSec 15
        if ($resp.retcode -eq 0) {
            Set-Clipboard -Value $candidate
            Write-Host 'Success! Your wish history URL is in the clipboard.' -ForegroundColor Green
            Write-Host 'Paste it into the Wish Tracker import box and click "Fetch from URL".'
            return
        }
    } catch { }
}

Write-Host 'Found cached URLs, but they are all expired (authkeys last 24 hours).' -ForegroundColor Red
Write-Host 'Open Wish > History in the game to refresh it, then run this command again.' -ForegroundColor Yellow
`;

export async function GET() {
  return new Response(SCRIPT.trimStart(), {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "public, max-age=3600",
    },
  });
}
