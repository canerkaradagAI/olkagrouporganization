import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function findSedat() {
  const sedatEmployees = await prisma.employee.findMany({
    where: { firstLastName: { contains: 'Sedat' } },
    include: { position: true, subordinates: { include: { department: true } } }
  })
  
  console.log('Sedat isimli çalışanlar:')
  sedatEmployees.forEach(emp => {
    console.log(`- ${emp.firstLastName} (${emp.position?.positionName})`)
    console.log(`  Alt çalışanları: ${emp.subordinates.length}`)
    if (emp.subordinates.length > 0) {
      emp.subordinates.forEach(sub => {
        console.log(`    - ${sub.firstLastName} (${sub.department?.departmentName})`)
      })
    }
  })
  
  await prisma.$disconnect()
}

findSedat()
