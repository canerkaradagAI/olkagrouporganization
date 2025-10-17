import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function seedJobTitleLevels() {
  try {
    console.log('📊 İş Unvan Seviyeleri ekleniyor...\n')

    const jobTitleLevels = [
      {
        levelName: 'Genel Müdür',
        levelOrder: 1,
        description: 'En üst düzey yönetici pozisyonu'
      },
      {
        levelName: 'C Level',
        levelOrder: 2,
        description: 'C-Level yöneticiler (CEO, CTO, CFO vb.)'
      },
      {
        levelName: 'Direktör',
        levelOrder: 3,
        description: 'Direktör seviyesi yöneticiler'
      },
      {
        levelName: 'Kıdemli Müdür',
        levelOrder: 4,
        description: 'Kıdemli müdür pozisyonları'
      },
      {
        levelName: 'Müdür',
        levelOrder: 5,
        description: 'Müdür seviyesi pozisyonlar'
      },
      {
        levelName: 'Kıdemli Yönetici',
        levelOrder: 6,
        description: 'Kıdemli yönetici pozisyonları'
      },
      {
        levelName: 'Yönetici ve ya Takım Lideri (Depo)',
        levelOrder: 7,
        description: 'Yönetici veya takım lideri pozisyonları'
      },
      {
        levelName: 'Kıdemli Uzman',
        levelOrder: 8,
        description: 'Kıdemli uzman pozisyonları'
      },
      {
        levelName: 'Uzman',
        levelOrder: 9,
        description: 'Uzman seviyesi pozisyonlar'
      },
      {
        levelName: 'Uzman Yardımcısı',
        levelOrder: 10,
        description: 'Uzman yardımcısı pozisyonları'
      }
    ]

    for (const level of jobTitleLevels) {
      await prisma.jobTitleLevel.create({
        data: level
      })
      console.log(`✓ ${level.levelOrder}. ${level.levelName} eklendi`)
    }

    console.log('\n✅ Tüm iş unvan seviyeleri başarıyla eklendi!')
    
    // Mevcut pozisyonları güncelle
    console.log('\n🔄 Mevcut pozisyonlar güncelleniyor...')
    
    const positions = await prisma.position.findMany()
    const levels = await prisma.jobTitleLevel.findMany()
    
    // Pozisyon isimlerine göre seviye ataması
    const positionLevelMap = {
      'Genel Müdür': 1,
      'Satış Müdürü': 5,
      'Lojistik Uzmanı': 9,
      'Muhasebe Uzmanı': 9,
      'IT Uzmanı': 9
    }
    
    // Position modelinde levelId bulunmuyor, bu kısmı kaldırıyoruz
    console.log('⚠️ Position modelinde levelId bulunmuyor, pozisyon seviye ataması yapılamıyor')

    console.log('\n🎉 İş unvan seviyeleri sistemi tamamlandı!')
  } catch (error) {
    console.error('❌ Hata:', error)
  } finally {
    await prisma.$disconnect()
  }
}

seedJobTitleLevels()
