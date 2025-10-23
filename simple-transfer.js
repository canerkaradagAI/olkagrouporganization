const sqlite3 = require('sqlite3').verbose();
const { PrismaClient } = require('@prisma/client');

async function exportFromSQLite() {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database('./prisma/dev.db');
    
    db.all("SELECT * FROM employees", (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
      db.close();
    });
  });
}

async function importToPostgreSQL() {
  const prisma = new PrismaClient();
  
  try {
    console.log('📊 SQLite\'dan çalışan verileri okunuyor...');
    const employees = await exportFromSQLite();
    console.log(`📥 ${employees.length} çalışan bulundu`);
    
    // PostgreSQL'deki mevcut verileri temizle
    await prisma.employee.deleteMany();
    console.log('✅ PostgreSQL çalışan tablosu temizlendi');
    
    // Verileri PostgreSQL'e aktar
    console.log('📤 Veriler PostgreSQL\'e aktarılıyor...');
    
    for (let i = 0; i < employees.length; i++) {
      const employee = employees[i];
      await prisma.employee.create({ data: employee });
      
      if ((i + 1) % 100 === 0) {
        console.log(`📊 ${i + 1}/${employees.length} çalışan aktarıldı`);
      }
    }
    
    console.log(`🎉 ${employees.length} çalışan başarıyla PostgreSQL'e aktarıldı!`);
    
    // Doğrulama
    const count = await prisma.employee.count();
    console.log(`✅ PostgreSQL'deki çalışan sayısı: ${count}`);
    
  } catch (error) {
    console.error('❌ Hata:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

importToPostgreSQL();
