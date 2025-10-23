const { PrismaClient } = require('@prisma/client');

async function checkEmployeeCount() {
  const prisma = new PrismaClient();
  
  try {
    const count = await prisma.employee.count();
    console.log(`SQLite'daki çalışan sayısı: ${count}`);
    
    const employees = await prisma.employee.findMany({
      take: 5,
      select: {
        currAccCode: true,
        firstLastName: true,
        departmentId: true
      }
    });
    
    console.log('İlk 5 çalışan:');
    employees.forEach(emp => {
      console.log(`- ${emp.currAccCode}: ${emp.firstLastName}`);
    });
    
  } catch (error) {
    console.error('Hata:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkEmployeeCount();
