const { Client } = require('pg');

async function removeConstraintAndImport() {
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

    // ManagerId constraint'ini kaldır
    console.log('🔧 ManagerId constraint\'i kaldırılıyor...');
    await client.query('ALTER TABLE employees DROP CONSTRAINT IF EXISTS employees_managerId_fkey;');
    console.log('✅ Constraint kaldırıldı');

    // Mevcut verileri temizle
    await client.query('DELETE FROM employees');
    console.log('✅ PostgreSQL çalışan tablosu temizlendi');

    // CSV'den veri aktarımını tekrar çalıştır
    console.log('📊 CSV\'den veri aktarımı başlatılıyor...');
    
    const fs = require('fs');
    const csv = require('csv-parser');
    
    const employees = [];
    
    await new Promise((resolve, reject) => {
      fs.createReadStream('./data/Employee.csv')
        .pipe(csv({ separator: ';' }))
        .on('data', (row) => {
          // BOM karakterini temizle
          const cleanRow = {};
          for (const [key, value] of Object.entries(row)) {
            const cleanKey = key.replace(/^\uFEFF/, '');
            cleanRow[cleanKey] = value;
          }
          
          if (!cleanRow.CurrAccCode || cleanRow.CurrAccCode.trim() === '') {
            return;
          }
          
          const employee = {
            currAccCode: cleanRow.CurrAccCode.trim(),
            firstLastName: cleanRow.NameSurname ? cleanRow.NameSurname.trim() : null,
            organization: null,
            positionId: cleanRow.PositionId ? parseInt(cleanRow.PositionId.replace('P', '')) : null,
            locationId: cleanRow.LocationId ? parseInt(cleanRow.LocationId) : null,
            departmentId: null,
            isBlocked: cleanRow.IsBlocked === 'True',
            isManager: cleanRow.IsManager === 'True',
            managerId: cleanRow.ManagerId === 'Null' || cleanRow.ManagerId === '' ? null : cleanRow.ManagerId.trim(),
            brandId: cleanRow.BrandId ? parseInt(cleanRow.BrandId) : null,
            levelName: cleanRow.LevelName ? cleanRow.LevelName.trim() : null
          };
          employees.push(employee);
        })
        .on('end', resolve)
        .on('error', reject);
    });
    
    console.log(`📥 ${employees.length} çalışan CSV'den okundu`);
    
    // Verileri PostgreSQL'e aktar
    console.log('📤 Veriler PostgreSQL\'e aktarılıyor...');
    
    let successCount = 0;
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
        
        successCount++;
        
        if ((i + 1) % 100 === 0) {
          console.log(`📊 ${i + 1}/${employees.length} çalışan işlendi, ${successCount} başarılı`);
        }
      } catch (error) {
        console.log(`⚠️ Çalışan ${emp.currAccCode} aktarılamadı: ${error.message}`);
      }
    }
    
    console.log(`🎉 ${successCount} çalışan başarıyla PostgreSQL'e aktarıldı!`);
    
    // Doğrulama
    const result = await client.query('SELECT COUNT(*) FROM employees');
    console.log(`✅ PostgreSQL'deki çalışan sayısı: ${result.rows[0].count}`);
    
  } catch (error) {
    console.error('❌ Hata:', error.message);
  } finally {
    await client.end();
  }
}

removeConstraintAndImport();

