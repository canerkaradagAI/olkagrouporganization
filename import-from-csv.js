const fs = require('fs');
const csv = require('csv-parser');
const { PrismaClient } = require('@prisma/client');

// Environment variable'ı doğrudan set et
process.env.DATABASE_URL = "postgresql://postgres:postgres@localhost:5432/olkagroup?schema=public";

async function importEmployeesFromCSV() {
  const prisma = new PrismaClient();
  
  try {
    console.log('📊 CSV dosyasından çalışan verileri okunuyor...');
    
    // PostgreSQL'deki mevcut verileri temizle
    await prisma.employee.deleteMany();
    console.log('✅ PostgreSQL çalışan tablosu temizlendi');
    
    const employees = [];
    
    // CSV dosyasını oku
    await new Promise((resolve, reject) => {
      fs.createReadStream('./data/Employee.csv')
        .pipe(csv({ separator: ';' }))
        .on('data', (row) => {
          // CSV'deki verileri Prisma formatına çevir
          const employee = {
            currAccCode: row.CurrAccCode,
            firstLastName: row.NameSurname,
            organization: null, // CSV'de yok
            positionId: row.PositionId ? parseInt(row.PositionId.replace('P', '')) : null,
            locationId: row.LocationId ? parseInt(row.LocationId) : null,
            departmentId: null, // CSV'de yok, sonra ekleyeceğiz
            isBlocked: row.IsBlocked === 'True',
            isManager: row.IsManager === 'True',
            managerId: row.ManagerId === 'Null' ? null : row.ManagerId,
            brandId: row.BrandId ? parseInt(row.BrandId) : null,
            levelName: row.LevelName
          };
          employees.push(employee);
        })
        .on('end', resolve)
        .on('error', reject);
    });
    
    console.log(`📥 ${employees.length} çalışan CSV'den okundu`);
    
    // Verileri PostgreSQL'e aktar
    console.log('📤 Veriler PostgreSQL\'e aktarılıyor...');
    
    for (let i = 0; i < employees.length; i++) {
      const employee = employees[i];
      try {
        await prisma.employee.create({ data: employee });
        
        if ((i + 1) % 100 === 0) {
          console.log(`📊 ${i + 1}/${employees.length} çalışan aktarıldı`);
        }
      } catch (error) {
        console.log(`⚠️ Çalışan ${employee.currAccCode} aktarılamadı: ${error.message}`);
      }
    }
    
    console.log(`🎉 CSV'den ${employees.length} çalışan PostgreSQL'e aktarıldı!`);
    
    // Doğrulama
    const count = await prisma.employee.count();
    console.log(`✅ PostgreSQL'deki çalışan sayısı: ${count}`);
    
  } catch (error) {
    console.error('❌ Hata:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

importEmployeesFromCSV();
