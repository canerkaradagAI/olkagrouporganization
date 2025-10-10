import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function seedCompanies() {
  try {
    console.log('Şirket ve marka verileri ekleniyor...')

    // Şirketleri ekle
    const companies = [
      { companyName: 'Olka' },
      { companyName: 'Marlin' },
      { companyName: 'Neptün' },
      { companyName: 'Jüpiter' },
      { companyName: 'Satürn' }
    ]

    for (const company of companies) {
      await prisma.company.create({
        data: company
      })
      console.log(`✓ ${company.companyName} şirketi eklendi`)
    }

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
      }
    }

    console.log('✅ Tüm şirket ve marka verileri başarıyla eklendi!')
  } catch (error) {
    console.error('❌ Hata:', error)
  } finally {
    await prisma.$disconnect()
  }
}

seedCompanies()
