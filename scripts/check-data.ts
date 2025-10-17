import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkData() {
  try {
    console.log('🔍 Veritabanı verileri kontrol ediliyor...\n')

    // Companies
    const companies = await prisma.company.findMany()
    console.log('📊 Şirketler:')
    companies.forEach(company => {
      console.log(`  - ${company.companyId}: ${company.companyName}`)
    })

    // Brands
    const brands = await prisma.brand.findMany({
      include: {
        company: true
      }
    })
    console.log('\n🏷️ Markalar:')
    brands.forEach(brand => {
      console.log(`  - ${brand.brandId}: ${brand.brandName} (${brand.company.companyName})`)
    })

    // Departments
    const departments = await prisma.department.findMany()
    console.log('\n🏢 Departmanlar:')
    departments.forEach(dept => {
      console.log(`  - ${dept.departmentId}: ${dept.departmentName}`)
    })

    // Locations
    const locations = await prisma.location.findMany()
    console.log('\n📍 Lokasyonlar:')
    locations.forEach(location => {
      console.log(`  - ${location.locationId}: ${location.locationName}`)
    })

    // Positions
    const positions = await prisma.position.findMany({
      include: {
        department: true
      }
    })
    console.log('\n💼 Pozisyonlar:')
    positions.forEach(position => {
      console.log(`  - ${position.positionId}: ${position.positionName} (${position.department?.departmentName || 'No Department'})`)
    })

    // Employees
    const employees = await prisma.employee.findMany({
      include: {
        position: true,
        location: true,
        brand: true,
        manager: true
      }
    })
    console.log('\n👥 Çalışanlar:')
    employees.forEach(emp => {
      console.log(`  - ${emp.currAccCode}: ${emp.firstLastName} (${emp.organization}) - ${emp.position?.positionName || 'Pozisyon yok'}`)
    })

    console.log('\n✅ Veri kontrolü tamamlandı!')
  } catch (error) {
    console.error('❌ Hata:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkData()
