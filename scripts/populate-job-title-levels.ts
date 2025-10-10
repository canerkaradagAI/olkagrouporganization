import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function run() {
  const levels = await prisma.employee.findMany({
    where: { levelName: { not: null } },
    select: { levelName: true },
    distinct: ['levelName'],
  })

  // Sıralama: alfabetik, sonra el ile düzenleriz
  const names = levels.map(l => l.levelName as string).sort((a,b)=>a.localeCompare(b))

  let created = 0
  for (const [i, name] of names.entries()) {
    await prisma.jobTitleLevel.upsert({
      where: { levelName: name },
      update: {},
      create: { levelName: name, levelOrder: i + 1, description: null, color: null },
    })
    created++
  }

  console.log(`JobTitleLevel upsert tamam: ${created} seviye`) 
}

run().catch((e)=>{ console.error(e); process.exit(1) }).finally(async ()=>{ await prisma.$disconnect() })
