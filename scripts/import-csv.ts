import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'

const prisma = new PrismaClient()

interface CSVRow {
  firstLastName: string
  locationName: string
  departmentName: string
  positionName: string
  manager: string
  levelName?: string
}

interface EmployeeData {
  currAccCode: string
  firstLastName: string
  locationName: string
  departmentName: string
  positionName: string
  manager: string
  isManager: boolean
  levelName?: string
}

async function importCSV() {
  console.log('📊 CSV import işlemi başlıyor...')
  
  try {
    // CSV dosyasını oku
    const csvPath = path.join(process.cwd(), 'Olka Organizasyon.csv')
    const csvContent = fs.readFileSync(csvPath, 'utf-8')
    
    // CSV'yi parse et
    const rows = csvContent.split('\n').slice(1) // Header'ı atla
    const csvData: CSVRow[] = []
    
    for (const row of rows) {
      if (row.trim()) {
        const [firstLastName, locationName, departmentName, positionName, levelName, manager] = row.split(';')
        csvData.push({
          firstLastName: firstLastName?.trim() || '',
          locationName: locationName?.trim() || '',
          departmentName: departmentName?.trim() || '',
          positionName: positionName?.trim() || '',
          manager: manager?.trim() || '',
          levelName: levelName?.trim() || ''
        })
      }
    }
    
    console.log(`📋 ${csvData.length} satır CSV verisi okundu`)
    
    // Manager isimlerini topla (isManager belirlemek için)
    const managerNames = new Set<string>()
    csvData.forEach(row => {
      if (row.manager) {
        managerNames.add(row.manager)
      }
    })
    
    console.log(`👥 ${managerNames.size} unique manager bulundu`)
    
    // Employee data'yı hazırla
    const employeeData: EmployeeData[] = csvData.map((row, index) => ({
      currAccCode: `1-8-${String(index + 1).padStart(4, '0')}`, // 1-8-0001, 1-8-0002, ...
      firstLastName: row.firstLastName,
      locationName: row.locationName,
      departmentName: row.departmentName,
      positionName: row.positionName,
      manager: row.manager,
      isManager: managerNames.has(row.firstLastName),
      levelName: row.levelName
    }))
    
    // Yasin Kavşak'ı özel olarak ekle (organizasyonun başı)
    const yasinKavsak: EmployeeData = {
      currAccCode: '1-8-0000',
      firstLastName: 'Yasin Kavşak',
      locationName: 'MERKEZ OFİS',
      departmentName: 'Yönetim',
      positionName: 'Yönetim Kurulu Başkanı',
      manager: '',
      isManager: true,
      levelName: 'Yönetim'
    }
    
    employeeData.unshift(yasinKavsak) // En başa ekle
    
    // Unique değerleri topla
    const uniqueDepartments = [...new Set(employeeData.map(emp => emp.departmentName))]
    const uniqueLocations = [...new Set(employeeData.map(emp => emp.locationName))]
    
    console.log(`🏢 ${uniqueDepartments.length} unique department bulundu`)
    console.log(`📍 ${uniqueLocations.length} unique location bulundu`)
    
    // 1. Departments oluştur
    console.log('📁 Departments oluşturuluyor...')
    const departmentMap = new Map<string, number>()
    
    for (let i = 0; i < uniqueDepartments.length; i++) {
      const dept = await prisma.department.upsert({
        where: { departmentName: uniqueDepartments[i] },
        update: {},
        create: {
          departmentName: uniqueDepartments[i]
        }
      })
      departmentMap.set(uniqueDepartments[i], dept.departmentId)
      console.log(`✅ ${dept.departmentName} (ID: ${dept.departmentId})`)
    }
    
    // 2. Locations oluştur
    console.log('📍 Locations oluşturuluyor...')
    const locationMap = new Map<string, number>()
    
    for (let i = 0; i < uniqueLocations.length; i++) {
      const loc = await prisma.location.upsert({
        where: { locationName: uniqueLocations[i] },
        update: {},
        create: {
          locationName: uniqueLocations[i]
        }
      })
      locationMap.set(uniqueLocations[i], loc.locationId)
      console.log(`✅ ${loc.locationName} (ID: ${loc.locationId})`)
    }
    
    // 3. Brand'ı al (mevcut)
    const brand = await prisma.brand.findFirst()
    if (!brand) {
      throw new Error('Brand bulunamadı!')
    }
    console.log(`🏷️ Brand kullanılıyor: ${brand.brandName} (ID: ${brand.brandId})`)
    
    // 4. Employees oluştur
    console.log('👥 Employees oluşturuluyor...')
    const employeeMap = new Map<string, string>() // name -> currAccCode
    
    for (const emp of employeeData) {
      const employee = await prisma.employee.create({
        data: {
          currAccCode: emp.currAccCode,
          firstLastName: emp.firstLastName,
          organization: emp.locationName,
          locationId: locationMap.get(emp.locationName),
          brandId: brand.brandId,
          isManager: emp.isManager,
          managerId: null, // Önce null, sonra güncelleyeceğiz
          levelName: (emp.levelName && emp.levelName.length > 0) ? emp.levelName : null,
        }
      })
      
      employeeMap.set(emp.firstLastName, emp.currAccCode)
      console.log(`✅ ${emp.firstLastName} (${emp.currAccCode}) - Manager: ${emp.isManager}`)
    }
    
    // 5. Manager ilişkilerini güncelle
    console.log('🔗 Manager ilişkileri kuruluyor...')
    
    for (const emp of employeeData) {
      if (emp.manager && emp.manager.trim()) {
        // Manager ismini employeeMap'te ara
        const managerEntry = Array.from(employeeMap.entries()).find(([id, name]) => name === emp.manager)
        if (managerEntry) {
          const managerId = managerEntry[0]
          
          await prisma.employee.update({
            where: { currAccCode: emp.currAccCode },
            data: { managerId: managerId }
          })
          
          console.log(`🔗 ${emp.firstLastName} -> ${emp.manager} (${managerId})`)
        } else {
          console.log(`⚠️ Manager bulunamadı: ${emp.manager} (${emp.firstLastName})`)
        }
      }
    }
    
    // 6. Positions oluştur
    console.log('💼 Positions oluşturuluyor...')
    
    for (const emp of employeeData) {
      const position = await prisma.position.create({
        data: {
          positionName: emp.positionName,
          locationId: locationMap.get(emp.locationName)!,
          brandId: brand.brandId,
          departmentId: departmentMap.get(emp.departmentName)!
        }
      })
      
      // Employee'ın positionId'sini güncelle
      await prisma.employee.update({
        where: { currAccCode: emp.currAccCode },
        data: { positionId: position.positionId }
      })
      
      console.log(`✅ ${emp.positionName} (ID: ${position.positionId})`)
    }
    
    console.log('🎉 CSV import işlemi tamamlandı!')
    
    // Özet
    const totalEmployees = await prisma.employee.count()
    const totalDepartments = await prisma.department.count()
    const totalLocations = await prisma.location.count()
    const totalPositions = await prisma.position.count()
    
    console.log('\n📊 ÖZET:')
    console.log(`👥 Employees: ${totalEmployees}`)
    console.log(`📁 Departments: ${totalDepartments}`)
    console.log(`📍 Locations: ${totalLocations}`)
    console.log(`💼 Positions: ${totalPositions}`)
    
  } catch (error) {
    console.error('❌ Hata:', error)
  } finally {
    await prisma.$disconnect()
  }
}

importCSV()
