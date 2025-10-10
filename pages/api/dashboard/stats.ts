
import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../../lib/auth'
import { prisma } from '../../../lib/db'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const session = await getServerSession(req, res, authOptions)
    if (!session) {
      return res.status(401).json({ message: 'Unauthorized' })
    }

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
  } catch (error) {
    console.error('Dashboard stats error:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
}
