$desktopPaths = @(
    [Environment]::GetFolderPath('Desktop'),
    'C:\Users\victo\Desktop'
) | Where-Object { Test-Path $_ } | Select-Object -Unique

$WshShell = New-Object -ComObject WScript.Shell
$iconPath = 'C:\Users\victo\.gemini\antigravity\scratch\IdeaForge\public\app-icon.ico'
$scriptPath = 'C:\Users\victo\.gemini\antigravity\scratch\IdeaForge\scripts\launch.ps1'
$workDir = 'C:\Users\victo\.gemini\antigravity\scratch\IdeaForge'

foreach ($dp in $desktopPaths) {
    $shortcutFile = Join-Path $dp 'SaaS Opportunity Radar.lnk'
    $Shortcut = $WshShell.CreateShortcut($shortcutFile)
    $Shortcut.TargetPath = 'powershell.exe'
    $Shortcut.Arguments = '-WindowStyle Hidden -ExecutionPolicy Bypass -File ""' + $scriptPath + '""'
    $Shortcut.WorkingDirectory = $workDir
    $Shortcut.IconLocation = $iconPath + ', 0'
    $Shortcut.Description = 'Open SaaS Opportunity Radar'
    $Shortcut.Save()
    Write-Output "Created shortcut at: $shortcutFile"

    $batFile = Join-Path $dp 'Start-SaaS-Opportunity-Radar.bat'
    Copy-Item 'C:\Users\victo\.gemini\antigravity\scratch\IdeaForge\scripts\launch-radar.bat' $batFile -Force
    Write-Output "Created batch launcher at: $batFile"
}
