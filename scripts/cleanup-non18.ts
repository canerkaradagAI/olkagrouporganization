import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function run() {
  // Önce FK bağı olan atamaları sil
  const delAssign = await prisma.positionAssignment.deleteMany({
    where: { currAccCode: { not: { startsWith: '1-8-' } } },
  })
  // Sonra çalışanları sil
  const delEmp = await prisma.employee.deleteMany({
    where: { currAccCode: { not: { startsWith: '1-8-' } } },
  })
  console.log(`Silinen position_assignments: ${delAssign.count}`)
  console.log(`Silinen employees: ${delEmp.count}`)
}

run()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(async () => { await prisma.$disconnect() })
