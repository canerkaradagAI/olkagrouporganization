import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function debugTreeStructure() {
  console.log('🔍 Ağaç yapısı debug ediliyor...\n')

  // Yasin Kavşak'ı bul
  const yasin = await prisma.employee.findFirst({
    where: { firstLastName: { contains: 'Yasin' } },
    include: { 
      subordinates: { 
        include: { 
          department: true,
          position: true
        } 
      } 
    }
  })

  if (yasin) {
    console.log(`👤 ${yasin.firstLastName} (${yasin.levelName})`)
    console.log(`📊 Alt çalışanları (${yasin.subordinates.length}):`)
    
    // İlk 5 alt çalışanı göster
    yasin.subordinates.slice(0, 5).forEach(sub => {
      console.log(`  - ${sub.firstLastName} (${sub.levelName}) - ${sub.department?.departmentName}`)
    })
    
    if (yasin.subordinates.length > 5) {
      console.log(`  ... ve ${yasin.subordinates.length - 5} çalışan daha`)
    }
  }

  // Sedat Çakırca'yı bul
  const sedat = await prisma.employee.findFirst({
    where: { firstLastName: 'Sedat Çakırca' },
    include: { 
      subordinates: { 
        include: { 
          department: true,
          position: true
        } 
      } 
    }
  })

  if (sedat) {
    console.log(`\n👤 ${sedat.firstLastName} (${sedat.levelName})`)
    console.log(`📊 Alt çalışanları (${sedat.subordinates.length}):`)
    
    // İlk 5 alt çalışanı göster
    sedat.subordinates.slice(0, 5).forEach(sub => {
      console.log(`  - ${sub.firstLastName} (${sub.levelName}) - ${sub.department?.departmentName}`)
    })
    
    if (sedat.subordinates.length > 5) {
      console.log(`  ... ve ${sedat.subordinates.length - 5} çalışan daha`)
    }
  }

  // Root çalışanları bul (managerId null olanlar)
  const rootEmployees = await prisma.employee.findMany({
    where: { managerId: null },
    include: { position: true },
    take: 10
  })

  console.log(`\n🌳 Root çalışanlar (${rootEmployees.length}):`)
  rootEmployees.forEach(emp => {
    console.log(`  - ${emp.firstLastName} (${emp.levelName})`)
  })

  await prisma.$disconnect()
}

debugTreeStructure()
