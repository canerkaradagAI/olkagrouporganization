# 🚀 Vercel Deployment - Hızlı Başlangıç

## ⚡ Hızlı Adımlar

### 1. Vercel Postgres Oluştur (5 dakika)

1. [Vercel Dashboard](https://vercel.com/dashboard) → Projenizi açın
2. **Storage** → **Create Database** → **Postgres**
3. Veritabanı adı: `olkagroup-db`
4. Region seçin → **Create**

### 2. Environment Variables Ekle

Vercel Dashboard → **Settings** → **Environment Variables**:

```
DATABASE_URL=postgresql://... (Vercel otomatik ekler)
NEXTAUTH_URL=https://your-project.vercel.app
NEXTAUTH_SECRET=generate-secret-key-here
NODE_ENV=production
```

**NEXTAUTH_SECRET oluştur:**
- https://generate-secret.vercel.app/32
- veya: `openssl rand -base64 32`

### 3. Veritabanı Şemasını Oluştur

```bash
# Vercel Postgres connection string'ini al (Vercel Dashboard'dan)
# Geçici olarak .env'e ekleyin:
DATABASE_URL="postgresql://vercel-postgres-url"

# Schema'yı push et
npx prisma db push

# Veya migration kullan
npx prisma migrate deploy
```

### 4. Verileri Aktar (Yerel → Vercel)

**Yöntem 1: pg_dump (Önerilen)**
```bash
# 1. Yerel veritabanından dump al
npm run db:export
# veya
docker exec olka-postgres pg_dump -U postgres olkagroup > vercel-backup.sql

# 2. Vercel Postgres'e import et
# Vercel Postgres connection string'i ile:
psql "postgresql://vercel-url" < vercel-backup.sql
```

**Yöntem 2: Script ile**
```bash
# 1. .env.vercel dosyası oluştur
VERCEL_DATABASE_URL=postgresql://vercel-postgres-url

# 2. Script'i çalıştır
tsx scripts/export-to-vercel.ts
```

### 5. Deploy Et

**GitHub ile:**
1. Projeyi GitHub'a push edin
2. Vercel → **Add New Project** → Repo seçin
3. Environment variables ekleyin
4. **Deploy**

**CLI ile:**
```bash
npm i -g vercel
vercel login
vercel
```

## ✅ Kontrol Listesi

- [ ] Vercel Postgres oluşturuldu
- [ ] Environment variables eklendi (DATABASE_URL, NEXTAUTH_URL, NEXTAUTH_SECRET)
- [ ] Veritabanı şeması oluşturuldu (prisma db push)
- [ ] Veriler aktarıldı
- [ ] Build başarılı (package.json'da postinstall eklendi)
- [ ] Production URL'de test edildi

## 🔧 package.json Güncellemeleri

✅ `postinstall: "prisma generate"` eklendi
✅ `build: "prisma generate && next build"` güncellendi
✅ `db:export` script'i eklendi

## 📝 Notlar

- Vercel Postgres **otomatik olarak** `DATABASE_URL` environment variable'ını ekler
- Connection pooling Prisma tarafından otomatik yönetilir
- Serverless ortamda connection limit'ler önemlidir
- Production'da `prisma migrate deploy` kullanın (migration varsa)

## 🆘 Sorun Giderme

**Build hatası: Prisma Client**
- `package.json`'da `postinstall` script'i var mı kontrol edin

**Connection timeout**
- Connection string'e `?connection_limit=1` ekleyin
- Vercel Postgres connection pooling kullanın

**Migration hatası**
- `npx prisma migrate deploy` çalıştırın
- Vercel build logs'u kontrol edin

