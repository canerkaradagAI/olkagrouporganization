import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkNewTables() {
  try {
    console.log('🔍 Yeni eklenen tablolar kontrol ediliyor...\n')

    // AssignmentTypeLookup
    const assignmentTypes = await prisma.assignmentTypeLookup.findMany()
    console.log('📋 AssignmentTypeLookup:')
    assignmentTypes.forEach(type => {
      console.log(`  - ${type.assignmentTypeId}: ${type.assignmentTypeName}`)
    })

    // Permissions
    const permissions = await prisma.permission.findMany()
    console.log('\n🔐 Permissions:')
    permissions.forEach(perm => {
      console.log(`  - ${perm.permissionId}: ${perm.permissionName}`)
    })

    // Screens
    const screens = await prisma.screen.findMany()
    console.log('\n🖥️ Screens:')
    screens.forEach(screen => {
      console.log(`  - ${screen.screenId}: ${screen.screenName} (${screen.screenPath})`)
    })

    // Roles
    const roles = await prisma.role.findMany()
    console.log('\n👥 Roles:')
    roles.forEach(role => {
      console.log(`  - ${role.roleId}: ${role.roleName} - ${role.description}`)
    })

    // Users
    const users = await prisma.user.findMany()
    console.log('\n👤 Users:')
    users.forEach(user => {
      console.log(`  - ${user.id}: ${user.name} (${user.email})`)
    })

    // UserRoles
    const userRoles = await prisma.userRole.findMany({
      include: {
        user: true,
        role: true
      }
    })
    console.log('\n🔗 UserRoles:')
    userRoles.forEach(userRole => {
      console.log(`  - ${userRole.user.name} → ${userRole.role.roleName}`)
    })

    // PositionAssignments
    const positionAssignments = await prisma.positionAssignment.findMany({
      include: {
        employee: true,
        position: true,
        assignmentTypeLookup: true
      }
    })
    console.log('\n📋 PositionAssignments:')
    positionAssignments.forEach(assignment => {
      console.log(`  - ${assignment.employee.firstLastName} → ${assignment.position.positionName} (${assignment.assignmentTypeLookup.assignmentTypeName})`)
    })

    // RoleScreenPermissions sayısı
    const roleScreenPermissionCount = await prisma.roleScreenPermission.count()
    console.log(`\n🔗 RoleScreenPermissions: ${roleScreenPermissionCount} kayıt`)

    console.log('\n✅ Tüm yeni tablolar kontrol edildi!')
  } catch (error) {
    console.error('❌ Hata:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkNewTables()
