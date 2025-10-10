import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkDepartmentConnections() {
  console.log('🔍 Departman-Yönetici bağlantıları kontrol ediliyor...\n')

  // Bilgi Teknolojileri departmanını bul
  const bilgiTeknolojileri = await prisma.department.findFirst({
    where: { departmentName: 'Bilgi Teknolojileri' }
  })

  if (bilgiTeknolojileri) {
    console.log(`📁 ${bilgiTeknolojileri.departmentName} (ID: ${bilgiTeknolojileri.departmentId})`)
    
    // Bu departmandaki çalışanları getir
    const employees = await prisma.employee.findMany({
      where: { departmentId: bilgiTeknolojileri.departmentId },
      include: { 
        position: true,
        manager: true 
      }
    })

    console.log(`👥 Bu departmanda ${employees.length} çalışan var:`)
    employees.forEach(emp => {
      console.log(`  - ${emp.firstLastName} (${emp.position?.positionName})`)
      if (emp.manager) {
        console.log(`    Yönetici: ${emp.manager.firstLastName}`)
      } else {
        console.log(`    Yönetici: Yok`)
      }
    })

    // Sedat Çakırca'yı bul
    const sedatCakirca = await prisma.employee.findFirst({
      where: { firstLastName: { contains: 'Sedat' } },
      include: { subordinates: { include: { department: true } } }
    })

    if (sedatCakirca) {
      console.log(`\n👤 ${sedatCakirca.firstLastName} (${sedatCakirca.position?.positionName})`)
      console.log(`📊 Alt çalışanları (${sedatCakirca.subordinates.length}):`)
      sedatCakirca.subordinates.forEach(sub => {
        console.log(`  - ${sub.firstLastName} (${sub.department?.departmentName})`)
      })
    }
  }

  // Tüm departmanları listele
  console.log('\n📋 Tüm Departmanlar:')
  const allDepartments = await prisma.department.findMany({
    orderBy: { departmentName: 'asc' }
  })
  
  allDepartments.forEach(dept => {
    console.log(`  ${dept.departmentId}. ${dept.departmentName}`)
  })
}

checkDepartmentConnections()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
