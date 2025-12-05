import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../../lib/db'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const { personId, targetManagerId } = req.body

    if (!personId || !targetManagerId) {
      return res.status(400).json({ message: 'Kişi ID ve hedef müdür ID gereklidir' })
    }

    if (personId === targetManagerId) {
      return res.status(400).json({ message: 'Kişi kendisine bağlanamaz' })
    }

    // Kişiyi ve hedef müdürü bul
    const [person, targetManager] = await Promise.all([
      prisma.employee.findUnique({
        where: { currAccCode: personId }
      }),
      prisma.employee.findUnique({
        where: { currAccCode: targetManagerId }
      })
    ])

    if (!person || !targetManager) {
      return res.status(404).json({ message: 'Kişi veya müdür bulunamadı' })
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

    const hasCircular = await checkCircularDependency(targetManagerId, personId)
    if (hasCircular) {
      return res.status(400).json({ message: 'Döngüsel bağımlılık tespit edildi. İşlem gerçekleştirilemez.' })
    }

    // Transaction içinde atama işlemi
    const result = await prisma.$transaction(async (tx) => {
      // Kişiyi hedef müdüre bağla
      const updated = await tx.employee.update({
        where: { currAccCode: personId },
        data: { managerId: targetManagerId }
      })

      return updated
    })

    res.status(200).json({
      message: 'Kişi başarıyla yeni müdüre bağlandı',
      personName: person.firstLastName,
      targetManagerName: targetManager.firstLastName
    })
  } catch (error) {
    console.error('Assign person error:', error)
    res.status(500).json({
      message: 'Kişi atanırken hata oluştu',
      error: error instanceof Error ? error.message : String(error)
    })
  }
}

