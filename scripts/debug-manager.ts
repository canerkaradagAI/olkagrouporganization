import { PrismaClient } from '@prisma/client'
import fs from 'fs'

const prisma = new PrismaClient()

async function main() {
  console.log('🔍 Manager debug işlemi başlıyor...')
  
  // CSV'yi oku
  const csvContent = fs.readFileSync('Olka Organizasyon.csv', 'utf-8')
  const rows = csvContent.split('\n').slice(1) // Header'ı atla
  
  const csvData: any[] = []
  for (const row of rows) {
    if (row.trim()) {
      const [firstLastName, locationName, departmentName, positionName, levelName, manager] = row.split(';')
      csvData.push({
        firstLastName: firstLastName?.trim() || '',
        manager: manager?.trim() || '',
      })
    }
  }
  
  console.log('📋 CSV verileri:', csvData.slice(0, 5))
  
  // EmployeeMap oluştur
  const employeeMap = new Map<string, string>()
  const employees = await prisma.employee.findMany()
  
  for (const emp of employees) {
    employeeMap.set(emp.firstLastName, emp.currAccCode)
  }
  
  console.log('👥 EmployeeMap örnekleri:', Array.from(employeeMap.entries()).slice(0, 5))
  
  // Manager isimlerini kontrol et
  const managerNames = new Set<string>()
  for (const emp of csvData) {
    if (emp.manager && emp.manager.trim()) {
      managerNames.add(emp.manager)
    }
  }
  
  console.log('👨‍💼 Manager isimleri:', Array.from(managerNames).slice(0, 10))
  
  // Manager isimlerinin employeeMap'te olup olmadığını kontrol et
  let foundCount = 0
  let notFoundCount = 0
  
  for (const managerName of managerNames) {
    const found = employeeMap.has(managerName)
    if (found) {
      foundCount++
    } else {
      notFoundCount++
      if (notFoundCount <= 5) {
        console.log(`❌ Manager bulunamadı: ${managerName}`)
      }
    }
  }
  
  console.log(`✅ Bulunan manager: ${foundCount}`)
  console.log(`❌ Bulunamayan manager: ${notFoundCount}`)
  
  await prisma.$disconnect()
}

main().catch(console.error)
