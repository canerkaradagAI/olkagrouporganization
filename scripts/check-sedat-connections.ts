import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkSedatConnections() {
  const sedat = await prisma.employee.findFirst({
    where: { firstLastName: { contains: 'Sedat' } },
    include: { 
      subordinates: { 
        include: { 
          department: true,
          position: true,
          manager: true
        } 
      } 
    }
  })
  
  if (sedat) {
    console.log(`👤 ${sedat.firstLastName} (${sedat.position?.positionName})`)
    console.log(`📊 Alt çalışanları (${sedat.subordinates.length}):`)
    sedat.subordinates.forEach(sub => {
      console.log(`  - ${sub.firstLastName} (${sub.position?.positionName})`)
      console.log(`    Departman: ${sub.department?.departmentName}`)
      console.log(`    Yönetici: ${sub.manager?.firstLastName || 'Yok'}`)
      console.log(`    ManagerId: ${sub.managerId}`)
      console.log('')
    })
  }
  
  await prisma.$disconnect()
}

checkSedatConnections()
