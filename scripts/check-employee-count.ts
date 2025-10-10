import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const count = await prisma.employee.count()
  console.log('Employee count:', count)
  if (count > 0) {
    const sample = await prisma.employee.findMany({ take: 5 })
    console.log(sample)
  }
}

main().catch(console.error).finally(async () => {
  await prisma.$disconnect()
})


