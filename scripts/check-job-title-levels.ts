import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkJobTitleLevels() {
  try {
    console.log('🔍 İş Unvan Seviyeleri kontrol ediliyor...\n')

    // JobTitleLevels
    const levels = await prisma.jobTitleLevel.findMany({
      orderBy: { levelOrder: 'asc' }
    })
    console.log('📊 İş Unvan Seviyeleri:')
    levels.forEach(level => {
      console.log(`  ${level.levelOrder}. ${level.levelName} - ${level.description}`)
    })

    // Positions with levels
    const positions = await prisma.position.findMany({
      include: {
        department: true
      }
    })
    console.log('\n💼 Pozisyonlar ve Seviyeleri:')
    positions.forEach(position => {
      console.log(`  - ${position.positionName} - ${position.department?.departmentName || 'No Department'}`)
    })

    // Level distribution - Position modelinde levelId yok, bu kısmı kaldırıyoruz
    console.log('\n📈 Seviye Dağılımı: Position modelinde levelId bulunmuyor')

    console.log('\n✅ İş unvan seviyeleri kontrolü tamamlandı!')
  } catch (error) {
    console.error('❌ Hata:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkJobTitleLevels()
