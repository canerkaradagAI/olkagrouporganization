import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function run() {
  console.log('🔧 Alias yönetici eşlemesi çalışıyor...')

  // Yönetici ana kayıtlarını bul
  const hande = await prisma.employee.findFirst({ where: { firstLastName: { contains: 'Hande Akat' } } })
  const seniha = await prisma.employee.findFirst({ where: { firstLastName: { contains: 'Seniha Göksu Köksal' } } })

  console.log('👤 Hande:', hande?.currAccCode, hande?.firstLastName)
  console.log('👤 Seniha:', seniha?.currAccCode, seniha?.firstLastName)

  let updated = 0

  if (hande) {
    // Hande Akatlı için olası yazımlar
    const handeAliases = [
      'Hande Akatlı', 'Hande Akatli', 'Hande Akatlı ', ' Hande Akatlı'
    ]
    const toFixHande = await prisma.employee.findMany({
      where: {
        managerId: null,
        // CSV'den gelen managerName metnini çalışan kayıtlarında tutmadığımız için
        // ipucu olarak, Hande’nin doğrudan altında bilinen kişileri tekrar atayacağız.
        // Daha garanti: Hande'yi managerName olarak taşıyanları import esnasında custom alanla tutmadığımız için
        // isim eşlemesi yapabileceğimiz çalışanları string arama ile bulalım (not ideal). Burada sadece güvenli güncellemeler yapacağız.
        firstLastName: { in: [] }
      }
    })
    // Not: import akışında managerName tutulmadığından burada doğrudan toplu düzeltme yerine
    // belirli bilinen isimleri güncelleyelim (loglarda geçenler):
    const knownUnderHande = [
      'Safa Güneyli','Gülhanım Taş','Rafiye Türk Bayrak','Emircan Karaduman','Fadime Köse'
    ]
    for (const name of knownUnderHande) {
      const res = await prisma.employee.updateMany({
        where: { firstLastName: name },
        data: { managerId: hande.currAccCode }
      })
      updated += res.count
    }
  }

  if (seniha) {
    // Seniha için olası yazımlar
    const knownUnderSeniha = [
      'Ufuk Güler','Kubilay Yılmaz','Özge Yalçınkaya'
    ]
    for (const name of knownUnderSeniha) {
      const res = await prisma.employee.updateMany({
        where: { firstLastName: name },
        data: { managerId: seniha.currAccCode }
      })
      updated += res.count
    }
  }

  console.log(`✅ Alias düzeltmeleri tamamlandı. Güncellenen kayıt: ${updated}`)
}

run()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(async () => { await prisma.$disconnect() })


