import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../../lib/db'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    // Yönetim Kurulu, Genel Müdür ve C Level çalışanları getir
    const topLevelEmployees = await prisma.employee.findMany({
      where: {
        levelName: {
          in: ['Yönetim Kurulu', 'Genel Müdür', 'C Level']
        }
      },
      include: {
        position: true,
        department: true,
        brand: true,
        location: true,
        manager: true,
        subordinates: {
          include: {
            position: true,
            department: true,
            brand: true,
            location: true
          }
        }
      },
      orderBy: [
        { levelName: 'asc' },
        { firstLastName: 'asc' }
      ]
    })

    // Yasin Kavşak'ı bul ve direkt departmanlarını getir
    const yasinKavsak = await prisma.employee.findFirst({
      where: { firstLastName: { contains: 'Yasin' } },
      include: {
        subordinates: {
          include: { department: true }
        }
      }
    })

    const yasinDirectDepartments = yasinKavsak ? [{
      employee: yasinKavsak,
      departments: yasinKavsak.subordinates
        .filter(sub => sub.department?.departmentName === 'İç Denetim')
        .map(sub => sub.department!)
        .filter((dept, index, arr) => arr.findIndex(d => d.departmentId === dept.departmentId) === index) // Unique departments
    }] : []

    // C Level çalışanları ve onların departmanlarını getir
    const cLevelEmployees = topLevelEmployees.filter(emp => emp.levelName === 'C Level' || emp.levelName === 'Genel Müdür')
    
    const cLevelWithDepartments = await Promise.all(
      cLevelEmployees.map(async (employee) => {
        // Bu C Level'a bağlı departmanları bul - gerçek bağlantıları kullan
        const subordinateDepartments = new Set<number>()
        
        // Alt çalışanlarının departmanlarını topla
        employee.subordinates.forEach(sub => {
          if (sub.departmentId) {
            subordinateDepartments.add(sub.departmentId)
          }
        })
        
        // Kendi departmanını da ekle
        if (employee.departmentId) {
          subordinateDepartments.add(employee.departmentId)
        }
        
        // Departman bilgilerini getir
        const departments = await prisma.department.findMany({
          where: {
            departmentId: {
              in: Array.from(subordinateDepartments)
            }
          },
          orderBy: { departmentName: 'asc' }
        })
        
        return {
          employee,
          departments
        }
      })
    )

    // Seviyelere göre grupla
    const managementLevels = [
      'Yönetim Kurulu',
      'Genel Müdür', 
      'C Level'
    ].map(levelName => {
      const employees = topLevelEmployees.filter(emp => emp.levelName === levelName)
      const departments: any[] = [] // Bu seviyeler için departman yok
      
      return {
        levelName,
        employees,
        departments
      }
    })

    // Şirket ve marka listelerini getir
    const companies = await prisma.employee.findMany({
      where: { organization: { not: null } },
      select: { organization: true },
      distinct: ['organization']
    }).then(emps => emps.map(emp => emp.organization).filter(Boolean))

    const brands = await prisma.brand.findMany({
      select: { brandName: true },
      orderBy: { brandName: 'asc' }
    }).then(brands => brands.map(brand => brand.brandName))

    // Tüm departmanları getir
    const allDepartments = await prisma.department.findMany({
      orderBy: { departmentName: 'asc' }
    })

    return res.status(200).json({
      managementLevels,
      cLevelWithDepartments,
      yasinDirectDepartments,
      allDepartments,
      companies,
      brands
    })
  } catch (error) {
    console.error('Management page data fetch error:', error)
    return res.status(500).json({
      message: 'Internal server error',
      error: error instanceof Error ? error.message : String(error)
    })
  }
}
