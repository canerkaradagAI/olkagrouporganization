const { PrismaClient: PrismaClientSQLite } = require('@prisma/client');
const { PrismaClient: PrismaClientPostgres } = require('@prisma/client');

async function transferDataToPostgreSQL() {
  // SQLite için ayrı Prisma Client
  const sqlitePrisma = new PrismaClientSQLite({
    datasources: {
      db: {
        url: "file:./dev.db"
      }
    }
  });

  // PostgreSQL için ayrı Prisma Client
  const postgresPrisma = new PrismaClientPostgres({
    datasources: {
      db: {
        url: "postgresql://postgres:postgres@localhost:5432/olkagroup?schema=public"
      }
    }
  });

  try {
    console.log('📊 SQLite\'dan veri okunuyor...');
    
    // Tüm tabloları temizle
    await postgresPrisma.positionAssignment.deleteMany();
    await postgresPrisma.employee.deleteMany();
    await postgresPrisma.position.deleteMany();
    await postgresPrisma.department.deleteMany();
    await postgresPrisma.brand.deleteMany();
    await postgresPrisma.company.deleteMany();
    await postgresPrisma.location.deleteMany();
    await postgresPrisma.jobTitleLevel.deleteMany();
    await postgresPrisma.assignmentTypeLookup.deleteMany();
    
    console.log('✅ PostgreSQL tabloları temizlendi');

    // Şirketleri aktar
    const companies = await sqlitePrisma.company.findMany();
    for (const company of companies) {
      await postgresPrisma.company.create({ data: company });
    }
    console.log(`✅ ${companies.length} şirket aktarıldı`);

    // Markaları aktar
    const brands = await sqlitePrisma.brand.findMany();
    for (const brand of brands) {
      await postgresPrisma.brand.create({ data: brand });
    }
    console.log(`✅ ${brands.length} marka aktarıldı`);

    // Departmanları aktar
    const departments = await sqlitePrisma.department.findMany();
    for (const department of departments) {
      await postgresPrisma.department.create({ data: department });
    }
    console.log(`✅ ${departments.length} departman aktarıldı`);

    // Lokasyonları aktar
    const locations = await sqlitePrisma.location.findMany();
    for (const location of locations) {
      await postgresPrisma.location.create({ data: location });
    }
    console.log(`✅ ${locations.length} lokasyon aktarıldı`);

    // Pozisyonları aktar
    const positions = await sqlitePrisma.position.findMany();
    for (const position of positions) {
      await postgresPrisma.position.create({ data: position });
    }
    console.log(`✅ ${positions.length} pozisyon aktarıldı`);

    // Çalışanları aktar
    const employees = await sqlitePrisma.employee.findMany();
    console.log(`📥 ${employees.length} çalışan aktarılıyor...`);
    
    for (let i = 0; i < employees.length; i++) {
      const employee = employees[i];
      await postgresPrisma.employee.create({ data: employee });
      
      if ((i + 1) % 100 === 0) {
        console.log(`📊 ${i + 1}/${employees.length} çalışan aktarıldı`);
      }
    }
    console.log(`✅ ${employees.length} çalışan aktarıldı`);

    // Job Title Levels aktar
    const jobTitleLevels = await sqlitePrisma.jobTitleLevel.findMany();
    for (const level of jobTitleLevels) {
      await postgresPrisma.jobTitleLevel.create({ data: level });
    }
    console.log(`✅ ${jobTitleLevels.length} job title level aktarıldı`);

    // Assignment Types aktar
    const assignmentTypes = await sqlitePrisma.assignmentTypeLookup.findMany();
    for (const type of assignmentTypes) {
      await postgresPrisma.assignmentTypeLookup.create({ data: type });
    }
    console.log(`✅ ${assignmentTypes.length} assignment type aktarıldı`);

    // Position Assignments aktar
    const assignments = await sqlitePrisma.positionAssignment.findMany();
    for (const assignment of assignments) {
      await postgresPrisma.positionAssignment.create({ data: assignment });
    }
    console.log(`✅ ${assignments.length} position assignment aktarıldı`);

    console.log('🎉 Tüm veriler başarıyla PostgreSQL\'e aktarıldı!');

  } catch (error) {
    console.error('❌ Hata:', error.message);
  } finally {
    await sqlitePrisma.$disconnect();
    await postgresPrisma.$disconnect();
  }
}

transferDataToPostgreSQL();
