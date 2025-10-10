
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Veritabanı seeding başlıyor...')

  try {
    // Clear existing data (in correct order to handle foreign keys)
    await prisma.userRole.deleteMany()
    await prisma.roleScreenPermission.deleteMany()
    await prisma.positionAssignment.deleteMany()
    await prisma.employee.deleteMany()
    await prisma.position.deleteMany()
    await prisma.department.deleteMany()
    await prisma.brand.deleteMany()
    await prisma.location.deleteMany()
    await prisma.assignmentTypeLookup.deleteMany()
    await prisma.permission.deleteMany()
    await prisma.screen.deleteMany()
    await prisma.role.deleteMany()
    await prisma.user.deleteMany()

    console.log('✅ Mevcut veriler temizlendi')

    // 1. Create Departments
    console.log('📚 Departmanlar oluşturuluyor...')
    const departments = await Promise.all([
      prisma.department.create({ data: { departmentName: 'İnsan Kaynakları' } }),
      prisma.department.create({ data: { departmentName: 'Bilgi İşlem' } }),
      prisma.department.create({ data: { departmentName: 'Satış ve Pazarlama' } }),
      prisma.department.create({ data: { departmentName: 'Muhasebe ve Finans' } }),
      prisma.department.create({ data: { departmentName: 'Operasyon' } }),
      prisma.department.create({ data: { departmentName: 'Lojistik' } }),
      prisma.department.create({ data: { departmentName: 'Kalite Kontrol' } }),
      prisma.department.create({ data: { departmentName: 'Ar-Ge' } }),
    ])

    // 2. Create Company
    console.log('🏢 Şirket oluşturuluyor...')
    const company = await prisma.company.upsert({
      where: { companyName: 'Olka Group' },
      update: {},
      create: { companyName: 'Olka Group' },
    })

    // 3. Create Brands (CompanyId = 1 → Olka)
    console.log('🏷️ Markalar oluşturuluyor...')
    const brands = await Promise.all([
      prisma.brand.create({ data: { brandName: 'Olka', companyId: company.companyId } }),
      prisma.brand.create({ data: { brandName: 'Marlin', companyId: company.companyId } }),
      prisma.brand.create({ data: { brandName: 'Jupiter', companyId: company.companyId } }),
      prisma.brand.create({ data: { brandName: 'Neptun', companyId: company.companyId } }),
      prisma.brand.create({ data: { brandName: 'Saturn', companyId: company.companyId } }),
    ])

    // 4. Create Locations
    console.log('📍 Lokasyonlar oluşturuluyor...')
    const locations = await Promise.all([
      prisma.location.create({ data: { locationName: 'İstanbul Merkez' } }),
      prisma.location.create({ data: { locationName: 'Ankara Şubesi' } }),
      prisma.location.create({ data: { locationName: 'İzmir Şubesi' } }),
      prisma.location.create({ data: { locationName: 'Bursa Fabrikası' } }),
      prisma.location.create({ data: { locationName: 'Adana Depo' } }),
      prisma.location.create({ data: { locationName: 'Antalya Mağaza' } }),
    ])

    // 5. Create Assignment Types
    console.log('📋 Atama tipleri oluşturuluyor...')
    const assignmentTypes = await Promise.all([
      prisma.assignmentTypeLookup.create({ data: { assignmentTypeName: 'Asaleten' } }),
      prisma.assignmentTypeLookup.create({ data: { assignmentTypeName: 'Vekaleten' } }),
    ])

    // 6. Create Positions
    console.log('💼 Pozisyonlar oluşturuluyor...')
    const positions = []

    // İnsan Kaynakları pozisyonları
    positions.push(
      await prisma.position.create({
        data: {
          positionName: 'İK Müdürü',
          department: {
            connect: { departmentId: departments[0].departmentId }
          }
        },
      }),
      await prisma.position.create({
        data: {
          positionName: 'İK Uzmanı',
          department: {
            connect: { departmentId: departments[0].departmentId }
          }
        },
      })
    )

    // Bilgi İşlem pozisyonları
    positions.push(
      await prisma.position.create({
        data: {
          positionName: 'BT Müdürü',
          department: {
            connect: { departmentId: departments[1].departmentId }
          }
        },
      }),
      await prisma.position.create({
        data: {
          positionName: 'Yazılım Geliştirici',
          department: {
            connect: { departmentId: departments[1].departmentId }
          }
        },
      }),
      await prisma.position.create({
        data: {
          positionName: 'Sistem Yöneticisi',
          department: {
            connect: { departmentId: departments[1].departmentId }
          }
        },
      })
    )

    // Satış ve Pazarlama pozisyonları
    positions.push(
      await prisma.position.create({
        data: {
          positionName: 'Satış Müdürü',
          department: {
            connect: { departmentId: departments[2].departmentId }
          }
        },
      }),
      await prisma.position.create({
        data: {
          positionName: 'Pazarlama Uzmanı',
          department: {
            connect: { departmentId: departments[2].departmentId }
          }
        },
      }),
      await prisma.position.create({
        data: {
          positionName: 'Satış Temsilcisi',
          department: {
            connect: { departmentId: departments[2].departmentId }
          }
        },
      })
    )

    // Muhasebe pozisyonları
    positions.push(
      await prisma.position.create({
        data: {
          positionName: 'Mali İşler Müdürü',
          department: {
            connect: { departmentId: departments[3].departmentId }
          }
        },
      }),
      await prisma.position.create({
        data: {
          positionName: 'Muhasebe Uzmanı',
          department: {
            connect: { departmentId: departments[3].departmentId }
          }
        },
      })
    )

    // Operasyon pozisyonları
    positions.push(
      await prisma.position.create({
        data: {
          positionName: 'Operasyon Müdürü',
          department: {
            connect: { departmentId: departments[4].departmentId }
          }
        },
      }),
      await prisma.position.create({
        data: {
          positionName: 'Üretim Uzmanı',
          department: {
            connect: { departmentId: departments[4].departmentId }
          }
        },
      })
    )

    // 7. Create Employees
    console.log('👥 Çalışanlar oluşturuluyor...')
    
    // Genel Müdür
    const ceo = await prisma.employee.create({
      data: {
        currAccCode: 'CEO001',
        firstLastName: 'Ahmet Yılmaz',
        organization: 'Olka Group',
        isManager: true,
        isBlocked: false,
        brandId: brands[0].brandId,
        locationId: locations[0].locationId,
      },
    })

    // Departman Müdürleri
    const hrManager = await prisma.employee.create({
      data: {
        currAccCode: 'HR001',
        firstLastName: 'Fatma Kaya',
        organization: 'Olka Group',
        positionId: positions[0].positionId,
        managerId: ceo.currAccCode,
        isManager: true,
        isBlocked: false,
        brandId: brands[0].brandId,
        locationId: locations[0].locationId,
      },
    })

    const itManager = await prisma.employee.create({
      data: {
        currAccCode: 'IT001',
        firstLastName: 'Mehmet Demir',
        organization: 'Olka Group',
        positionId: positions[2].positionId,
        managerId: ceo.currAccCode,
        isManager: true,
        isBlocked: false,
        brandId: brands[0].brandId,
        locationId: locations[0].locationId,
      },
    })

    const salesManager = await prisma.employee.create({
      data: {
        currAccCode: 'SAL001',
        firstLastName: 'Ayşe Özkan',
        organization: 'Olka Group',
        positionId: positions[5].positionId,
        managerId: ceo.currAccCode,
        isManager: true,
        isBlocked: false,
        brandId: brands[1].brandId,
        locationId: locations[0].locationId,
      },
    })

    const financeManager = await prisma.employee.create({
      data: {
        currAccCode: 'FIN001',
        firstLastName: 'Mustafa Çelik',
        organization: 'Olka Group',
        positionId: positions[8].positionId,
        managerId: ceo.currAccCode,
        isManager: true,
        isBlocked: false,
        brandId: brands[0].brandId,
        locationId: locations[0].locationId,
      },
    })

    // Çalışanlar
    const employees = [
      {
        currAccCode: 'HR002',
        firstLastName: 'Zeynep Aydın',
        positionId: positions[1].positionId,
        managerId: hrManager.currAccCode,
        brandId: brands[0].brandId,
        locationId: locations[0].locationId,
      },
      {
        currAccCode: 'IT002',
        firstLastName: 'Can Yıldız',
        positionId: positions[3].positionId,
        managerId: itManager.currAccCode,
        brandId: brands[0].brandId,
        locationId: locations[0].locationId,
      },
      {
        currAccCode: 'IT003',
        firstLastName: 'Elif Şahin',
        positionId: positions[4].positionId,
        managerId: itManager.currAccCode,
        brandId: brands[0].brandId,
        locationId: locations[0].locationId,
      },
      {
        currAccCode: 'SAL002',
        firstLastName: 'Burak Koç',
        positionId: positions[6].positionId,
        managerId: salesManager.currAccCode,
        brandId: brands[1].brandId,
        locationId: locations[1].locationId,
      },
      {
        currAccCode: 'SAL003',
        firstLastName: 'Seda Güler',
        positionId: positions[7].positionId,
        managerId: salesManager.currAccCode,
        brandId: brands[1].brandId,
        locationId: locations[2].locationId,
      },
      {
        currAccCode: 'FIN002',
        firstLastName: 'Oğuz Arslan',
        positionId: positions[9].positionId,
        managerId: financeManager.currAccCode,
        brandId: brands[0].brandId,
        locationId: locations[0].locationId,
      },
      {
        currAccCode: 'OPR001',
        firstLastName: 'Deniz Karaca',
        positionId: positions[10].positionId,
        managerId: ceo.currAccCode,
        isManager: true,
        brandId: brands[2].brandId,
        locationId: locations[3].locationId,
      },
      {
        currAccCode: 'OPR002',
        firstLastName: 'Gülcan Yavuz',
        positionId: positions[11].positionId,
        managerId: 'OPR001',
        brandId: brands[2].brandId,
        locationId: locations[3].locationId,
      },
      {
        currAccCode: 'EMP001',
        firstLastName: 'Blocked User',
        organization: 'Olka Group',
        isBlocked: true,
        brandId: brands[0].brandId,
        locationId: locations[0].locationId,
      },
    ]

    for (const emp of employees) {
      await prisma.employee.create({
        data: {
          ...emp,
          organization: emp.organization || 'Olka Group',
          isManager: emp.isManager || false,
          isBlocked: emp.isBlocked || false,
        },
      })
    }

    // 8. Create Roles
    console.log('🔐 Roller oluşturuluyor...')
    const roles = await Promise.all([
      prisma.role.create({
        data: {
          roleName: 'Admin',
          description: 'Sistem yöneticisi - tüm yetkilere sahip',
          isActive: true,
        },
      }),
      prisma.role.create({
        data: {
          roleName: 'HR',
          description: 'İnsan Kaynakları uzmanı',
          isActive: true,
        },
      }),
      prisma.role.create({
        data: {
          roleName: 'Manager',
          description: 'Departman yöneticisi',
          isActive: true,
        },
      }),
      prisma.role.create({
        data: {
          roleName: 'Employee',
          description: 'Standart çalışan',
          isActive: true,
        },
      }),
    ])

    // 9. Create Screens
    console.log('📱 Ekranlar oluşturuluyor...')
    const screens = await Promise.all([
      prisma.screen.create({
        data: {
          screenName: 'Dashboard',
          screenPath: '/dashboard',
          description: 'Ana kontrol paneli',
        },
      }),
      prisma.screen.create({
        data: {
          screenName: 'Employees',
          screenPath: '/employees',
          description: 'Çalışan yönetimi',
        },
      }),
      prisma.screen.create({
        data: {
          screenName: 'Positions',
          screenPath: '/positions',
          description: 'Pozisyon yönetimi',
        },
      }),
      prisma.screen.create({
        data: {
          screenName: 'Reports',
          screenPath: '/reports',
          description: 'Raporlama',
        },
      }),
      prisma.screen.create({
        data: {
          screenName: 'Settings',
          screenPath: '/settings',
          description: 'Sistem ayarları',
        },
      }),
    ])

    // 10. Create Permissions
    console.log('🔑 İzinler oluşturuluyor...')
    const permissions = await Promise.all([
      prisma.permission.create({ data: { permissionName: 'Read' } }),
      prisma.permission.create({ data: { permissionName: 'Write' } }),
      prisma.permission.create({ data: { permissionName: 'Update' } }),
      prisma.permission.create({ data: { permissionName: 'Delete' } }),
    ])

    // 11. Create Role Screen Permissions
    console.log('🔗 Rol yetkileri oluşturuluyor...')
    
    // Admin - tüm yetkilere sahip
    for (const screen of screens) {
      for (const permission of permissions) {
        await prisma.roleScreenPermission.create({
          data: {
            roleId: roles[0].roleId, // Admin
            screenId: screen.screenId,
            permissionId: permission.permissionId,
          },
        })
      }
    }

    // HR - çalışan yönetimi yetkisi
    const hrPermissions = [
      { screenId: screens[0].screenId, permissions: [0] }, // Dashboard - Read
      { screenId: screens[1].screenId, permissions: [0, 1, 2] }, // Employees - Read, Write, Update
      { screenId: screens[2].screenId, permissions: [0] }, // Positions - Read
    ]
    
    for (const screen of hrPermissions) {
      for (const permIndex of screen.permissions) {
        await prisma.roleScreenPermission.create({
          data: {
            roleId: roles[1].roleId, // HR
            screenId: screen.screenId,
            permissionId: permissions[permIndex].permissionId,
          },
        })
      }
    }

    // Manager - sınırlı yetki
    const managerPermissions = [
      { screenId: screens[0].screenId, permissions: [0] }, // Dashboard - Read
      { screenId: screens[1].screenId, permissions: [0] }, // Employees - Read
      { screenId: screens[3].screenId, permissions: [0] }, // Reports - Read
    ]
    
    for (const screen of managerPermissions) {
      for (const permIndex of screen.permissions) {
        await prisma.roleScreenPermission.create({
          data: {
            roleId: roles[2].roleId, // Manager
            screenId: screen.screenId,
            permissionId: permissions[permIndex].permissionId,
          },
        })
      }
    }

    // Employee - sadece dashboard okuma
    await prisma.roleScreenPermission.create({
      data: {
        roleId: roles[3].roleId, // Employee
        screenId: screens[0].screenId, // Dashboard
        permissionId: permissions[0].permissionId, // Read
      },
    })

    // 12. Create Users
    console.log('👤 Kullanıcılar oluşturuluyor...')
    const hashedPassword = await bcrypt.hash('admin123', 10)
    const testPassword = await bcrypt.hash('johndoe123', 10)

    const adminUser = await prisma.user.create({
      data: {
        email: 'admin@olka.com',
        password: hashedPassword,
        firstName: 'Admin',
        lastName: 'User',
        name: 'Admin User',
        isActive: true,
      },
    })

    // Test account for automatic testing
    const testUser = await prisma.user.create({
      data: {
        email: 'john@doe.com',
        password: testPassword,
        firstName: 'John',
        lastName: 'Doe',
        name: 'John Doe',
        isActive: true,
      },
    })

    // Additional users
    const users = [
      {
        email: 'hr@olka.com',
        password: await bcrypt.hash('hr123', 10),
        firstName: 'İK',
        lastName: 'Uzmanı',
        name: 'İK Uzmanı',
        roleId: roles[1].roleId, // HR
      },
      {
        email: 'manager@olka.com',
        password: await bcrypt.hash('manager123', 10),
        firstName: 'Departman',
        lastName: 'Müdürü',
        name: 'Departman Müdürü',
        roleId: roles[2].roleId, // Manager
      },
      {
        email: 'employee@olka.com',
        password: await bcrypt.hash('employee123', 10),
        firstName: 'Çalışan',
        lastName: 'Kullanıcı',
        name: 'Çalışan Kullanıcı',
        roleId: roles[3].roleId, // Employee
      },
    ]

    for (const user of users) {
      const createdUser = await prisma.user.create({
        data: {
          email: user.email,
          password: user.password,
          firstName: user.firstName,
          lastName: user.lastName,
          name: user.name,
          isActive: true,
        },
      })

      await prisma.userRole.create({
        data: {
          userId: createdUser.id,
          roleId: user.roleId,
        },
      })
    }

    // 13. Assign Admin Role
    await prisma.userRole.create({
      data: {
        userId: adminUser.id,
        roleId: roles[0].roleId, // Admin
      },
    })

    // Assign Admin role to test user for testing
    await prisma.userRole.create({
      data: {
        userId: testUser.id,
        roleId: roles[0].roleId, // Admin
      },
    })

    // 14. Create Position Assignments
    console.log('📝 Pozisyon atamaları oluşturuluyor...')
    
    const currentDate = new Date()
    const assignments = [
      {
        positionId: positions[0].positionId,
        currAccCode: hrManager.currAccCode,
        startDate: currentDate,
        assignmentType: 'Asaleten',
      },
      {
        positionId: positions[2].positionId,
        currAccCode: itManager.currAccCode,
        startDate: currentDate,
        assignmentType: 'Asaleten',
      },
      {
        positionId: positions[5].positionId,
        currAccCode: salesManager.currAccCode,
        startDate: currentDate,
        assignmentType: 'Asaleten',
      },
    ]

    for (const assignment of assignments) {
      await prisma.positionAssignment.create({
        data: assignment,
      })
    }

    console.log('✅ Seeding tamamlandı!')
    console.log(`
📊 Oluşturulan veriler:
- ${departments.length} Departman
- ${brands.length} Marka
- ${locations.length} Lokasyon
- ${assignmentTypes.length} Atama Tipi
- ${positions.length} Pozisyon
- ${await prisma.employee.count()} Çalışan
- ${roles.length} Rol
- ${screens.length} Ekran
- ${permissions.length} İzin
- ${await prisma.user.count()} Kullanıcı

🔑 Test hesapları:
- admin@olka.com / admin123 (Admin)
- hr@olka.com / hr123 (İK)
- manager@olka.com / manager123 (Yönetici)
- employee@olka.com / employee123 (Çalışan)
    `)
  } catch (error) {
    console.error('❌ Seeding sırasında hata:', error)
    throw error
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
