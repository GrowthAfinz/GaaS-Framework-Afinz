#!/usr/bin/env pwsh
# deploy-edge-function.ps1
# Uso: .\deploy-edge-function.ps1 -Token "sbp_xxxx..."

param(
    [Parameter(Mandatory=$true)]
    [string]$Token
)

$env:PATH += ";$env:USERPROFILE\bin"
$env:SUPABASE_ACCESS_TOKEN = $Token

$PROJECT_ID = "mipiwxadnpwtcgfcedym"
$FUNCTION_NAME = "collect-meta-creatives"

Write-Host "🔗 Linking to Supabase project $PROJECT_ID..." -ForegroundColor Cyan
supabase link --project-ref $PROJECT_ID

if ($LASTEXITCODE -ne 0) {
    Write-Error "❌ Failed to link project. Check your token."
    exit 1
}

Write-Host "🚀 Deploying Edge Function '$FUNCTION_NAME'..." -ForegroundColor Cyan
supabase functions deploy $FUNCTION_NAME --no-verify-jwt

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Edge Function deployed successfully!" -ForegroundColor Green
    Write-Host "Function URL: https://$PROJECT_ID.supabase.co/functions/v1/$FUNCTION_NAME"
} else {
    Write-Error "❌ Deploy failed."
    exit 1
}
