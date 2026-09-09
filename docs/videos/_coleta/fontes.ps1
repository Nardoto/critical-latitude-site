$ErrorActionPreference = 'Stop'
$videoRoot = Split-Path -Parent $PSScriptRoot
$videos = Get-Content -Raw -LiteralPath (Join-Path $videoRoot '..\..\site\src\data\videos.json') | ConvertFrom-Json
foreach ($video in $videos) {
    $folder = Join-Path $videoRoot $video.id
    $infoPath = Join-Path $folder ($video.id + '.info.json')
    $statusPath = Join-Path $folder 'fontes-status.json'
    if (!(Test-Path -LiteralPath $infoPath)) { continue }
    if (Test-Path -LiteralPath $statusPath) {
        $previous = Get-Content -Raw -LiteralPath $statusPath | ConvertFrom-Json
        if ($previous.links.Count -gt 0) { continue }
    }
    $info = Get-Content -Raw -LiteralPath $infoPath | ConvertFrom-Json
    $sourceLinks = [System.Collections.Generic.List[string]]::new()
    $sourceSection = $false
    foreach ($line in ($info.description -split "`n")) {
        if ($line -match '(?i)\b(sources?|references?|fontes)\b') { $sourceSection = $true }
        elseif ($line.Trim() -notmatch '^https?://') { $sourceSection = $false }
        if ($sourceSection) {
            foreach ($m in [regex]::Matches($line, 'https?://[^\s<>"\]]+')) {
                $url = $m.Value.TrimEnd('.', ',', ';', ')')
                if (!$sourceLinks.Contains($url)) { $sourceLinks.Add($url) }
            }
            if ($line -match 'https?://') { $sourceSection = $false }
        }
    }
    $records = [System.Collections.Generic.List[object]]::new()
    $counter = 0
    foreach ($url in $sourceLinks) {
        $counter += 1
        $entry = [ordered]@{ url = $url; status = 'não acessível'; verificado_em = (Get-Date).ToString('o') }
        try {
            $response = Invoke-WebRequest -Uri $url -MaximumRedirection 10 -TimeoutSec 45
            $finalUrl = $response.BaseResponse.RequestMessage.RequestUri.AbsoluteUri
            $entry['url_final'] = $finalUrl
            $entry['http_redirecionamento'] = [int]$response.StatusCode
            if ($finalUrl -match 'docs\.google\.com/document/d/([A-Za-z0-9_-]+)') {
                $docId = $Matches[1]
                $exportUrl = 'https://docs.google.com/document/d/' + $docId + '/export?format=txt'
                $entry['documento_id'] = $docId
                $entry['export_url'] = $exportUrl
                $textPath = Join-Path $folder ('fonte-' + $counter + '.txt')
                $export = Invoke-WebRequest -Uri $exportUrl -MaximumRedirection 10 -TimeoutSec 45 -OutFile $textPath -PassThru
                $entry['http_export'] = [int]$export.StatusCode
                $contentType = ($export.Headers['Content-Type'] -join ';')
                $entry['content_type'] = $contentType
                if ($contentType -match '(?i)text/plain' -and (Get-Item -LiteralPath $textPath).Length -gt 0) {
                    $entry['status'] = 'ok'
                    $entry['arquivo_texto'] = $textPath
                } else { $entry['erro'] = 'A exportação não retornou texto simples acessível.' }
            } else { $entry['erro'] = 'O link não redirecionou para um documento Google Docs exportável.' }
        } catch {
            $entry['erro'] = $_.Exception.Message
        }
        $records.Add($entry)
        Write-Output ($video.id + ' ' + $url + ' => ' + $entry['status'])
    }
    $result = [ordered]@{ id = $video.id; links = @($sourceLinks.ToArray()); documentos = @($records.ToArray()) }
    $result | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath $statusPath -Encoding utf8
}
