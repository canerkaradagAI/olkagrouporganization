import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🏢 Temel veriler oluşturuluyor...')
  
  try {
    // 1. Company oluştur
    console.log('🏢 Company oluşturuluyor...')
    const company = await prisma.company.create({
      data: {
        companyName: 'Olka Group'
      }
    })
    console.log('✅ Company oluşturuldu:', company.companyName, '(ID:', company.companyId, ')')
    
    // 2. Brand oluştur
    console.log('🏷️ Brand oluşturuluyor...')
    const brand = await prisma.brand.create({
      data: {
        brandName: 'Olka Premium',
        companyId: company.companyId
      }
    })
    console.log('✅ Brand oluşturuldu:', brand.brandName, '(ID:', brand.brandId, ')')
    
    console.log('🎉 Temel veriler başarıyla oluşturuldu!')
    
  } catch (error) {
    console.error('❌ Hata:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()
