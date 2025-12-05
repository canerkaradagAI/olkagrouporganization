# Vercel Deployment Rehberi

## 📋 Ön Hazırlık

### 1. Vercel Postgres Veritabanı Oluşturma

1. [Vercel Dashboard](https://vercel.com/dashboard) → Projenizi seçin veya yeni proje oluşturun
2. **Storage** sekmesine gidin
3. **Create Database** → **Postgres** seçin
4. Veritabanı adını girin (örn: `olkagroup-db`)
5. Region seçin (en yakın bölgeyi seçin)
6. **Create** butonuna tıklayın

### 2. Environment Variables Ayarlama

Vercel Dashboard → **Settings** → **Environment Variables** bölümüne gidin:

#### Gerekli Environment Variables:

```
DATABASE_URL=postgresql://... (Vercel Postgres otomatik ekler)
NEXTAUTH_URL=https://your-project.vercel.app
NEXTAUTH_SECRET=your-production-secret-key-here (güçlü bir key oluşturun)
NODE_ENV=production
```

**NEXTAUTH_SECRET oluşturma:**
```bash
openssl rand -base64 32
```

veya online: https://generate-secret.vercel.app/32

### 3. Veritabanı Migrasyonu

#### Yerel veritabanından veri aktarımı:

1. **Yerel veritabanınızı export edin:**
```bash
# PostgreSQL dump al
docker exec olka-postgres pg_dump -U postgres olkagroup > backup.sql
```

2. **Vercel Postgres'e bağlanın ve import edin:**
```bash
# Vercel CLI ile bağlan
npx vercel env pull .env.production

# Vercel Postgres connection string'i al
# Vercel Dashboard → Storage → Postgres → .env.local dosyasına ekleyin

# Import et
psql "YOUR_VERCEL_POSTGRES_URL" < backup.sql
```

**Alternatif: Prisma Migrate kullanarak:**
```bash
# Vercel Postgres connection string'i .env'e ekleyin
npx prisma migrate deploy
```

### 4. Build Ayarları

Vercel otomatik olarak Next.js projelerini algılar, ancak build komutlarını kontrol edin:

**Build Command:** `npm run build` (otomatik)
**Output Directory:** `.next` (otomatik)
**Install Command:** `npm install` (otomatik)

### 5. Prisma Client Build

Vercel build sırasında Prisma Client'ı generate etmek için:

`package.json`'da build script'ine ekleyin:
```json
"scripts": {
  "build": "prisma generate && next build",
  "postinstall": "prisma generate"
}
```

### 6. Deploy

#### GitHub ile (Önerilen):
1. Projenizi GitHub'a push edin
2. Vercel Dashboard → **Add New Project**
3. GitHub repo'nuzu seçin
4. Environment variables'ları ekleyin
5. **Deploy** butonuna tıklayın

#### Vercel CLI ile:
```bash
npm i -g vercel
vercel login
vercel
```

## 🔄 Veri Aktarımı (Yerel → Vercel Postgres)

### Yöntem 1: pg_dump ile

```bash
# 1. Yerel veritabanından dump al
docker exec olka-postgres pg_dump -U postgres olkagroup > vercel-backup.sql

# 2. Vercel Postgres connection string'i al (Vercel Dashboard'dan)
# 3. Import et
psql "postgresql://..." < vercel-backup.sql
```

### Yöntem 2: Prisma ile

```bash
# 1. Vercel Postgres URL'ini .env'e ekle
DATABASE_URL="postgresql://vercel-postgres-url"

# 2. Schema'yı push et
npx prisma db push

# 3. Seed data'yı çalıştır (eğer varsa)
npm run seed
```

### Yöntem 3: Script ile (Önerilen)

Mevcut verilerinizi aktarmak için bir migration script'i oluşturun.

## ⚠️ Önemli Notlar

1. **Connection Pooling**: Vercel serverless ortamında connection pooling önemlidir. Prisma bunu otomatik yönetir.

2. **Environment Variables**: Tüm environment variables'ları Vercel Dashboard'dan ekleyin (Production, Preview, Development için ayrı ayrı).

3. **Build Timeout**: Büyük veritabanı migration'ları için build timeout'u artırmanız gerekebilir.

4. **Prisma Binary**: Vercel'de Prisma binary'lerinin doğru çalışması için `prisma/schema.prisma`'da binary targets kontrol edin.

## 🧪 Test

Deploy sonrası:
1. Vercel URL'inize gidin
2. Veritabanı bağlantısını test edin
3. API endpoint'lerini kontrol edin
4. Authentication'ı test edin

## 📊 Monitoring

- Vercel Dashboard → **Analytics** → Performans metrikleri
- Vercel Dashboard → **Storage** → Postgres → Query logs
- Vercel Dashboard → **Functions** → API route logs

## 🔧 Troubleshooting

### Prisma Client hatası:
```bash
# Build sırasında Prisma generate edilmemiş
# package.json'a postinstall ekleyin
"postinstall": "prisma generate"
```

### Connection timeout:
- Connection string'de `?connection_limit=1&pool_timeout=20` ekleyin
- Vercel Postgres connection pooling kullanın

### Migration hataları:
```bash
# Production'da migration çalıştır
npx prisma migrate deploy
```

