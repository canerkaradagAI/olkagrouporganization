import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../../lib/db'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    console.log('API çağrıldı')
    console.log('Prisma Client durumu:', prisma ? 'OK' : 'NULL')
    
    // Tüm employees'ları çek (hideFromChart dahil)
    console.log('Veritabanı sorgusu başlatılıyor...')
    const employees = await prisma.employee.findMany({
      include: {
        manager: {
          select: {
            firstLastName: true,
          },
        },
        position: true,
        department: true,
        location: true,
        brand: {
          include: {
            company: true
          }
        },
      },
      orderBy: {
        firstLastName: 'asc',
      },
    })

    console.log('API: Toplam çalışan sayısı:', employees.length)
    if (employees.length > 0) {
      console.log('API: İlk 3 çalışan:', employees.slice(0, 3).map(e => ({
        currAccCode: e.currAccCode,
        firstLastName: e.firstLastName,
        hideFromChart: e.hideFromChart
      })))
    }

    const formattedEmployees = employees.map(employee => ({
      currAccCode: employee.currAccCode,
      firstLastName: employee.firstLastName,
      positionName: employee.position?.positionName || 'Pozisyon Belirtilmemiş',
      departmentName: employee.department?.departmentName || 'Departman Belirtilmemiş',
      departmentId: employee.departmentId ?? null,
      managerName: employee.manager?.firstLastName || '',
      managerId: employee.managerId || null,
      locationName: employee.location?.locationName || 'Lokasyon Belirtilmemiş',
      locationId: employee.locationId ?? null,
      brandName: employee.brand?.brandName || 'Marka Belirtilmemiş',
      brandId: employee.brandId ?? null,
      companyName: employee.brand?.company?.companyName || 'Şirket Belirtilmemiş',
      companyId: employee.brand?.companyId ?? null,
      organization: employee.organization || 'Olka Group',
      isManager: employee.isManager,
      hideFromChart: employee.hideFromChart ?? false,
      levelName: employee.levelName || null,
    }))

    console.log('API: Formatlanmış çalışan sayısı:', formattedEmployees.length)

    res.status(200).json(formattedEmployees)
  } catch (error: any) {
    console.error('API Error:', error)
    console.error('Error details:', error?.message, error?.stack)
    
    // Hata durumunda detaylı bilgi ver
    res.status(500).json({ 
      message: 'Veritabanı hatası',
      error: error?.message || 'Bilinmeyen hata',
      details: process.env.NODE_ENV === 'development' ? error?.stack : undefined
    })
  }
}