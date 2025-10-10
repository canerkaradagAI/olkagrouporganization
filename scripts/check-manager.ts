import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🔍 Manager ilişkilerini kontrol ediyorum...')
  
  const employee = await prisma.employee.findFirst({
    where: { currAccCode: '1-8-0001' },
    include: { manager: true }
  })
  
  if (employee) {
    console.log('👤 Employee:', employee.firstLastName)
    console.log('👨‍💼 Manager:', employee.manager?.firstLastName || 'YOK')
    console.log('🔗 ManagerId:', employee.managerId)
  }
  
  // Yasin Kavşak'ı kontrol et
  const yasin = await prisma.employee.findFirst({
    where: { firstLastName: 'Yasin Kavşak' },
    include: { manager: true }
  })
  
  if (yasin) {
    console.log('\n👤 Yasin Kavşak:', yasin.firstLastName)
    console.log('👨‍💼 Manager:', yasin.manager?.firstLastName || 'YOK')
    console.log('🔗 ManagerId:', yasin.managerId)
  }
  
  await prisma.$disconnect()
}

main().catch(console.error)
