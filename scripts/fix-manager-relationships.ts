import { PrismaClient } from '@prisma/client'
import fs from 'fs'

const prisma = new PrismaClient()

async function main() {
  console.log('🔗 Manager ilişkilerini düzeltiyorum...')
  
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
  
  // EmployeeMap oluştur
  const employeeMap = new Map<string, string>()
  const employees = await prisma.employee.findMany()
  
  for (const emp of employees) {
    employeeMap.set(emp.firstLastName, emp.currAccCode)
  }
  
  // Manager ilişkilerini kur
  let successCount = 0
  let failCount = 0
  
  for (const emp of csvData) {
    if (emp.manager && emp.manager.trim()) {
      const managerId = employeeMap.get(emp.manager)
      if (managerId) {
        try {
          await prisma.employee.update({
            where: { currAccCode: employeeMap.get(emp.firstLastName)! },
            data: { managerId: managerId }
          })
          successCount++
          console.log(`✅ ${emp.firstLastName} -> ${emp.manager}`)
        } catch (error) {
          failCount++
          console.log(`❌ ${emp.firstLastName} -> ${emp.manager} (Hata: ${error})`)
        }
      } else {
        failCount++
        console.log(`⚠️ Manager bulunamadı: ${emp.manager} (${emp.firstLastName})`)
      }
    }
  }
  
  console.log(`\n📊 ÖZET:`)
  console.log(`✅ Başarılı: ${successCount}`)
  console.log(`❌ Başarısız: ${failCount}`)
  
  await prisma.$disconnect()
}

main().catch(console.error)
