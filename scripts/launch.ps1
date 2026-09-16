$url = "http://localhost:3000/workspace"
$healthUrl = "http://localhost:3000/api/opportunities"
$workingDir = "C:\Users\victo\.gemini\antigravity\scratch\IdeaForge"

$isRunning = $false
try {
    $res = Invoke-WebRequest -Uri $healthUrl -UseBasicParsing -TimeoutSec 1 -ErrorAction SilentlyContinue
    if ($res.StatusCode -eq 200) {
        $isRunning = $true
    }
} catch {
    $isRunning = $false
}

if (-not $isRunning) {
    Start-Process -FilePath "cmd.exe" -ArgumentList "/c cd /d "$workingDir" && npm.cmd run dev" -WorkingDirectory $workingDir -WindowStyle Minimized

    $maxWait = 25
    $waited = 0
    while ($waited -lt $maxWait) {
        Start-Sleep -Seconds 1
        $waited++
        try {
            $check = Invoke-WebRequest -Uri $healthUrl -UseBasicParsing -TimeoutSec 1 -ErrorAction SilentlyContinue
            if ($check.StatusCode -eq 200) {
                break
            }
        } catch {
        }
    }
}

Start-Process $url
