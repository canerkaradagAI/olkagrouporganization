import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkYasinFiltered() {
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
    console.log(`👤 ${yasin.firstLastName}`)
    console.log('📊 İç Denetim departmanındaki alt çalışanları:')
    const icDenetimSubordinates = yasin.subordinates.filter(sub => sub.department?.departmentName === 'İç Denetim')
    icDenetimSubordinates.forEach(sub => {
      console.log(`  - ${sub.firstLastName} (${sub.position?.positionName})`)
    })
    console.log(`\nToplam İç Denetim alt çalışanı: ${icDenetimSubordinates.length}`)
  }
  
  await prisma.$disconnect()
}

checkYasinFiltered()
