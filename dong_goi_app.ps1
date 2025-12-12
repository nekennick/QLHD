# Script đóng gói ứng dụng QLHD cho user
# Chạy script này từ thư mục gốc của project

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  DONG GOI UNG DUNG QLHD" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Tạo thư mục output
$outputDir = "QLHD-app"
$zipFile = "QLHD-app.zip"

# Xóa thư mục cũ nếu có
if (Test-Path $outputDir) {
    Write-Host "Xoa thu muc cu..." -ForegroundColor Yellow
    Remove-Item -Recurse -Force $outputDir
}

if (Test-Path $zipFile) {
    Remove-Item -Force $zipFile
}

Write-Host "Dang build ung dung..." -ForegroundColor Green
Set-Location app
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "LOI: Build that bai!" -ForegroundColor Red
    exit 1
}
Set-Location ..

Write-Host "Dang tao thu muc dong goi..." -ForegroundColor Green
New-Item -ItemType Directory -Path $outputDir | Out-Null

# Copy các file cần thiết
Write-Host "Dang copy cac file..." -ForegroundColor Green

# Copy thư mục .next (build output)
Copy-Item -Recurse "app\.next" "$outputDir\.next"

# Copy public folder nếu có
if (Test-Path "app\public") {
    Copy-Item -Recurse "app\public" "$outputDir\public"
}

# Copy prisma
Copy-Item -Recurse "app\prisma" "$outputDir\prisma"

# Copy package.json và các config
Copy-Item "app\package.json" "$outputDir\"
Copy-Item "app\package-lock.json" "$outputDir\" -ErrorAction SilentlyContinue

# Copy node_modules (cần thiết để chạy)
Write-Host "Dang copy node_modules (co the mat vai phut)..." -ForegroundColor Yellow
Copy-Item -Recurse "app\node_modules" "$outputDir\node_modules"

# Copy file .env mẫu
@"
# Database
DATABASE_URL="file:./prisma/dev.db"

# NextAuth Secret
AUTH_SECRET="qlhd-secret-key-2024"
"@ | Out-File -FilePath "$outputDir\.env" -Encoding UTF8

# Copy hướng dẫn sử dụng
Copy-Item "HUONG_DAN_USER.md" "$outputDir\"

# Tạo file batch để chạy nhanh
@"
@echo off
echo ========================================
echo   KHOI DONG UNG DUNG QLHD
echo ========================================
echo.
echo Dang khoi dong... Vui long doi...
echo.
echo Khi thay dong "Local: http://localhost:3000"
echo Mo trinh duyet va truy cap: http://localhost:3000
echo.
echo Nhan Ctrl+C de dung ung dung
echo ========================================
echo.
npm run start
pause
"@ | Out-File -FilePath "$outputDir\CHAY_UNG_DUNG.bat" -Encoding ASCII

# Tạo file để seed data
@"
@echo off
echo Dang tao tai khoan mau...
echo.
curl http://localhost:3000/api/seed
echo.
echo Hoan tat! Tai khoan mau da duoc tao.
echo - lanhdao / 123456
echo - thuchien / 123456
pause
"@ | Out-File -FilePath "$outputDir\TAO_TAI_KHOAN_MAU.bat" -Encoding ASCII

Write-Host ""
Write-Host "Dang nen thanh file ZIP..." -ForegroundColor Green
Compress-Archive -Path $outputDir -DestinationPath $zipFile -Force

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  HOAN TAT!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Thu muc: $outputDir" -ForegroundColor Cyan
Write-Host "File ZIP: $zipFile" -ForegroundColor Cyan
Write-Host ""
Write-Host "Gui file $zipFile cho user va huong dan:" -ForegroundColor Yellow
Write-Host "1. Giai nen file QLHD-app.zip" -ForegroundColor White
Write-Host "2. Mo thu muc da giai nen" -ForegroundColor White
Write-Host "3. Click doi vao file CHAY_UNG_DUNG.bat" -ForegroundColor White
Write-Host "4. Mo trinh duyet: http://localhost:3000" -ForegroundColor White
Write-Host ""
