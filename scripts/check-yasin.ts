import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkYasin() {
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
    console.log(`👤 ${yasin.firstLastName} (${yasin.position?.positionName})`)
    console.log(`📊 Alt çalışanları (${yasin.subordinates.length}):`)
    yasin.subordinates.forEach(sub => {
      console.log(`  - ${sub.firstLastName} (${sub.position?.positionName}) - ${sub.department?.departmentName}`)
    })
  }
  
  await prisma.$disconnect()
}

checkYasin()
