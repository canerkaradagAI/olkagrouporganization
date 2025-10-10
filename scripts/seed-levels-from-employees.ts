import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Basit bir öncelik sıralaması; bulunmayanlar sona eklenir
const preferredOrder = [
  'Genel Müdür',
  'C Level',
  'Direktör',
  'Kıdemli Müdür',
  'Müdür',
  'Kıdemli Yönetici',
  'Yönetici',
  'Yönetici ve ya Takım Lideri (Depo)',
  'Kıdemli Uzman',
  'Uzman',
  'Uzman Yardımcısı',
  'Stajyer',
  'Mavi Yaka',
  'Destek'
]

async function main() {
  console.log('🔎 Çalışanlardan levelName değerleri okunuyor...')

  const employees = await prisma.employee.findMany({
    where: { levelName: { not: null } },
    select: { levelName: true },
  })

  const uniqueLevels = Array.from(new Set(
    employees
      .map(e => (e.levelName || '').trim())
      .filter(Boolean)
  ))

  console.log('📋 Bulunan seviyeler:', uniqueLevels)

  // Var olan seviyeleri çek
  const existing = await prisma.jobTitleLevel.findMany()
  const existingByName = new Map(existing.map(l => [l.levelName, l]))

  // Sıra numarası hazırlığı
  let nextOrder = existing.length > 0 ? Math.max(...existing.map(l => l.levelOrder)) + 1 : 1

  // Önce preferredOrder'a göre ekle; yeni olanların hepsi sona (nextOrder)
  for (const name of preferredOrder) {
    if (!uniqueLevels.includes(name)) continue

    const current = existingByName.get(name)
    if (current) continue

    await prisma.jobTitleLevel.create({
      data: {
        levelName: name,
        levelOrder: nextOrder++,
      }
    })
    console.log(`✅ Eklendi: ${name}`)
  }

  // Preferred listede olmayanlar için de sona ekle
  for (const name of uniqueLevels) {
    if (preferredOrder.includes(name)) continue
    if (existingByName.has(name)) continue

    await prisma.jobTitleLevel.create({
      data: {
        levelName: name,
        levelOrder: nextOrder++,
      }
    })
    console.log(`✅ Eklendi: ${name}`)
  }

  console.log('🎉 Tamamlandı.')
  await prisma.$disconnect()
}

main().catch(async (e) => {
  console.error(e)
  await prisma.$disconnect()
  process.exit(1)
})
