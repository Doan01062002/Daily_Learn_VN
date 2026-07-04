# Git Sync & CI Validation Script

$CommitMsg = $args -join ' '
if ([string]::IsNullOrEmpty($CommitMsg)) {
    $CommitMsg = "chore: auto sync codebase"
}

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host " Running local CI pre-flight checks... " -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

# 1. Validate Prisma Schema
Write-Host "1. Validating Prisma Schema..." -ForegroundColor Yellow
npx.cmd prisma validate
if ($LASTEXITCODE -ne 0) {
    Write-Error "Prisma schema validation failed! Commit aborted."
    exit 1
}
Write-Host "OK: Prisma Schema is valid." -ForegroundColor Green

# 2. Run Linter
Write-Host "2. Running Linter..." -ForegroundColor Yellow
npm.cmd run lint
if ($LASTEXITCODE -ne 0) {
    Write-Error "Lint check failed! Commit aborted."
    exit 1
}
Write-Host "OK: Linter check passed." -ForegroundColor Green

# 3. Build test
Write-Host "3. Testing Production Build..." -ForegroundColor Yellow
npm.cmd run build
if ($LASTEXITCODE -ne 0) {
    Write-Error "Next.js Build failed! Commit aborted."
    exit 1
}
Write-Host "OK: Build test passed." -ForegroundColor Green

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host " Pre-flight checks passed! Committing... " -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

# 4. Git operations
git add .
git commit -m "$CommitMsg"
if ($LASTEXITCODE -ne 0) {
    Write-Warning "Nothing to commit or Git commit failed."
} else {
    Write-Host "OK: Committed successfully with message: '$CommitMsg'" -ForegroundColor Green
}

Write-Host "Pushing code to remote branch..." -ForegroundColor Yellow
git push origin HEAD
if ($LASTEXITCODE -ne 0) {
    Write-Error "Git push failed!"
    exit 1
}
Write-Host "OK: Successfully pushed code to remote repository!" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Cyan
