import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function addColorsToLevels() {
  try {
    console.log('🎨 İş Unvan Seviyelerine renkler ekleniyor...\n')

    const levelColors = [
      {
        levelOrder: 1,
        levelName: 'Genel Müdür',
        color: '#DC2626', // Kırmızı
        tailwindClass: 'bg-red-600'
      },
      {
        levelOrder: 2,
        levelName: 'C Level',
        color: '#7C3AED', // Mor
        tailwindClass: 'bg-purple-600'
      },
      {
        levelOrder: 3,
        levelName: 'Direktör',
        color: '#2563EB', // Mavi
        tailwindClass: 'bg-blue-600'
      },
      {
        levelOrder: 4,
        levelName: 'Kıdemli Müdür',
        color: '#059669', // Yeşil
        tailwindClass: 'bg-emerald-600'
      },
      {
        levelOrder: 5,
        levelName: 'Müdür',
        color: '#D97706', // Turuncu
        tailwindClass: 'bg-amber-600'
      }
    ]

    for (const levelColor of levelColors) {
      await prisma.jobTitleLevel.update({
        where: { levelOrder: levelColor.levelOrder },
        data: { 
          color: levelColor.color
        }
      })
      console.log(`✓ ${levelColor.levelOrder}. ${levelColor.levelName} → ${levelColor.color} (${levelColor.tailwindClass})`)
    }

    console.log('\n🎉 İlk 5 seviyeye renkler başarıyla eklendi!')
    
    // Güncellenmiş seviyeleri göster
    console.log('\n📊 Güncellenmiş Seviyeler:')
    const updatedLevels = await prisma.jobTitleLevel.findMany({
      where: { levelOrder: { lte: 5 } },
      orderBy: { levelOrder: 'asc' }
    })
    
    updatedLevels.forEach(level => {
      console.log(`  ${level.levelOrder}. ${level.levelName} - ${level.color}`)
    })

  } catch (error) {
    console.error('❌ Hata:', error)
  } finally {
    await prisma.$disconnect()
  }
}

addColorsToLevels()
