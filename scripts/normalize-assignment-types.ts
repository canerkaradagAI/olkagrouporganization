import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Eski/çeşitli değerleri iki tipe indirger
const TO_ASALETEN = new Set([
  'Kalıcı',
  'Tam Zamanlı',
  'Yarı Zamanlı',
  'Permanent',
  'Full Time',
  'Part Time',
])

async function main() {
  console.log('📋 AssignmentTypeLookup normalize ediliyor...')

  // İki temel tip kalsın: Asaleten, Vekaleten
  await prisma.assignmentTypeLookup.deleteMany({})
  await prisma.assignmentTypeLookup.upsert({
    where: { assignmentTypeName: 'Asaleten' },
    update: {},
    create: { assignmentTypeName: 'Asaleten' },
  })
  await prisma.assignmentTypeLookup.upsert({
    where: { assignmentTypeName: 'Vekaleten' },
    update: {},
    create: { assignmentTypeName: 'Vekaleten' },
  })

  console.log('🔄 PositionAssignment.assignmentType güncelleniyor...')
  const assignments = await prisma.positionAssignment.findMany({
    select: { assignmentId: true, assignmentType: true },
  })

  let updated = 0
  for (const a of assignments) {
    const source = (a.assignmentType || '').trim()
    const normalized = TO_ASALETEN.has(source) ? 'Asaleten' : 'Vekaleten'
    if (source !== normalized) {
      await prisma.positionAssignment.update({
        where: { assignmentId: a.assignmentId },
        data: { assignmentType: normalized },
      })
      updated++
    }
  }

  console.log(`✅ Lookup sabitlendi. Güncellenen assignment sayısı: ${updated}`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })


