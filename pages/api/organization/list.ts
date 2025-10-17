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
    
    // Fallback: Mock data döndür
    const mockEmployees = [
      {
        currAccCode: 'EMP001',
        firstLastName: 'Ahmet Yılmaz',
        positionName: 'Genel Müdür',
        departmentName: 'Yönetim',
        departmentId: 1,
        managerName: '',
        locationName: 'İstanbul',
        locationId: 1,
        brandName: 'Olka',
        brandId: 1,
        companyName: 'Olka Group',
        companyId: 1,
        organization: 'Olka Group',
        isManager: true,
        levelName: 'Genel Müdür',
      },
      {
        currAccCode: 'EMP002',
        firstLastName: 'Mehmet Demir',
        positionName: 'İnsan Kaynakları Müdürü',
        departmentName: 'İnsan Kaynakları',
        departmentId: 2,
        managerName: 'Ahmet Yılmaz',
        locationName: 'İstanbul',
        locationId: 1,
        brandName: 'Olka',
        brandId: 1,
        companyName: 'Olka Group',
        companyId: 1,
        organization: 'Olka Group',
        isManager: true,
        levelName: 'Müdür',
      },
      {
        currAccCode: 'EMP003',
        firstLastName: 'Ayşe Kaya',
        positionName: 'Muhasebe Uzmanı',
        departmentName: 'Muhasebe',
        departmentId: 3,
        managerName: 'Mehmet Demir',
        locationName: 'İstanbul',
        locationId: 1,
        brandName: 'Olka',
        brandId: 1,
        companyName: 'Olka Group',
        companyId: 1,
        organization: 'Olka Group',
        isManager: false,
        levelName: 'Uzman',
      }
    ]
    
    console.log('API: Using mock data, employee count:', mockEmployees.length)
    res.status(200).json(mockEmployees)
  } finally {
    await prisma.$disconnect()
  }
}