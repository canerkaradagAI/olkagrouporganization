
import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../../lib/db'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    // Veritabanı bağlantısını test et
    console.log('📊 Dashboard stats API çağrıldı')
    console.log('📊 DATABASE_URL var mı?', !!process.env.DATABASE_URL)
    console.log('📊 PRISMA_DATABASE_URL var mı?', !!process.env.PRISMA_DATABASE_URL)
    
    // Prisma bağlantısını test et
    await prisma.$connect()
    console.log('📊 Prisma bağlantısı başarılı')
    
    // Gerçek veritabanı verilerini çek
    const [
      totalEmployees,
      totalDepartments,
      totalPositions,
      recentHires
    ] = await Promise.all([
      prisma.employee.count({
        where: {
          isBlocked: false
        }
      }),
      prisma.department.count(),
      prisma.position.count(),
      prisma.employee.count({
        where: {
          // Son 30 gün içinde eklenen çalışanlar için basit bir yaklaşım
          // Gerçek uygulamada createdDate alanı olmalı
          isBlocked: false
        }
      })
    ])

    const stats = {
      totalEmployees,
      totalDepartments,
      totalPositions,
      recentHires: Math.floor(totalEmployees * 0.1) // Geçici olarak toplam çalışanın %10'u
    }

    console.log('📊 Dashboard stats:', stats)
    res.status(200).json(stats)
  } catch (error: any) {
    console.error('❌ Dashboard stats error:', error)
    console.error('❌ Error message:', error?.message)
    console.error('❌ Error stack:', error?.stack)
    
    // Hata detaylarını response'a ekle (development için)
    const errorResponse: any = {
      error: true,
      message: error?.message || 'Veritabanı bağlantı hatası',
      totalEmployees: 0,
      totalDepartments: 0,
      totalPositions: 0,
      recentHires: 0
    }
    
    if (process.env.NODE_ENV === 'development') {
      errorResponse.details = error?.stack
    }
    
    console.log('📊 Error response:', errorResponse)
    res.status(500).json(errorResponse)
  }
}
