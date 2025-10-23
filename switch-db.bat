@echo off
REM Database Switching Script for Windows

echo 🔄 Database Provider Switching Tool
echo ==================================

if "%1"=="sqlite" (
    echo 📦 Switching to SQLite...
    copy env.sqlite .env
    echo ✅ Switched to SQLite
    echo 📝 Run: npx prisma generate ^&^& npx prisma db push
) else if "%1"=="postgresql" (
    echo 🐘 Switching to PostgreSQL...
    copy env.postgresql .env
    echo ✅ Switched to PostgreSQL
    echo 📝 Run: npx prisma generate ^&^& npx prisma db push
) else (
    echo ❌ Usage: switch-db.bat [sqlite^|postgresql]
    echo.
    echo Examples:
    echo   switch-db.bat sqlite      # Switch to SQLite
    echo   switch-db.bat postgresql  # Switch to PostgreSQL
)
