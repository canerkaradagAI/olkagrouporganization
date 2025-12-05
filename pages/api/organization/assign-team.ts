import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../../lib/db'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const { oldManagerId, newManagerId } = req.body

    if (!oldManagerId || !newManagerId) {
      return res.status(400).json({ message: 'Eski ve yeni müdür ID\'si gereklidir' })
    }

    if (oldManagerId === newManagerId) {
      return res.status(400).json({ message: 'Eski ve yeni müdür aynı olamaz' })
    }

    // Müdürleri bul ve kontrol et
    const [oldManager, newManager] = await Promise.all([
      prisma.employee.findUnique({
        where: { currAccCode: oldManagerId },
        include: { subordinates: true }
      }),
      prisma.employee.findUnique({
        where: { currAccCode: newManagerId }
      })
    ])

    if (!oldManager || !newManager) {
      return res.status(404).json({ message: 'Müdür bulunamadı' })
    }

    if (!oldManager.isManager) {
      return res.status(400).json({ message: 'Eski müdür müdür olmalıdır' })
    }

    // Döngüsel bağımlılık kontrolü
    const checkCircularDependency = async (managerId: string, targetId: string): Promise<boolean> => {
      let current = managerId
      const visited = new Set<string>()
      
      while (current) {
        if (visited.has(current)) return true
        if (current === targetId) return true
        visited.add(current)
        
        const emp = await prisma.employee.findUnique({
          where: { currAccCode: current },
          select: { managerId: true }
        })
        
        if (!emp || !emp.managerId) break
        current = emp.managerId
      }
      return false
    }

    const hasCircular = await checkCircularDependency(newManagerId, oldManagerId)
    if (hasCircular) {
      return res.status(400).json({ message: 'Döngüsel bağımlılık tespit edildi. İşlem gerçekleştirilemez.' })
    }

    // Transaction içinde atama işlemi
    const result = await prisma.$transaction(async (tx) => {
      // Eski müdürün tüm alt ekiplerini bul
      const oldManagerTeam = await tx.employee.findMany({
        where: { managerId: oldManagerId }
      })

      // Tüm ekibi yeni müdüre bağla
      const updateResult = await tx.employee.updateMany({
        where: { managerId: oldManagerId },
        data: { managerId: newManagerId }
      })

      // Eski müdürün managerId'sini değiştirme (üst yöneticiye bağlı kalır)

      return {
        teamCount: oldManagerTeam.length,
        updated: updateResult.count
      }
    })

    res.status(200).json({
      message: 'Ekip başarıyla yeni müdüre atandı',
      oldManagerName: oldManager.firstLastName,
      newManagerName: newManager.firstLastName,
      teamCount: result.teamCount,
      updatedCount: result.updated
    })
  } catch (error) {
    console.error('Assign team error:', error)
    res.status(500).json({
      message: 'Ekip atanırken hata oluştu',
      error: error instanceof Error ? error.message : String(error)
    })
  }
}

