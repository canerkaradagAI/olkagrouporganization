const { Client } = require('pg');

async function clearTables() {
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

    // Foreign key constraint'leri devre dışı bırak
    await client.query('SET session_replication_role = replica;');
    
    // Tüm tabloları temizle
    await client.query('DELETE FROM position_assignments');
    await client.query('DELETE FROM employees');
    await client.query('DELETE FROM positions');
    await client.query('DELETE FROM departments');
    await client.query('DELETE FROM brands');
    await client.query('DELETE FROM companies');
    await client.query('DELETE FROM locations');
    await client.query('DELETE FROM job_title_levels');
    await client.query('DELETE FROM assignment_type_lookup');
    
    console.log('✅ Tüm tablolar temizlendi');
    
    // Foreign key constraint'leri tekrar aktif et
    await client.query('SET session_replication_role = DEFAULT;');
    
  } catch (error) {
    console.error('❌ Hata:', error.message);
  } finally {
    await client.end();
  }
}

clearTables();
