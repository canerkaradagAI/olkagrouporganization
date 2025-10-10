import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🏷️ Brand oluşturuluyor...')
  
  const brand = await prisma.brand.create({
    data: {
      brandName: 'Olka Premium',
      companyId: 1
    }
  })
  
  console.log('✅ Brand oluşturuldu:', brand)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
