import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function addBrands() {
  try {
    console.log('🏷️ Markalar ekleniyor...')

    // Markaları ekle
    const brands = [
      { brandName: 'Skechers', companyName: 'Olka' },
      { brandName: 'Asics', companyName: 'Marlin' },
      { brandName: 'Klaud', companyName: 'Jüpiter' },
      { brandName: 'Brooks', companyName: 'Neptün' },
      { brandName: 'On', companyName: 'Satürn' }
    ]

    for (const brand of brands) {
      const company = await prisma.company.findUnique({
        where: { companyName: brand.companyName }
      })

      if (company) {
        await prisma.brand.create({
          data: {
            brandName: brand.brandName,
            companyId: company.companyId
          }
        })
        console.log(`✓ ${brand.brandName} markası ${brand.companyName} şirketine eklendi`)
      } else {
        console.log(`❌ ${brand.companyName} şirketi bulunamadı`)
      }
    }

    console.log('✅ Tüm markalar başarıyla eklendi!')
  } catch (error) {
    console.error('❌ Hata:', error)
  } finally {
    await prisma.$disconnect()
  }
}

addBrands()
