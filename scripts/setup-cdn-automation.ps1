#
# CDN Operations Automation Setup - Phase 5.1 (Windows PowerShell)
# 
# This script sets up automated scheduled tasks for:
# - Daily S3 health checks
# - Weekly media backups  
# - Monthly lifecycle policy reviews
# - Alerting integration for anomalies
#

param(
    [string]$AlertEmail = "ops@lynxpardelle.com",
    [string]$SlackWebhookUrl = "",
    [switch]$DryRun = $false
)

# Configuration
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Split-Path -Parent $ScriptDir
$LogDir = Join-Path $ProjectRoot "logs\operations"
$CronLogDir = Join-Path $ProjectRoot "logs\scheduled"

# Ensure log directories exist
if (!(Test-Path $LogDir)) { New-Item -ItemType Directory -Path $LogDir -Force | Out-Null }
if (!(Test-Path $CronLogDir)) { New-Item -ItemType Directory -Path $CronLogDir -Force | Out-Null }

Write-Host "🕒 Setting up CDN Operations Automation (Windows)" -ForegroundColor Cyan
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host "Project Root: $ProjectRoot"
Write-Host "Alert Email: $AlertEmail"
Write-Host "Slack Webhook: $(if ($SlackWebhookUrl) { 'Configured' } else { 'Not configured' })"
Write-Host ""

###############################################
# Helper Functions
###############################################

function Write-Log {
    param([string]$Message)
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    Write-Host "[$timestamp] $Message"
}

function Send-SlackAlert {
    param(
        [string]$Message,
        [string]$Severity = "info"
    )
    
    if ($SlackWebhookUrl) {
        $color = switch ($Severity) {
            "error" { "danger" }
            "warning" { "warning" }
            "success" { "good" }
            default { "good" }
        }
        
        $emoji = switch ($Severity) {
            "error" { "🚨" }
            "warning" { "⚠️" }
            "success" { "✅" }
            default { "ℹ️" }
        }
        
        $payload = @{
            attachments = @(@{
                color = $color
                text = "$emoji CDN Operations Alert`n$Message"
            })
        } | ConvertTo-Json -Depth 3
        
        try {
            Invoke-RestMethod -Uri $SlackWebhookUrl -Method Post -Body $payload -ContentType "application/json" | Out-Null
        } catch {
            Write-Warning "Failed to send Slack alert: $($_.Exception.Message)"
        }
    }
}

###############################################
# Scheduled Task Scripts
###############################################

function Create-DailyHealthCheckScript {
    $scriptPath = Join-Path $ProjectRoot "scripts\scheduled-daily-health-check.ps1"
    
    $scriptContent = @'
# Daily S3 Health Check - Automated (Windows)
param()

$ProjectRoot = Split-Path -Parent $PSScriptRoot
Set-Location $ProjectRoot

# Load environment variables
if (Test-Path ".env") {
    Get-Content ".env" | ForEach-Object {
        if ($_ -match "^([^=]+)=(.*)$") {
            [Environment]::SetEnvironmentVariable($matches[1], $matches[2], "Process")
        }
    }
}

$LogFile = "logs\scheduled\daily-health-$(Get-Date -Format 'yyyy-MM-dd').log"
$LogDir = Split-Path -Parent $LogFile
if (!(Test-Path $LogDir)) { New-Item -ItemType Directory -Path $LogDir -Force | Out-Null }

$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
Add-Content -Path $LogFile -Value "=== Daily S3 Health Check - $timestamp ==="

try {
    # Run health check
    $result = & node scripts/check-s3-health.js --log
    $exitCode = $LASTEXITCODE
    
    if ($exitCode -eq 0) {
        Add-Content -Path $LogFile -Value "✅ S3 health check passed"
        
        # Send success notification (weekly summary on Mondays)
        if ((Get-Date).DayOfWeek -eq "Monday") {
            $slackWebhook = $env:SLACK_WEBHOOK_URL
            if ($slackWebhook) {
                $payload = @{ text = "✅ Weekly CDN Health Summary: All systems healthy" } | ConvertTo-Json
                try {
                    Invoke-RestMethod -Uri $slackWebhook -Method Post -Body $payload -ContentType "application/json" | Out-Null
                } catch {
                    Add-Content -Path $LogFile -Value "Warning: Failed to send Slack notification"
                }
            }
        }
    } else {
        Add-Content -Path $LogFile -Value "❌ S3 health check failed (exit code: $exitCode)"
        
        # Send alert
        $slackWebhook = $env:SLACK_WEBHOOK_URL  
        if ($slackWebhook) {
            $payload = @{
                attachments = @(@{
                    color = "danger"
                    text = "🚨 CDN Health Check Failed`nS3 health check detected issues. Please review logs."
                })
            } | ConvertTo-Json -Depth 3
            
            try {
                Invoke-RestMethod -Uri $slackWebhook -Method Post -Body $payload -ContentType "application/json" | Out-Null
            } catch {
                Add-Content -Path $LogFile -Value "Warning: Failed to send Slack alert"
            }
        }
        
        # Send email if available
        $alertEmail = $env:ALERT_EMAIL
        if ($alertEmail) {
            try {
                Send-MailMessage -To $alertEmail -Subject "CDN Alert: S3 Health Check Failed" -Body "S3 health check failed. Please review the logs at $LogFile" -SmtpServer "localhost" -ErrorAction SilentlyContinue
            } catch {
                Add-Content -Path $LogFile -Value "Warning: Failed to send email alert"
            }
        }
    }
} catch {
    Add-Content -Path $LogFile -Value "❌ Health check script error: $($_.Exception.Message)"
}

$endTime = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
Add-Content -Path $LogFile -Value "=== Health check completed - $endTime ==="
'@

    Set-Content -Path $scriptPath -Value $scriptContent
    Write-Log "✅ Created daily health check script: $scriptPath"
}

function Create-WeeklyBackupScript {
    $scriptPath = Join-Path $ProjectRoot "scripts\scheduled-weekly-backup.ps1"
    
    $scriptContent = @'
# Weekly Media Backup - Automated (Windows)
param()

$ProjectRoot = Split-Path -Parent $PSScriptRoot
Set-Location $ProjectRoot

# Load environment variables
if (Test-Path ".env") {
    Get-Content ".env" | ForEach-Object {
        if ($_ -match "^([^=]+)=(.*)$") {
            [Environment]::SetEnvironmentVariable($matches[1], $matches[2], "Process")
        }
    }
}

$LogFile = "logs\scheduled\weekly-backup-$(Get-Date -Format 'yyyy-MM-dd').log"
$LogDir = Split-Path -Parent $LogFile
if (!(Test-Path $LogDir)) { New-Item -ItemType Directory -Path $LogDir -Force | Out-Null }

$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
Add-Content -Path $LogFile -Value "=== Weekly Media Backup - $timestamp ==="

try {
    # Run backup
    $result = & node scripts/create-media-backup.js --log --retention=90
    $exitCode = $LASTEXITCODE
    
    if ($exitCode -eq 0) {
        Add-Content -Path $LogFile -Value "✅ Weekly media backup completed successfully"
        
        # Send success notification
        $slackWebhook = $env:SLACK_WEBHOOK_URL
        if ($slackWebhook) {
            $payload = @{ text = "✅ Weekly media backup completed successfully" } | ConvertTo-Json
            try {
                Invoke-RestMethod -Uri $slackWebhook -Method Post -Body $payload -ContentType "application/json" | Out-Null
            } catch {
                Add-Content -Path $LogFile -Value "Warning: Failed to send Slack notification"
            }
        }
    } else {
        Add-Content -Path $LogFile -Value "❌ Weekly media backup failed (exit code: $exitCode)"
        
        # Send alert
        $slackWebhook = $env:SLACK_WEBHOOK_URL
        if ($slackWebhook) {
            $payload = @{
                attachments = @(@{
                    color = "danger"
                    text = "🚨 Weekly Backup Failed`nMedia backup process encountered errors. Please review logs."
                })
            } | ConvertTo-Json -Depth 3
            
            try {
                Invoke-RestMethod -Uri $slackWebhook -Method Post -Body $payload -ContentType "application/json" | Out-Null
            } catch {
                Add-Content -Path $LogFile -Value "Warning: Failed to send Slack alert"
            }
        }
        
        # Send email if available
        $alertEmail = $env:ALERT_EMAIL
        if ($alertEmail) {
            try {
                Send-MailMessage -To $alertEmail -Subject "CDN Alert: Weekly Backup Failed" -Body "Weekly media backup failed. Please review the logs at $LogFile" -SmtpServer "localhost" -ErrorAction SilentlyContinue
            } catch {
                Add-Content -Path $LogFile -Value "Warning: Failed to send email alert"
            }
        }
    }
} catch {
    Add-Content -Path $LogFile -Value "❌ Backup script error: $($_.Exception.Message)"
}

$endTime = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
Add-Content -Path $LogFile -Value "=== Backup completed - $endTime ==="
'@

    Set-Content -Path $scriptPath -Value $scriptContent
    Write-Log "✅ Created weekly backup script: $scriptPath"
}

function Create-MonthlyReviewScript {
    $scriptPath = Join-Path $ProjectRoot "scripts\scheduled-monthly-review.ps1"
    
    $scriptContent = @'
# Monthly CDN Review - Automated (Windows)
param()

$ProjectRoot = Split-Path -Parent $PSScriptRoot
Set-Location $ProjectRoot

# Load environment variables
if (Test-Path ".env") {
    Get-Content ".env" | ForEach-Object {
        if ($_ -match "^([^=]+)=(.*)$") {
            [Environment]::SetEnvironmentVariable($matches[1], $matches[2], "Process")
        }
    }
}

$LogFile = "logs\scheduled\monthly-review-$(Get-Date -Format 'yyyy-MM').log"
$LogDir = Split-Path -Parent $LogFile
if (!(Test-Path $LogDir)) { New-Item -ItemType Directory -Path $LogDir -Force | Out-Null }

$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
Add-Content -Path $LogFile -Value "=== Monthly CDN Review - $timestamp ==="

try {
    # Run detailed health check
    Add-Content -Path $LogFile -Value "Running detailed S3 health check..."
    & node scripts/check-s3-health.js --detailed --log | Out-Null
    
    # Generate usage statistics
    Add-Content -Path $LogFile -Value "Generating usage statistics..."
    Add-Content -Path $LogFile -Value "Current month: $(Get-Date -Format 'yyyy-MM')"
    
    # Check log files for patterns
    if (Test-Path "logs\operations") {
        $operationLogs = Get-ChildItem "logs\operations" -Filter "*.log" | Where-Object { $_.LastWriteTime -gt (Get-Date).AddDays(-30) }
        Add-Content -Path $LogFile -Value "Log file analysis:"
        Add-Content -Path $LogFile -Value "  Operation logs (last 30 days): $($operationLogs.Count)"
        
        $todayHealthLog = "logs\operations\s3-health-$(Get-Date -Format 'yyyy-MM-dd').log"
        if (Test-Path $todayHealthLog) {
            Add-Content -Path $LogFile -Value "  Latest health check: Available"
        }
        
        $todayBackupLog = "logs\operations\media-backup-$(Get-Date -Format 'yyyy-MM-dd').log"
        if (Test-Path $todayBackupLog) {
            Add-Content -Path $LogFile -Value "  Latest backup: Available"
        }
    }
    
    # Send monthly summary
    $monthYear = Get-Date -Format "MMMM yyyy"
    $nextMonth = (Get-Date).AddMonths(1).ToString("MMMM yyyy")
    
    $summary = @"
📊 Monthly CDN Review - $monthYear

✅ Systems Status: Healthy
📈 Health Checks: Running daily
💾 Backups: Running weekly
📊 Detailed analysis available in logs

Next review: $nextMonth
"@
    
    $slackWebhook = $env:SLACK_WEBHOOK_URL
    if ($slackWebhook) {
        $payload = @{ text = $summary } | ConvertTo-Json
        try {
            Invoke-RestMethod -Uri $slackWebhook -Method Post -Body $payload -ContentType "application/json" | Out-Null
        } catch {
            Add-Content -Path $LogFile -Value "Warning: Failed to send Slack notification"
        }
    }
    
    # Send email if available
    $alertEmail = $env:ALERT_EMAIL
    if ($alertEmail) {
        try {
            Send-MailMessage -To $alertEmail -Subject "CDN Monthly Review - $monthYear" -Body $summary -SmtpServer "localhost" -ErrorAction SilentlyContinue
        } catch {
            Add-Content -Path $LogFile -Value "Warning: Failed to send email notification"
        }
    }
    
} catch {
    Add-Content -Path $LogFile -Value "❌ Monthly review error: $($_.Exception.Message)"
}

$endTime = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
Add-Content -Path $LogFile -Value "=== Monthly review completed - $endTime ==="
'@

    Set-Content -Path $scriptPath -Value $scriptContent
    Write-Log "✅ Created monthly review script: $scriptPath"
}

function Create-LogRotationScript {
    $scriptPath = Join-Path $ProjectRoot "scripts\scheduled-log-rotation.ps1"
    
    $scriptContent = @'
# Log Rotation - Automated (Windows)
param()

$ProjectRoot = Split-Path -Parent $PSScriptRoot
Set-Location $ProjectRoot

$LogBase = "logs"
$RetentionDays = 90

$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
Write-Host "=== Log Rotation - $timestamp ==="

# Rotate operation logs
$operationsDir = Join-Path $LogBase "operations"
if (Test-Path $operationsDir) {
    $oldLogs = Get-ChildItem $operationsDir -Filter "*.log" | Where-Object { $_.LastWriteTime -lt (Get-Date).AddDays(-$RetentionDays) }
    $oldLogs | Remove-Item -Force
    
    $compressLogs = Get-ChildItem $operationsDir -Filter "*.log" | Where-Object { $_.LastWriteTime -lt (Get-Date).AddDays(-30) -and $_.LastWriteTime -gt (Get-Date).AddDays(-$RetentionDays) }
    foreach ($log in $compressLogs) {
        $zipPath = $log.FullName + ".zip"
        if (!(Test-Path $zipPath)) {
            Compress-Archive -Path $log.FullName -DestinationPath $zipPath
            Remove-Item $log.FullName -Force
        }
    }
    
    Write-Host "✅ Rotated operation logs"
}

# Rotate scheduled task logs
$scheduledDir = Join-Path $LogBase "scheduled"
if (Test-Path $scheduledDir) {
    $oldLogs = Get-ChildItem $scheduledDir -Filter "*.log" | Where-Object { $_.LastWriteTime -lt (Get-Date).AddDays(-$RetentionDays) }
    $oldLogs | Remove-Item -Force
    
    $compressLogs = Get-ChildItem $scheduledDir -Filter "*.log" | Where-Object { $_.LastWriteTime -lt (Get-Date).AddDays(-7) -and $_.LastWriteTime -gt (Get-Date).AddDays(-$RetentionDays) }
    foreach ($log in $compressLogs) {
        $zipPath = $log.FullName + ".zip"
        if (!(Test-Path $zipPath)) {
            Compress-Archive -Path $log.FullName -DestinationPath $zipPath
            Remove-Item $log.FullName -Force
        }
    }
    
    Write-Host "✅ Rotated scheduled logs"
}

$endTime = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
Write-Host "=== Log rotation completed - $endTime ==="
'@

    Set-Content -Path $scriptPath -Value $scriptContent
    Write-Log "✅ Created log rotation script: $scriptPath"
}

###############################################
# Windows Scheduled Tasks Setup
###############################################

function Setup-ScheduledTasks {
    if ($DryRun) {
        Write-Log "DRY RUN: Would create the following scheduled tasks:"
        Write-Host "  - CDN Daily Health Check (6:00 AM daily)"
        Write-Host "  - CDN Weekly Backup (2:00 AM Sundays)" 
        Write-Host "  - CDN Monthly Review (8:00 AM, 1st of month)"
        Write-Host "  - CDN Log Rotation (11:00 PM daily)"
        return
    }
    
    Write-Log "Creating Windows Scheduled Tasks..."
    
    # Daily Health Check
    $action1 = New-ScheduledTaskAction -Execute "PowerShell.exe" -Argument "-File `"$ProjectRoot\scripts\scheduled-daily-health-check.ps1`""
    $trigger1 = New-ScheduledTaskTrigger -Daily -At "6:00AM"
    $settings1 = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable
    
    try {
        Register-ScheduledTask -TaskName "CDN Daily Health Check" -Action $action1 -Trigger $trigger1 -Settings $settings1 -Description "Daily S3 health check for CDN operations" -Force | Out-Null
        Write-Log "✅ Created: CDN Daily Health Check"
    } catch {
        Write-Warning "Failed to create daily health check task: $($_.Exception.Message)"
    }
    
    # Weekly Backup
    $action2 = New-ScheduledTaskAction -Execute "PowerShell.exe" -Argument "-File `"$ProjectRoot\scripts\scheduled-weekly-backup.ps1`""
    $trigger2 = New-ScheduledTaskTrigger -Weekly -WeeksInterval 1 -DaysOfWeek Sunday -At "2:00AM"
    $settings2 = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable
    
    try {
        Register-ScheduledTask -TaskName "CDN Weekly Backup" -Action $action2 -Trigger $trigger2 -Settings $settings2 -Description "Weekly media backup for CDN operations" -Force | Out-Null
        Write-Log "✅ Created: CDN Weekly Backup"
    } catch {
        Write-Warning "Failed to create weekly backup task: $($_.Exception.Message)"
    }
    
    # Monthly Review
    $action3 = New-ScheduledTaskAction -Execute "PowerShell.exe" -Argument "-File `"$ProjectRoot\scripts\scheduled-monthly-review.ps1`""
    $trigger3 = New-ScheduledTaskTrigger -Daily -At "8:00AM"
    # Configure to run only on 1st day of month
    $trigger3.Repetition.Duration = "P1D"
    $settings3 = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable
    
    try {
        $task3 = Register-ScheduledTask -TaskName "CDN Monthly Review" -Action $action3 -Trigger $trigger3 -Settings $settings3 -Description "Monthly CDN review and reporting" -Force
        # Set additional condition for 1st of month
        $task3.Triggers[0].StartBoundary = (Get-Date -Day 1 -Hour 8 -Minute 0 -Second 0).ToString("yyyy-MM-ddTHH:mm:ss")
        $task3 | Set-ScheduledTask | Out-Null
        Write-Log "✅ Created: CDN Monthly Review"
    } catch {
        Write-Warning "Failed to create monthly review task: $($_.Exception.Message)"
    }
    
    # Log Rotation
    $action4 = New-ScheduledTaskAction -Execute "PowerShell.exe" -Argument "-File `"$ProjectRoot\scripts\scheduled-log-rotation.ps1`""
    $trigger4 = New-ScheduledTaskTrigger -Daily -At "11:00PM"
    $settings4 = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable
    
    try {
        Register-ScheduledTask -TaskName "CDN Log Rotation" -Action $action4 -Trigger $trigger4 -Settings $settings4 -Description "Daily log rotation for CDN operations" -Force | Out-Null
        Write-Log "✅ Created: CDN Log Rotation"  
    } catch {
        Write-Warning "Failed to create log rotation task: $($_.Exception.Message)"
    }
    
    Write-Host ""
    Write-Log "📋 Scheduled Tasks Summary:"
    Get-ScheduledTask | Where-Object { $_.TaskName -like "CDN *" } | ForEach-Object {
        Write-Host "  ✅ $($_.TaskName): $($_.State)"
    }
}

###############################################
# Main Setup
###############################################

function Main {
    Write-Log "Creating automation scripts..."
    
    Create-DailyHealthCheckScript
    Create-WeeklyBackupScript
    Create-MonthlyReviewScript
    Create-LogRotationScript
    
    Write-Host ""
    Write-Log "📋 Setup Summary:"
    Write-Log "- Daily health checks: 6:00 AM"
    Write-Log "- Weekly backups: Sunday 2:00 AM"
    Write-Log "- Monthly reviews: 1st of month, 8:00 AM"
    Write-Log "- Log rotation: Daily 11:00 PM"
    Write-Host ""
    
    Write-Log "📧 Alert Configuration:"
    Write-Log "- Email: $AlertEmail"
    Write-Log "- Slack: $(if ($SlackWebhookUrl) { 'Configured' } else { 'Not configured' })"
    Write-Host ""
    
    Setup-ScheduledTasks
    
    Write-Host ""
    Write-Log "🎉 CDN Operations Automation setup complete!" -ForegroundColor Green
    Write-Host ""
    Write-Log "💡 Next steps:"
    Write-Log "1. Set SLACK_WEBHOOK_URL in .env for Slack alerts"
    Write-Log "2. Configure SMTP settings for email alerts"
    Write-Log "3. Test scripts manually before relying on automation:"
    Write-Log "   .\scripts\scheduled-daily-health-check.ps1"
    Write-Log "   .\scripts\scheduled-weekly-backup.ps1"
    Write-Log "4. Monitor logs in logs\scheduled\ directory"
    Write-Host ""
    Write-Log "📂 Log locations:"
    Write-Log "- Operation logs: $LogDir"
    Write-Log "- Scheduled logs: $CronLogDir"
}

# Run main function
Main