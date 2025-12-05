@echo off
echo ====================================
echo Proje Başlatma Scripti
echo ====================================
echo.

echo 1. Docker Compose başlatılıyor...
docker-compose up -d
if %errorlevel% neq 0 (
    echo HATA: Docker Desktop çalışmıyor! Lütfen Docker Desktop'ı başlatın.
    pause
    exit /b 1
)

echo.
echo 2. PostgreSQL'in hazır olması bekleniyor (10 saniye)...
timeout /t 10 /nobreak >nul

echo.
echo 3. Prisma Client generate ediliyor...
npx prisma generate

echo.
echo 4. Veritabanı şeması push ediliyor...
npx prisma db push

echo.
echo 5. Veriler import ediliyor...
npx tsx setup-database.ts

echo.
echo 6. Next.js sunucusu başlatılıyor...
npm run dev

