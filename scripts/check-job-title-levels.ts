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
        level: true,
        location: true,
        brand: true,
        department: true
      }
    })
    console.log('\n💼 Pozisyonlar ve Seviyeleri:')
    positions.forEach(position => {
      const levelInfo = position.level ? `${position.level.levelOrder}. ${position.level.levelName}` : 'Seviye atanmamış'
      console.log(`  - ${position.positionName} (${levelInfo}) - ${position.location.locationName}, ${position.brand.brandName}, ${position.department.departmentName}`)
    })

    // Level distribution
    const levelDistribution = await prisma.position.groupBy({
      by: ['levelId'],
      _count: {
        positionId: true
      }
    })

    console.log('\n📈 Seviye Dağılımı:')
    for (const item of levelDistribution) {
      const level = item.levelId ? await prisma.jobTitleLevel.findUnique({ where: { levelId: item.levelId } }) : null
      const levelName = level ? level.levelName : 'Seviye atanmamış'
      console.log(`  - ${levelName}: ${item._count.positionId} pozisyon`)
    }

    console.log('\n✅ İş unvan seviyeleri kontrolü tamamlandı!')
  } catch (error) {
    console.error('❌ Hata:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkJobTitleLevels()
