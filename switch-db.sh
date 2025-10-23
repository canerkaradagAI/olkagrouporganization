#!/bin/bash
# Database Switching Script

echo "🔄 Database Provider Switching Tool"
echo "=================================="

if [ "$1" = "sqlite" ]; then
    echo "📦 Switching to SQLite..."
    cp env.sqlite .env
    echo "✅ Switched to SQLite"
    echo "📝 Run: npx prisma generate && npx prisma db push"
elif [ "$1" = "postgresql" ]; then
    echo "🐘 Switching to PostgreSQL..."
    cp env.postgresql .env
    echo "✅ Switched to PostgreSQL"
    echo "📝 Run: npx prisma generate && npx prisma db push"
else
    echo "❌ Usage: ./switch-db.sh [sqlite|postgresql]"
    echo ""
    echo "Examples:"
    echo "  ./switch-db.sh sqlite      # Switch to SQLite"
    echo "  ./switch-db.sh postgresql  # Switch to PostgreSQL"
fi
