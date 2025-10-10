import type { NextApiRequest, NextApiResponse } from 'next'
import { PrismaClient } from '@prisma/client'
import * as XLSX from 'xlsx'

const prisma = new PrismaClient()

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const formData = await new Promise<any>((resolve, reject) => {
      const chunks: any[] = []
      req.on('data', (chunk) => chunks.push(chunk))
      req.on('end', () => resolve(Buffer.concat(chunks)))
      req.on('error', reject)
    })

    // Parse multipart form data
    const boundary = req.headers['content-type']?.split('boundary=')[1]
    if (!boundary) {
      return res.status(400).json({ message: 'No boundary found' })
    }

    const parts = formData.toString().split(`--${boundary}`)
    let fileBuffer: Buffer | null = null
    let selectedTable = 'employee' // Default

    for (const part of parts) {
      if (part.includes('Content-Disposition: form-data')) {
        if (part.includes('filename=')) {
          // File part
          const fileStart = part.indexOf('\r\n\r\n') + 4
          const fileEnd = part.lastIndexOf('\r\n')
          if (fileStart > 3 && fileEnd > fileStart) {
            fileBuffer = Buffer.from(part.slice(fileStart, fileEnd))
          }
        } else if (part.includes('name="table"')) {
          // Table selection part
          const tableStart = part.indexOf('\r\n\r\n') + 4
          const tableEnd = part.lastIndexOf('\r\n')
          if (tableStart > 3 && tableEnd > tableStart) {
            selectedTable = part.slice(tableStart, tableEnd).toString().trim()
          }
        }
      }
    }

    console.log('📊 Form parsing başlıyor...')
    console.log('Selected table:', selectedTable)
    console.log('File buffer size:', fileBuffer?.length || 0)

    // Parse Excel file
    const workbook = XLSX.read(fileBuffer, { type: 'buffer' })
    const sheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[sheetName]
    const data = XLSX.utils.sheet_to_json(worksheet)

    console.log(`📊 Excel dosyası okundu: ${data.length} satır`)

    // Clear existing data
    console.log('🧹 Mevcut veriler temizleniyor...')
    await prisma.positionAssignment.deleteMany({})
    await prisma.employee.deleteMany({})
    await prisma.position.deleteMany({})
    await prisma.jobTitleLevel.deleteMany({})
    await prisma.location.deleteMany({})
    await prisma.department.deleteMany({})
    await prisma.brand.deleteMany({})
    await prisma.company.deleteMany({})

    // Reset auto-increment counters
    await prisma.$executeRaw`DELETE FROM sqlite_sequence WHERE name IN ('companies', 'departments', 'brands', 'locations', 'job_title_levels', 'positions', 'employees', 'position_assignments');`

    console.log('✅ Veriler temizlendi')

    // Import data
    let importedCount = 0
    const errors: string[] = []
    
    if (selectedTable === 'company') {
      console.log('🏢 Company import başlıyor...')
      console.log('Data rows:', data.length)
      // Import Companies
      for (const row of data) {
        const companyName = (row.CompanyName || row.companyName || '').toString().trim()
        console.log('Processing company:', companyName)
        if (companyName) {
          await prisma.company.create({ data: { companyName } })
          importedCount++
        }
      }
      console.log(`✅ Company import tamamlandı: ${importedCount} kayıt`)
    } else if (selectedTable === 'employee') {
      // Unique değerleri topla
    const uniqueBrands = new Map<string, number>()
    const uniqueLocations = new Map<string, number>()
    const uniqueDepartments = new Map<string, number>()
    const uniquePositions = new Map<string, number>()
    const uniqueLevels = new Map<string, number>()
    
    let brandCounter = 1
    let locationCounter = 1
    let departmentCounter = 1
    let positionCounter = 1
    let levelCounter = 1

    // İlk geçiş: Unique değerleri topla
    console.log('📊 Unique değerler toplanıyor...')
    for (const row of data) {
      const brandName = (row.BrandName || row.brandName || '').toString().trim()
      const locationName = (row.LocationName || row.locationName || '').toString().trim()
      const departmentName = (row.DepartmentName || row.departmentName || '').toString().trim()
      const positionName = (row.PositionName || row.positionName || '').toString().trim()
      const levelName = (row.LevelName || row.levelName || '').toString().trim()

      if (brandName && !uniqueBrands.has(brandName)) {
        uniqueBrands.set(brandName, brandCounter++)
      }
      if (locationName && !uniqueLocations.has(locationName)) {
        uniqueLocations.set(locationName, locationCounter++)
      }
      if (departmentName && !uniqueDepartments.has(departmentName)) {
        uniqueDepartments.set(departmentName, departmentCounter++)
      }
      if (positionName && !uniquePositions.has(positionName)) {
        uniquePositions.set(positionName, positionCounter++)
      }
      if (levelName && !uniqueLevels.has(levelName)) {
        uniqueLevels.set(levelName, levelCounter++)
      }
    }

    // Company oluştur
    const company = await prisma.company.create({
      data: { companyName: 'Olka Group' }
    })

    // Brand'leri oluştur
    console.log('🏢 Brand\'ler oluşturuluyor...')
    const brandIdMap = new Map<string, number>()
    for (const [brandName, id] of uniqueBrands) {
      const brand = await prisma.brand.create({
        data: {
          brandName: brandName,
          companyId: company.companyId
        }
      })
      brandIdMap.set(brandName, brand.brandId)
    }

    // Location'ları oluştur
    console.log('📍 Location\'lar oluşturuluyor...')
    const locationIdMap = new Map<string, number>()
    for (const [locationName, id] of uniqueLocations) {
      const location = await prisma.location.create({
        data: { locationName: locationName }
      })
      locationIdMap.set(locationName, location.locationId)
    }

    // Department'leri oluştur
    console.log('🏢 Department\'ler oluşturuluyor...')
    const departmentIdMap = new Map<string, number>()
    for (const [departmentName, id] of uniqueDepartments) {
      const department = await prisma.department.create({
        data: { departmentName: departmentName }
      })
      departmentIdMap.set(departmentName, department.departmentId)
    }

    // JobTitleLevel'leri oluştur
    console.log('📊 JobTitleLevel\'ler oluşturuluyor...')
    const levelIdMap = new Map<string, number>()
    for (const [levelName, id] of uniqueLevels) {
      const level = await prisma.jobTitleLevel.create({
        data: {
          levelName: levelName,
          levelOrder: id,
          description: `${levelName} seviyesi`
        }
      })
      levelIdMap.set(levelName, level.levelId)
    }

    // Position'ları oluştur
    console.log('💼 Position\'lar oluşturuluyor...')
    const positionIdMap = new Map<string, number>()
    for (const [positionName, id] of uniquePositions) {
      const position = await prisma.position.create({
        data: {
          positionName: positionName,
        }
      })
      positionIdMap.set(positionName, position.positionId)
    }

    // Employee'leri oluştur
    console.log('👥 Employee\'ler oluşturuluyor...')
    for (const row of data) {
      try {
        const currAccCode = (row.CurrAccCode || row.currAccCode || '').toString().trim()
        const nameSurname = (row.NameSurname || row.nameSurname || '').toString().trim()
        const brandName = (row.BrandName || row.brandName || '').toString().trim()
        const locationName = (row.LocationName || row.locationName || '').toString().trim()
        const departmentName = (row.DepartmentName || row.departmentName || '').toString().trim()
        const positionName = (row.PositionName || row.positionName || '').toString().trim()
        const managerId = (row.ManagerId || row.managerId || '').toString().trim() || null
        const levelName = (row.LevelName || row.levelName || '').toString().trim() || null
        const isManager = String(row.IsManager || row.isManager || '').toLowerCase() === 'true'

        if (!currAccCode || !nameSurname) {
          errors.push(`Satır ${importedCount + 1}: CurrAccCode veya NameSurname boş`)
          continue
        }

        // ID'leri bul
        const brandId = brandName ? brandIdMap.get(brandName) : null
        const locationId = locationName ? locationIdMap.get(locationName) : null
        const departmentId = departmentName ? departmentIdMap.get(departmentName) : null
        const positionId = positionName ? positionIdMap.get(positionName) : null
        const levelId = levelName ? levelIdMap.get(levelName) : null

        // Position artık sadece positionName içeriyor, güncelleme gerekmiyor

        // Employee oluştur
        await prisma.employee.create({
          data: {
            currAccCode,
            firstLastName: nameSurname,
            organization: 'Olka Group',
            brandId: brandId,
            locationId: locationId,
            departmentId: departmentId,
            positionId: positionId,
            managerId: managerId,
            isManager: isManager,
            levelName: levelName,
          }
        })

        importedCount++
      } catch (error: any) {
        errors.push(`Satır ${importedCount + 1}: ${error.message}`)
      }
    }

    } else if (selectedTable === 'brand') {
      // Import Brands
      const company = await prisma.company.upsert({
        where: { companyName: 'Olka Group' },
        update: {},
        create: { companyName: 'Olka Group' },
      })
      for (const row of data) {
        const brandName = (row.BrandName || row.brandName || '').toString().trim()
        if (brandName) {
          await prisma.brand.create({ data: { brandName, companyId: company.companyId } })
          importedCount++
        }
      }
    } else if (selectedTable === 'location') {
      // Import Locations
      for (const row of data) {
        const locationName = (row.LocationName || row.locationName || '').toString().trim()
        if (locationName) {
          await prisma.location.create({ data: { locationName } })
          importedCount++
        }
      }
    } else if (selectedTable === 'department') {
      // Import Departments
      for (const row of data) {
        const departmentName = (row.DepartmentName || row.departmentName || '').toString().trim()
        if (departmentName) {
          await prisma.department.create({ data: { departmentName } })
          importedCount++
        }
      }
    } else if (selectedTable === 'position') {
      // Import Positions
      for (const row of data) {
        const positionName = (row.PositionName || row.positionName || '').toString().trim()
        if (positionName) {
          await prisma.position.create({
            data: { positionName }
          })
          importedCount++
        }
      }
    } else if (selectedTable === 'jobtitlelevel') {
      // Import JobTitleLevels
      for (const row of data) {
        const levelName = (row.LevelName || row.levelName || '').toString().trim()
        const levelOrder = parseInt(row.LevelOrder || row.levelOrder || '0')
        const description = (row.Description || row.description || '').toString().trim()
        if (levelName) {
          await prisma.jobTitleLevel.create({
            data: {
              levelName,
              levelOrder: levelOrder > 0 ? levelOrder : undefined,
              description: description || `${levelName} seviyesi`
            }
          })
          importedCount++
        }
      }
    }

    console.log(`✅ Import tamamlandı: ${importedCount} kayıt`)

    res.status(200).json({
      message: `${importedCount} kayıt başarıyla içe aktarıldı`,
      importedCount,
      errors: errors.slice(0, 10) // İlk 10 hatayı göster
    })

  } catch (error: any) {
    console.error('Excel import hatası:', error)
    res.status(500).json({ message: 'Import hatası: ' + error.message })
  } finally {
    await prisma.$disconnect()
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
}
