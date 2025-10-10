import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkDepartment47() {
  console.log('🔍 DepartmentId 47 olan kayıtlar kontrol ediliyor...')
  
  // Önce department 47'nin adını öğrenelim
  const department = await prisma.department.findUnique({
    where: { departmentId: 47 }
  })
  
  if (department) {
    console.log(`📁 Departman: ${department.departmentName}`)
  }
  
  // DepartmentId 47 olan çalışanları getir
  const employees = await prisma.employee.findMany({
    where: { departmentId: 47 },
    include: { 
      manager: true,
      position: true 
    },
    orderBy: { firstLastName: 'asc' }
  })
  
  console.log(`\n👥 Bu departmanda ${employees.length} çalışan var:\n`)
  
  employees.forEach(emp => {
    console.log(`- ${emp.firstLastName} (${emp.position?.positionName})`)
    console.log(`  ManagerId: ${emp.managerId}`)
    console.log(`  Yönetici: ${emp.manager?.firstLastName || 'Yok'}`)
    console.log(`  Seviye: ${emp.levelName}`)
    console.log('')
  })
  
  await prisma.$disconnect()
}

checkDepartment47().catch(console.error)
