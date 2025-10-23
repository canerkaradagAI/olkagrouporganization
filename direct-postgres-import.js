const fs = require('fs');
const csv = require('csv-parser');
const { Client } = require('pg');

async function importEmployeesFromCSV() {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    database: 'olkagroup',
    user: 'postgres',
    password: 'postgres',
  });

  try {
    console.log('📊 PostgreSQL\'e bağlanılıyor...');
    await client.connect();
    console.log('✅ PostgreSQL bağlantısı kuruldu');

    // Mevcut verileri temizle
    await client.query('DELETE FROM employees');
    console.log('✅ PostgreSQL çalışan tablosu temizlendi');

    console.log('📊 CSV dosyasından çalışan verileri okunuyor...');
    
    const employees = [];
    
    // CSV dosyasını oku
    await new Promise((resolve, reject) => {
      fs.createReadStream('./data/Employee.csv')
        .pipe(csv({ separator: ';' }))
        .on('data', (row) => {
          employees.push({
            currAccCode: row.CurrAccCode,
            firstLastName: row.NameSurname,
            organization: null,
            positionId: row.PositionId ? parseInt(row.PositionId.replace('P', '')) : null,
            locationId: row.LocationId ? parseInt(row.LocationId) : null,
            departmentId: null,
            isBlocked: row.IsBlocked === 'True',
            isManager: row.IsManager === 'True',
            managerId: row.ManagerId === 'Null' ? null : row.ManagerId,
            brandId: row.BrandId ? parseInt(row.BrandId) : null,
            levelName: row.LevelName
          });
        })
        .on('end', resolve)
        .on('error', reject);
    });
    
    console.log(`📥 ${employees.length} çalışan CSV'den okundu`);
    
    // Verileri PostgreSQL'e aktar
    console.log('📤 Veriler PostgreSQL\'e aktarılıyor...');
    
    for (let i = 0; i < employees.length; i++) {
      const emp = employees[i];
      try {
        await client.query(`
          INSERT INTO employees (
            "currAccCode", "firstLastName", organization, "positionId", 
            "locationId", "departmentId", "isBlocked", "isManager", 
            "managerId", "brandId", "levelName"
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        `, [
          emp.currAccCode, emp.firstLastName, emp.organization, emp.positionId,
          emp.locationId, emp.departmentId, emp.isBlocked, emp.isManager,
          emp.managerId, emp.brandId, emp.levelName
        ]);
        
        if ((i + 1) % 100 === 0) {
          console.log(`📊 ${i + 1}/${employees.length} çalışan aktarıldı`);
        }
      } catch (error) {
        console.log(`⚠️ Çalışan ${emp.currAccCode} aktarılamadı: ${error.message}`);
      }
    }
    
    console.log(`🎉 CSV'den ${employees.length} çalışan PostgreSQL'e aktarıldı!`);
    
    // Doğrulama
    const result = await client.query('SELECT COUNT(*) FROM employees');
    console.log(`✅ PostgreSQL'deki çalışan sayısı: ${result.rows[0].count}`);
    
  } catch (error) {
    console.error('❌ Hata:', error.message);
  } finally {
    await client.end();
  }
}

importEmployeesFromCSV();
