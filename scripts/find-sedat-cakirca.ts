import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function findSedatCakirca() {
  const sedatEmployees = await prisma.employee.findMany({
    where: { firstLastName: { contains: 'Sedat' } },
    include: { position: true }
  })
  
  console.log('Sedat isimli çalışanlar:')
  sedatEmployees.forEach(emp => {
    console.log(`- ${emp.firstLastName} (${emp.position?.positionName})`)
  })
  
  await prisma.$disconnect()
}

findSedatCakirca()
