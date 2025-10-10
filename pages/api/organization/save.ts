import type { NextApiRequest, NextApiResponse } from 'next'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

interface OrganizationChange {
  currAccCode: string
  managerId: string | null
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    console.log('💾 Organization save API çağrıldı')
    
    const { changes }: { changes: OrganizationChange[] } = req.body
    
    if (!changes || !Array.isArray(changes)) {
      return res.status(400).json({ message: 'Invalid changes data' })
    }

    console.log('📝 Kaydedilecek değişiklikler:', changes.length, 'adet')

    // Her değişikliği veritabanına kaydet
    const updatePromises = changes.map(async (change) => {
      try {
        const updated = await prisma.employee.update({
          where: { currAccCode: change.currAccCode },
          data: { managerId: change.managerId },
        })
        console.log(`✅ ${change.currAccCode} -> managerId: ${change.managerId}`)
        return updated
      } catch (error) {
        console.error(`❌ ${change.currAccCode} güncellenirken hata:`, error)
        throw error
      }
    })

    // Tüm güncellemeleri paralel olarak yap
    const results = await Promise.all(updatePromises)
    
    console.log('🎉 Tüm değişiklikler başarıyla kaydedildi:', results.length, 'adet')

    res.status(200).json({ 
      message: 'Organizasyon değişiklikleri başarıyla kaydedildi',
      updatedCount: results.length,
      changes: results.map(r => ({
        currAccCode: r.currAccCode,
        managerId: r.managerId
      }))
    })
  } catch (error) {
    console.error('❌ Organization save API hatası:', error)
    res.status(500).json({ 
      message: 'Organizasyon değişiklikleri kaydedilirken hata oluştu',
      error: error.message 
    })
  } finally {
    await prisma.$disconnect()
  }
}
