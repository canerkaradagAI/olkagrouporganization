import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function seedAllTables() {
  try {
    console.log('🌱 Tüm tablolar dolduruluyor...\n')

    // 1. AssignmentTypeLookup
    console.log('📋 AssignmentTypeLookup oluşturuluyor...')
    const assignmentTypes = await Promise.all([
      prisma.assignmentTypeLookup.create({ data: { assignmentTypeName: 'Asaleten' } }),
      prisma.assignmentTypeLookup.create({ data: { assignmentTypeName: 'Vekaleten' } }),
    ])
    console.log('✅ AssignmentTypeLookup tamamlandı')

    // 2. Permissions
    console.log('🔐 Permissions oluşturuluyor...')
    const permissions = await Promise.all([
      prisma.permission.create({ data: { permissionName: 'Read' } }),
      prisma.permission.create({ data: { permissionName: 'Write' } }),
      prisma.permission.create({ data: { permissionName: 'Update' } }),
      prisma.permission.create({ data: { permissionName: 'Delete' } }),
      prisma.permission.create({ data: { permissionName: 'Admin' } }),
    ])
    console.log('✅ Permissions tamamlandı')

    // 3. Screens
    console.log('🖥️ Screens oluşturuluyor...')
    const screens = await Promise.all([
      prisma.screen.create({ 
        data: { 
          screenName: 'Dashboard', 
          screenPath: '/',
          description: 'Ana sayfa ve genel istatistikler'
        } 
      }),
      prisma.screen.create({ 
        data: { 
          screenName: 'Organization', 
          screenPath: '/organization',
          description: 'Organizasyon yönetimi'
        } 
      }),
      prisma.screen.create({ 
        data: { 
          screenName: 'Employees', 
          screenPath: '/employees',
          description: 'Çalışan yönetimi'
        } 
      }),
      prisma.screen.create({ 
        data: { 
          screenName: 'Positions', 
          screenPath: '/positions',
          description: 'Pozisyon yönetimi'
        } 
      }),
      prisma.screen.create({ 
        data: { 
          screenName: 'Reports', 
          screenPath: '/reports',
          description: 'Raporlar'
        } 
      }),
      prisma.screen.create({ 
        data: { 
          screenName: 'Admin', 
          screenPath: '/admin',
          description: 'Yönetici paneli'
        } 
      }),
    ])
    console.log('✅ Screens tamamlandı')

    // 4. Roles
    console.log('👥 Roles oluşturuluyor...')
    const roles = await Promise.all([
      prisma.role.create({ 
        data: { 
          roleName: 'Super Admin', 
          description: 'Tüm yetkilere sahip süper yönetici',
          isActive: true
        } 
      }),
      prisma.role.create({ 
        data: { 
          roleName: 'Admin', 
          description: 'Sistem yöneticisi',
          isActive: true
        } 
      }),
      prisma.role.create({ 
        data: { 
          roleName: 'Manager', 
          description: 'Departman yöneticisi',
          isActive: true
        } 
      }),
      prisma.role.create({ 
        data: { 
          roleName: 'Employee', 
          description: 'Normal çalışan',
          isActive: true
        } 
      }),
      prisma.role.create({ 
        data: { 
          roleName: 'Viewer', 
          description: 'Sadece görüntüleme yetkisi',
          isActive: true
        } 
      }),
    ])
    console.log('✅ Roles tamamlandı')

    // 5. RoleScreenPermissions
    console.log('🔗 RoleScreenPermissions oluşturuluyor...')
    const roleScreenPermissions = []
    
    // Super Admin - tüm yetkiler
    for (const screen of screens) {
      for (const permission of permissions) {
        roleScreenPermissions.push(
          prisma.roleScreenPermission.create({
            data: {
              roleId: roles[0].roleId, // Super Admin
              screenId: screen.screenId,
              permissionId: permission.permissionId
            }
          })
        )
      }
    }

    // Admin - Read, Write, Update (Delete hariç)
    for (const screen of screens) {
      for (const permission of permissions.slice(0, 3)) { // Read, Write, Update
        roleScreenPermissions.push(
          prisma.roleScreenPermission.create({
            data: {
              roleId: roles[1].roleId, // Admin
              screenId: screen.screenId,
              permissionId: permission.permissionId
            }
          })
        )
      }
    }

    // Manager - Read, Write (sadece kendi departmanı)
    for (const screen of screens.slice(0, 3)) { // Dashboard, Organization, Employees
      for (const permission of permissions.slice(0, 2)) { // Read, Write
        roleScreenPermissions.push(
          prisma.roleScreenPermission.create({
            data: {
              roleId: roles[2].roleId, // Manager
              screenId: screen.screenId,
              permissionId: permission.permissionId
            }
          })
        )
      }
    }

    // Employee - Read (sadece kendi bilgileri)
    for (const screen of screens.slice(0, 2)) { // Dashboard, Organization
      roleScreenPermissions.push(
        prisma.roleScreenPermission.create({
          data: {
            roleId: roles[3].roleId, // Employee
            screenId: screen.screenId,
            permissionId: permissions[0].permissionId // Read
          }
        })
      )
    }

    // Viewer - Read (tüm ekranlar)
    for (const screen of screens) {
      roleScreenPermissions.push(
        prisma.roleScreenPermission.create({
          data: {
            roleId: roles[4].roleId, // Viewer
            screenId: screen.screenId,
            permissionId: permissions[0].permissionId // Read
          }
        })
      )
    }

    await Promise.all(roleScreenPermissions)
    console.log('✅ RoleScreenPermissions tamamlandı')

    // 6. Users
    console.log('👤 Users oluşturuluyor...')
    const hashedPassword = await bcrypt.hash('password123', 10)
    
    const users = await Promise.all([
      prisma.user.create({
        data: {
          name: 'Super Admin',
          email: 'admin@olka.com',
          password: hashedPassword,
          firstName: 'Super',
          lastName: 'Admin',
          isActive: true
        }
      }),
      prisma.user.create({
        data: {
          name: 'Ahmet Yılmaz',
          email: 'ahmet.yilmaz@olka.com',
          password: hashedPassword,
          firstName: 'Ahmet',
          lastName: 'Yılmaz',
          isActive: true
        }
      }),
      prisma.user.create({
        data: {
          name: 'Ayşe Demir',
          email: 'ayse.demir@marlin.com',
          password: hashedPassword,
          firstName: 'Ayşe',
          lastName: 'Demir',
          isActive: true
        }
      }),
      prisma.user.create({
        data: {
          name: 'Mehmet Kaya',
          email: 'mehmet.kaya@jupiter.com',
          password: hashedPassword,
          firstName: 'Mehmet',
          lastName: 'Kaya',
          isActive: true
        }
      }),
      prisma.user.create({
        data: {
          name: 'Fatma Özkan',
          email: 'fatma.ozkan@neptun.com',
          password: hashedPassword,
          firstName: 'Fatma',
          lastName: 'Özkan',
          isActive: true
        }
      }),
    ])
    console.log('✅ Users tamamlandı')

    // 7. UserRoles
    console.log('🔗 UserRoles oluşturuluyor...')
    const userRoles = await Promise.all([
      // Super Admin - Super Admin rolü
      prisma.userRole.create({
        data: {
          userId: users[0].id,
          roleId: roles[0].roleId // Super Admin
        }
      }),
      // Ahmet Yılmaz - Admin rolü
      prisma.userRole.create({
        data: {
          userId: users[1].id,
          roleId: roles[1].roleId // Admin
        }
      }),
      // Ayşe Demir - Manager rolü
      prisma.userRole.create({
        data: {
          userId: users[2].id,
          roleId: roles[2].roleId // Manager
        }
      }),
      // Mehmet Kaya - Employee rolü
      prisma.userRole.create({
        data: {
          userId: users[3].id,
          roleId: roles[3].roleId // Employee
        }
      }),
      // Fatma Özkan - Viewer rolü
      prisma.userRole.create({
        data: {
          userId: users[4].id,
          roleId: roles[4].roleId // Viewer
        }
      }),
    ])
    console.log('✅ UserRoles tamamlandı')

    // 8. PositionAssignments
    console.log('📋 PositionAssignments oluşturuluyor...')
    const employees = await prisma.employee.findMany()
    const positions = await prisma.position.findMany()
    
    const positionAssignments = await Promise.all([
      prisma.positionAssignment.create({
        data: {
          positionId: positions[0].positionId,
          currAccCode: employees[0].currAccCode,
          startDate: new Date('2024-01-01'),
          endDate: null,
          assignmentType: 'Asaleten'
        }
      }),
      prisma.positionAssignment.create({
        data: {
          positionId: positions[1].positionId,
          currAccCode: employees[1].currAccCode,
          startDate: new Date('2024-02-01'),
          endDate: null,
          assignmentType: 'Asaleten'
        }
      }),
      prisma.positionAssignment.create({
        data: {
          positionId: positions[2].positionId,
          currAccCode: employees[2].currAccCode,
          startDate: new Date('2024-03-01'),
          endDate: null,
          assignmentType: 'Asaleten'
        }
      }),
      prisma.positionAssignment.create({
        data: {
          positionId: positions[3].positionId,
          currAccCode: employees[3].currAccCode,
          startDate: new Date('2024-04-01'),
          endDate: null,
          assignmentType: 'Vekaleten'
        }
      }),
      prisma.positionAssignment.create({
        data: {
          positionId: positions[4].positionId,
          currAccCode: employees[4].currAccCode,
          startDate: new Date('2024-05-01'),
          endDate: null,
          assignmentType: 'Asaleten'
        }
      }),
    ])
    console.log('✅ PositionAssignments tamamlandı')

    console.log('\n🎉 Tüm tablolar başarıyla dolduruldu!')
    console.log('\n📊 Özet:')
    console.log(`- AssignmentTypeLookup: ${assignmentTypes.length} kayıt`)
    console.log(`- Permissions: ${permissions.length} kayıt`)
    console.log(`- Screens: ${screens.length} kayıt`)
    console.log(`- Roles: ${roles.length} kayıt`)
    console.log(`- RoleScreenPermissions: ${roleScreenPermissions.length} kayıt`)
    console.log(`- Users: ${users.length} kayıt`)
    console.log(`- UserRoles: ${userRoles.length} kayıt`)
    console.log(`- PositionAssignments: ${positionAssignments.length} kayıt`)

  } catch (error) {
    console.error('❌ Hata:', error)
  } finally {
    await prisma.$disconnect()
  }
}

seedAllTables()
