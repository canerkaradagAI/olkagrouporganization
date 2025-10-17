import { PrismaClient } from '@prisma/client'
import * as XLSX from 'xlsx'
import * as fs from 'fs'
import * as path from 'path'

const prisma = new PrismaClient()

async function readExcelAndUpdateManagers() {
  try {
    console.log('📖 Kitap1.xlsx dosyası okunuyor...')
    
    // Excel dosyasını oku
    const workbook = XLSX.readFile('Kitap1.xlsx')
    const sheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[sheetName]
    
    // JSON'a çevir
    const data = XLSX.utils.sheet_to_json(worksheet)
    
    console.log(`📊 ${data.length} satır veri bulundu`)
    console.log('📋 İlk 5 satır:')
    console.log(data.slice(0, 5))
    
    // CSV olarak kaydet
    const csvPath = 'data/kitap1-employees.csv'
    const csvData = XLSX.utils.sheet_to_csv(worksheet)
    fs.writeFileSync(csvPath, csvData)
    console.log(`💾 CSV dosyası kaydedildi: ${csvPath}`)
    
    // Şimdi managerId'leri güncelle
    console.log('\n🔄 ManagerIdler güncelleniyor...')
    
    let updated = 0
    let notFound = 0
    
    for (const row of data) {
      const currAccCode = (row as any)['CurrAccCode']
      let managerId = (row as any)['ManagerId'] || (row as any)['managerId'] || (row as any)['Manager ID']
      
      if (!currAccCode) continue
      
      // NULL stringini null'a çevir
      if (managerId === 'NULL' || managerId === 'null') {
        managerId = null
      }
      
      // Veritabanında bu çalışanı bul
      const employee = await prisma.employee.findUnique({
        where: { currAccCode: currAccCode.toString() }
      })
      
      if (employee && managerId) {
        // Manager'ın veritabanında olup olmadığını kontrol et
        const managerExists = await prisma.employee.findUnique({
          where: { currAccCode: managerId.toString() }
        })
        
        if (managerExists) {
          // ManagerId'yi güncelle
          await prisma.employee.update({
            where: { currAccCode: currAccCode.toString() },
            data: { managerId: managerId.toString() }
          })
          
          console.log(`✅ ${employee.firstLastName} -> ManagerId: ${managerId}`)
          updated++
        } else {
          console.log(`⚠️ ${employee.firstLastName} -> Manager bulunamadi: ${managerId}`)
          notFound++
        }
      } else if (employee && !managerId) {
        // NULL managerId - güncelleme yapma
        console.log(`ℹ️ ${employee.firstLastName} -> ManagerId NULL`)
      } else {
        console.log(`❌ CurrAccCode bulunamadi: ${currAccCode}`)
      }
    }
    
    console.log(`\n📊 Özet:`)
    console.log(`✅ Güncellenen: ${updated}`)
    console.log(`⚠️ ManagerId bulunamayan: ${notFound}`)
    
  } catch (error) {
    console.error('❌ Hata:', error)
  } finally {
    await prisma.$disconnect()
  }
}

readExcelAndUpdateManagers()
