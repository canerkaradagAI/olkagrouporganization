# Olka Group Organizasyon Portalı

Modern organizasyon yönetim sistemi - Next.js, Prisma, SQLite ile geliştirilmiştir.

## 🚀 Özellikler

- 📊 Dashboard ve istatistikler
- 👥 Çalışan yönetimi
- 🏢 Departman organizasyonu
- 📈 Pozisyon takibi
- 🔍 Gelişmiş arama ve filtreleme
- 📱 Responsive tasarım

## 🛠️ Teknolojiler

- **Frontend**: Next.js 14, React, TypeScript
- **Backend**: Next.js API Routes
- **Database**: SQLite + Prisma ORM
- **UI**: Tailwind CSS, Lucide Icons
- **Deployment**: Vercel

## 📦 Kurulum

```bash
# Bağımlılıkları yükle
npm install

# Database'i hazırla
npx prisma generate
npx prisma db push

# Geliştirme sunucusunu başlat
npm run dev
```

## 🌐 Erişim

- **Local**: http://localhost:3000
- **Prisma Studio**: http://localhost:5555

## 📊 Database

- **Toplam Çalışan**: 1288
- **Departman**: 26
- **Pozisyon**: 608

## 🔧 API Endpoints

- `/api/dashboard/stats` - Dashboard istatistikleri
- `/api/organization/list` - Çalışan listesi
- `/api/organization/filters` - Filtre seçenekleri
- `/api/organization/levels` - Seviye bilgileri

## 📝 Lisans

Bu proje Olka Group için geliştirilmiştir.