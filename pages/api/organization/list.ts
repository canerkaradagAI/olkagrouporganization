import type { NextApiRequest, NextApiResponse } from 'next'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    console.log('API çağrıldı')
    
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

    const formattedEmployees = employees.map(employee => ({
      currAccCode: employee.currAccCode,
      firstLastName: employee.firstLastName,
      positionName: employee.position?.positionName || 'Pozisyon Belirtilmemiş',
      departmentName: employee.department?.departmentName || 'Departman Belirtilmemiş',
      departmentId: employee.departmentId ?? null,
      managerName: employee.manager?.firstLastName || '',
      locationName: employee.location?.locationName || 'Lokasyon Belirtilmemiş',
      locationId: employee.locationId ?? null,
      brandName: employee.brand?.brandName || 'Marka Belirtilmemiş',
      brandId: employee.brandId ?? null,
      companyName: employee.brand?.company?.companyName || 'Şirket Belirtilmemiş',
      companyId: employee.brand?.companyId ?? null,
      organization: employee.organization || 'Olka Group',
      isManager: employee.isManager,
      levelName: employee.levelName || null,
    }))

    console.log('API: Formatlanmış çalışan sayısı:', formattedEmployees.length)

    res.status(200).json(formattedEmployees)
  } catch (error) {
    console.error('API Error:', error)
    res.status(500).json({ message: 'Internal server error', error: error.message })
  } finally {
    await prisma.$disconnect()
  }
}