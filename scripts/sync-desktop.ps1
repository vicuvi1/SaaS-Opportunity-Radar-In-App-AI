$targetDesktop = (Get-ChildItem 'C:\Users\victo\OneDrive' -Directory | Where-Object { $_.Name -like '*стол*' }).FullName
if ($targetDesktop) {
    Copy-Item 'C:\Users\victo\Desktop\SaaS Opportunity Radar.lnk' -Destination (Join-Path $targetDesktop 'SaaS Opportunity Radar.lnk') -Force
    Write-Output "Copied to: $targetDesktop\SaaS Opportunity Radar.lnk"
}
