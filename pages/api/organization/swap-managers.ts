import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../../lib/db'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const { manager1Id, manager2Id } = req.body

    if (!manager1Id || !manager2Id) {
      return res.status(400).json({ message: 'İki müdür ID\'si gereklidir' })
    }

    if (manager1Id === manager2Id) {
      return res.status(400).json({ message: 'Aynı kişi yer değiştiremez' })
    }

    // İki müdürü bul ve kontrol et
    const [manager1, manager2] = await Promise.all([
      prisma.employee.findUnique({
        where: { currAccCode: manager1Id },
        include: { subordinates: true }
      }),
      prisma.employee.findUnique({
        where: { currAccCode: manager2Id },
        include: { subordinates: true }
      })
    ])

    if (!manager1 || !manager2) {
      return res.status(404).json({ message: 'Müdür bulunamadı' })
    }

    if (!manager1.isManager || !manager2.isManager) {
      return res.status(400).json({ message: 'Her iki kişi de müdür olmalıdır' })
    }

    // Döngüsel bağımlılık kontrolü
    const checkCircularDependency = async (managerId: string, targetId: string): Promise<boolean> => {
      let current = managerId
      const visited = new Set<string>()
      
      while (current) {
        if (visited.has(current)) return true // Döngü var
        if (current === targetId) return true // Hedef, kaynağın altında
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

    const hasCircular1 = await checkCircularDependency(manager1Id, manager2Id)
    const hasCircular2 = await checkCircularDependency(manager2Id, manager1Id)

    if (hasCircular1 || hasCircular2) {
      return res.status(400).json({ message: 'Döngüsel bağımlılık tespit edildi. İşlem gerçekleştirilemez.' })
    }

    // Transaction içinde yer değiştirme işlemi
    const result = await prisma.$transaction(async (tx) => {
      // Manager 1'in tüm alt ekiplerini bul (ID'lerini kaydet)
      const manager1Team = await tx.employee.findMany({
        where: { managerId: manager1Id },
        select: { currAccCode: true }
      })
      const manager1TeamIds = manager1Team.map(e => e.currAccCode)

      // Manager 2'nin tüm alt ekiplerini bul (ID'lerini kaydet)
      const manager2Team = await tx.employee.findMany({
        where: { managerId: manager2Id },
        select: { currAccCode: true }
      })
      const manager2TeamIds = manager2Team.map(e => e.currAccCode)

      // ÖNCE: İki müdürün locationId'lerini değiştir
      const manager1LocationId = manager1.locationId
      const manager2LocationId = manager2.locationId
      
      await tx.employee.update({
        where: { currAccCode: manager1Id },
        data: { locationId: manager2LocationId }
      })
      
      await tx.employee.update({
        where: { currAccCode: manager2Id },
        data: { locationId: manager1LocationId }
      })

      // SONRA: Manager 1'in ekibini Manager 2'ye bağla (locationId değişmeden)
      const update1 = manager1TeamIds.length > 0 ? await tx.employee.updateMany({
        where: { currAccCode: { in: manager1TeamIds } },
        data: { managerId: manager2Id }
        // locationId değişmiyor, sadece managerId değişiyor
      }) : { count: 0 }

      // Manager 2'nin ekibini Manager 1'e bağla (locationId değişmeden)
      const update2 = manager2TeamIds.length > 0 ? await tx.employee.updateMany({
        where: { currAccCode: { in: manager2TeamIds } },
        data: { managerId: manager1Id }
        // locationId değişmiyor, sadece managerId değişiyor
      }) : { count: 0 }

      // Eğer birbirlerinin üstü iseler, managerId'lerini de değiştir
      if (manager1.managerId === manager2Id) {
        await tx.employee.update({
          where: { currAccCode: manager1Id },
          data: { managerId: manager2.managerId }
        })
      }

      if (manager2.managerId === manager1Id) {
        await tx.employee.update({
          where: { currAccCode: manager2Id },
          data: { managerId: manager1.managerId }
        })
      }

      return {
        manager1TeamCount: manager1TeamIds.length,
        manager2TeamCount: manager2TeamIds.length,
        updated1: update1.count,
        updated2: update2.count
      }
    })

    res.status(200).json({
      message: 'Müdürler başarıyla yer değiştirildi',
      manager1Name: manager1.firstLastName,
      manager2Name: manager2.firstLastName,
      manager1TeamCount: result.manager1TeamCount,
      manager2TeamCount: result.manager2TeamCount,
      totalUpdated: result.updated1 + result.updated2
    })
  } catch (error) {
    console.error('Swap managers error:', error)
    res.status(500).json({
      message: 'Müdürler yer değiştirilirken hata oluştu',
      error: error instanceof Error ? error.message : String(error)
    })
  }
}

