@echo off
echo Veritabani yedekleme basladi...

REM Tarih ve saat bilgisi al
for /f "tokens=2 delims==" %%a in ('wmic OS Get localdatetime /value') do set "dt=%%a"
set "YY=%dt:~2,2%" & set "YYYY=%dt:~0,4%" & set "MM=%dt:~4,2%" & set "DD=%dt:~6,2%"
set "HH=%dt:~8,2%" & set "Min=%dt:~10,2%" & set "Sec=%dt:~12,2%"
set "timestamp=%YYYY%%MM%%DD%_%HH%%Min%%Sec%"

REM Yedek dosya adi
set "backup_file=prisma\dev_backup_%timestamp%.db"

REM Veritabani yedekle
copy "prisma\dev.db" "%backup_file%"

if %errorlevel% equ 0 (
    echo ✅ Yedekleme basarili: %backup_file%
) else (
    echo ❌ Yedekleme basarisiz!
    pause
    exit /b 1
)

REM Eski yedekleri temizle (son 10 yedek hariç)
for /f "skip=10 delims=" %%i in ('dir /b /o-d prisma\dev_backup_*.db 2^>nul') do del "prisma\%%i"

echo ✅ Yedekleme tamamlandi!
pause
