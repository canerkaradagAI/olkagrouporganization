import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../../lib/db'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const { seatIds } = req.body

    if (!seatIds || !Array.isArray(seatIds) || seatIds.length === 0) {
      return res.status(400).json({ message: 'Silinecek koltuk ID\'leri gerekli' })
    }

    // Koltukları kontrol et (SEAT_ prefix'i ile başlayanlar)
    const seats = await prisma.employee.findMany({
      where: {
        currAccCode: {
          in: seatIds.filter((id: string) => id.startsWith('SEAT_'))
        }
      }
    })

    if (seats.length === 0) {
      return res.status(404).json({ message: 'Silinecek koltuk bulunamadı' })
    }

    // Koltukların altında çalışan var mı kontrol et
    for (const seat of seats) {
      const subordinates = await prisma.employee.findMany({
        where: {
          managerId: seat.currAccCode
        }
      })

      if (subordinates.length > 0) {
        // Alt çalışanların managerId'sini null yap
        await prisma.employee.updateMany({
          where: {
            managerId: seat.currAccCode
          },
          data: {
            managerId: null
          }
        })
      }
    }

    // Koltukları sil
    const deleteResult = await prisma.employee.deleteMany({
      where: {
        currAccCode: {
          in: seats.map(s => s.currAccCode)
        }
      }
    })

    console.log(`✅ ${deleteResult.count} koltuk silindi`)

    res.status(200).json({
      message: `${deleteResult.count} koltuk başarıyla silindi`,
      deletedCount: deleteResult.count
    })
  } catch (error: any) {
    console.error('Koltuk silme hatası:', error)
    res.status(500).json({
      message: 'Koltuk silinirken hata oluştu',
      error: error?.message || 'Bilinmeyen hata'
    })
  }
}

