import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../../lib/db'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    // Tüm filtreleri Employee tablosundan türet
    const emps = await prisma.employee.findMany({
      select: {
        organization: true,
        brandId: true,
        locationId: true,
        departmentId: true,
        brand: { 
          select: { 
            brandName: true, 
            companyId: true,
            company: { select: { companyName: true } }
          } 
        },
        department: { select: { departmentName: true } },
        location: { select: { locationName: true } },
      },
    })

    // Brand, Location, Department isimlerini ayrı ayrı çek
    const [allBrands, allLocations, allDepartments] = await Promise.all([
      prisma.brand.findMany({ select: { brandId: true, brandName: true } }),
      prisma.location.findMany({ select: { locationId: true, locationName: true } }),
      prisma.department.findMany({ select: { departmentId: true, departmentName: true } }),
    ])

    const brandMap = new Map(allBrands.map(b => [b.brandId, b.brandName]))
    const locationMap = new Map(allLocations.map(l => [l.locationId, l.locationName]))
    const departmentMap = new Map(allDepartments.map(d => [d.departmentId, d.departmentName]))

    const compSet = new Set<string>()
    const brandSet = new Set<number>()
    const locSet = new Set<number>()
    const depSet = new Set<number>()

    for (const e of emps) {
      if (e.organization) compSet.add(e.organization)
      
      // Brand ID'leri topla
      if (e.brandId) brandSet.add(e.brandId)

      // Location ID'leri topla
      if (e.locationId) locSet.add(e.locationId)

      // Department ID'leri topla
      if (e.departmentId) depSet.add(e.departmentId)
    }

    const companies = Array.from(compSet).sort().map((name, idx) => ({ id: idx + 1, name }))
    const brands = Array.from(brandSet).map(id => ({ id, name: brandMap.get(id) || 'Bilinmeyen' })).sort((a, b) => a.name.localeCompare(b.name))
    const locations = Array.from(locSet).map(id => ({ id, name: locationMap.get(id) || 'Bilinmeyen' })).sort((a, b) => a.name.localeCompare(b.name))
    const departments = Array.from(depSet).map(id => ({ id, name: departmentMap.get(id) || 'Bilinmeyen' })).sort((a, b) => a.name.localeCompare(b.name))

    res.status(200).json({ departments, locations, brands, companies })
  } catch (error) {
    console.error('API Error:', error)
    // DB hatasında boş filtreler döndür
    res.status(200).json({ departments: [], locations: [], brands: [], companies: [] })
  }
}