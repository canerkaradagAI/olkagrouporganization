import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const levelColorByName: Record<string, string> = {
  'Yönetim': '#111827',
  'Genel Müdür': '#0f766e',
  'C Level': '#155e75',
  'Direktör': '#1d4ed8',
  'Kıdemli Müdür': '#2563eb',
  'Müdür': '#3b82f6',
  'Kıdemli Yönetici': '#7c3aed',
  'Yönetici ve ya Takım Lideri (Depo)': '#9333ea',
  'Yönetici': '#a855f7',
  'Kıdemli Uzman': '#ef4444',
  'Uzman': '#f97316',
  'Uzman Yardımcısı': '#f59e0b',
  'Mavi Yaka': '#10b981',
  'Destek': '#06b6d4',
  'Asistan': '#84cc16',
  'Stajyer': '#a3a3a3',
}

async function main() {
  console.log('🎨 JobTitleLevel renkleri güncelleniyor...')
  const levels = await prisma.jobTitleLevel.findMany()

  for (const l of levels) {
    const color = levelColorByName[l.levelName]
    if (!color) {
      console.log(`⚠️ Renk eşleşmesi yok, atlandı: ${l.levelName}`)
      continue
    }
    await prisma.jobTitleLevel.update({ where: { levelId: l.levelId }, data: { color } })
    console.log(`✅ ${l.levelName} -> ${color}`)
  }

  console.log('✅ Tamamlandı.')
  await prisma.$disconnect()
}

main().catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1) })
