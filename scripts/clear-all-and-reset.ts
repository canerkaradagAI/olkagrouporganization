import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🧹 Tüm tablolar boşaltılıyor ve sayaçlar sıfırlanıyor...')

  // Bağımlı tablolardan başlayarak temizle
  await prisma.positionAssignment.deleteMany()
  await prisma.employee.deleteMany()
  await prisma.position.deleteMany()
  await prisma.department.deleteMany()
  await prisma.location.deleteMany()
  await prisma.brand.deleteMany()
  await prisma.jobTitleLevel.deleteMany()
  await prisma.assignmentTypeLookup.deleteMany()

  await prisma.userRole.deleteMany()
  await prisma.roleScreenPermission.deleteMany()
  await prisma.permission.deleteMany()
  await prisma.screen.deleteMany()
  await prisma.role.deleteMany()

  await prisma.account.deleteMany()
  await prisma.session.deleteMany()
  await prisma.verificationToken.deleteMany()

  await prisma.company.deleteMany()

  // SQLite autoincrement sayaçlarını resetle
  // (Postgres/MySQL için farklı stratejiler gerekir; proje SQLite kullanıyor)
  try {
    await prisma.$executeRawUnsafe('DELETE FROM sqlite_sequence')
    console.log('🔢 sqlite_sequence sıfırlandı')
  } catch (e) {
    console.warn('sqlite_sequence sıfırlanamadı (SQLite dışı ortam olabilir).')
  }

  console.log('✅ Tüm veriler silindi, yeni kayıtlar 1\'den başlayacak.')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(async () => { await prisma.$disconnect() })


