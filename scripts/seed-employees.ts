import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function seedEmployees() {
  try {
    console.log('👥 Çalışan verileri ekleniyor...')

    // Önce gerekli verileri al
    const companies = await prisma.company.findMany()
    const brands = await prisma.brand.findMany()
    const departments = await prisma.department.findMany()

    // Lokasyonları ekle
    const locations = await Promise.all([
      prisma.location.create({ data: { locationName: 'İstanbul Merkez' } }),
      prisma.location.create({ data: { locationName: 'Ankara Şubesi' } }),
      prisma.location.create({ data: { locationName: 'İzmir Şubesi' } }),
      prisma.location.create({ data: { locationName: 'Bursa Fabrikası' } }),
      prisma.location.create({ data: { locationName: 'Adana Depo' } }),
    ])

    console.log('📍 Lokasyonlar oluşturuldu')

    // Pozisyonları ekle
    const positions = await Promise.all([
      prisma.position.create({
        data: {
          positionName: 'Genel Müdür',
          departmentId: departments[0].departmentId, // İnsan Kaynakları
        }
      }),
      prisma.position.create({
        data: {
          positionName: 'Satış Müdürü',
          departmentId: departments[6].departmentId, // Satış ve Pazarlama
        }
      }),
      prisma.position.create({
        data: {
          positionName: 'Lojistik Uzmanı',
          departmentId: departments[1].departmentId, // Lojistik
        }
      }),
      prisma.position.create({
        data: {
          positionName: 'Muhasebe Uzmanı',
          departmentId: departments[3].departmentId, // Muhasebe ve Finans
        }
      }),
      prisma.position.create({
        data: {
          positionName: 'IT Uzmanı',
          departmentId: departments[2].departmentId, // Bilgi İşlem
        }
      }),
    ])

    console.log('💼 Pozisyonlar oluşturuldu')

    // Çalışanları ekle
    const employees = await Promise.all([
      prisma.employee.create({
        data: {
          currAccCode: 'EMP001',
          firstLastName: 'Ahmet Yılmaz',
          organization: 'Olka',
          positionId: positions[0].positionId,
          locationId: locations[0].locationId,
          brandId: brands[0].brandId,
          isManager: true,
          isBlocked: false,
        }
      }),
      prisma.employee.create({
        data: {
          currAccCode: 'EMP002',
          firstLastName: 'Ayşe Demir',
          organization: 'Marlin',
          positionId: positions[1].positionId,
          locationId: locations[0].locationId,
          brandId: brands[1].brandId,
          managerId: 'EMP001',
          isManager: true,
          isBlocked: false,
        }
      }),
      prisma.employee.create({
        data: {
          currAccCode: 'EMP003',
          firstLastName: 'Mehmet Kaya',
          organization: 'Jüpiter',
          positionId: positions[2].positionId,
          locationId: locations[1].locationId,
          brandId: brands[2].brandId,
          managerId: 'EMP001',
          isManager: false,
          isBlocked: false,
        }
      }),
      prisma.employee.create({
        data: {
          currAccCode: 'EMP004',
          firstLastName: 'Fatma Özkan',
          organization: 'Neptün',
          positionId: positions[3].positionId,
          locationId: locations[2].locationId,
          brandId: brands[3].brandId,
          managerId: 'EMP002',
          isManager: false,
          isBlocked: false,
        }
      }),
      prisma.employee.create({
        data: {
          currAccCode: 'EMP005',
          firstLastName: 'Ali Çelik',
          organization: 'Satürn',
          positionId: positions[4].positionId,
          locationId: locations[0].locationId,
          brandId: brands[4].brandId,
          managerId: 'EMP001',
          isManager: false,
          isBlocked: false,
        }
      }),
    ])

    console.log('✅ Çalışanlar oluşturuldu:')
    employees.forEach(emp => {
      console.log(`  - ${emp.currAccCode}: ${emp.firstLastName} (${emp.organization})`)
    })

    console.log('\n🎉 Tüm çalışan verileri başarıyla eklendi!')
  } catch (error) {
    console.error('❌ Hata:', error)
  } finally {
    await prisma.$disconnect()
  }
}

seedEmployees()
