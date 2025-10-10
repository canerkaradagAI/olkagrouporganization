import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// İstenen sıralama (üstten alta)
const desiredOrder = [
  'Yönetim Kurulu',
  'Genel Müdür',
  'C Level',
  'Direktör',
  'Kıdemli Müdür',
  'Müdür',
  'Müdür Yardımcısı',
  'Kıdemli Yönetici',
  'Yönetici',
  'Kıdemli Uzman',
  'Uzman',
  'Uzman Danışman',
  'Uzman Yardımcısı',
  'Danışman',
  'Mavi Yaka',
  'Destek',
  'Stajyer'
]

async function main() {
  console.log('🔧 JobTitleLevel sıralaması güncelleniyor...')

  const levels = await prisma.jobTitleLevel.findMany()
  const nameToId = new Map(levels.map(l => [l.levelName, l.levelId]))

  // 1) Çakışmayı önlemek için tüm levelOrder değerlerini geçici olarak 1000+ yap
  await prisma.$transaction(
    levels.map((l, idx) =>
      prisma.jobTitleLevel.update({ where: { levelId: l.levelId }, data: { levelOrder: 1000 + idx } })
    )
  )

  // 2) İstenen sırayı uygula
  let order = 1
  for (const name of desiredOrder) {
    const id = nameToId.get(name)
    if (!id) {
      console.log(`⚠️ Bulunamadı, atlanıyor: ${name}`)
      continue
    }
    await prisma.jobTitleLevel.update({ where: { levelId: id }, data: { levelOrder: order++ } })
    console.log(`✅ ${name} -> ${order - 1}`)
  }

  // 3) Listede olmayan diğer seviyeler en sona alfabetik
  const remaining = levels
    .map(l => l.levelName)
    .filter(n => !desiredOrder.includes(n))
    .sort((a, b) => a.localeCompare(b, 'tr'))

  for (const name of remaining) {
    const id = nameToId.get(name)!
    await prisma.jobTitleLevel.update({ where: { levelId: id }, data: { levelOrder: order++ } })
    console.log(`➕ ${name} -> ${order - 1}`)
  }

  const final = await prisma.jobTitleLevel.findMany({ orderBy: { levelOrder: 'asc' } })
  console.log('\n📋 Nihai sıra:')
  for (const l of final) {
    console.log(`${l.levelOrder}. ${l.levelName}`)
  }

  await prisma.$disconnect()
}

main().catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1) })
