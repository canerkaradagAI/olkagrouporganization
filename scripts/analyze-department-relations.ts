import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function analyzeDepartmentRelations() {
  console.log('🔍 Departman-C Level ilişkileri analiz ediliyor...\n')

  // C Level ve Genel Müdürleri al
  const cLevelEmployees = await prisma.employee.findMany({
    where: {
      levelName: {
        in: ['Genel Müdür', 'C Level']
      }
    },
    include: {
      department: true,
      subordinates: {
        include: {
          department: true
        }
      }
    }
  })

  console.log('📊 C Level & Genel Müdürler:')
  for (const employee of cLevelEmployees) {
    console.log(`\n👤 ${employee.firstLastName} (${employee.levelName})`)
    console.log(`   Departman: ${employee.department?.departmentName || 'Yok'}`)
    
    // Alt çalışanlarının departmanlarını topla
    const subordinateDepartments = new Set<string>()
    employee.subordinates.forEach(sub => {
      if (sub.department) {
        subordinateDepartments.add(sub.department.departmentName)
      }
    })
    
    console.log(`   Alt Departmanlar (${subordinateDepartments.size}):`)
    subordinateDepartments.forEach(dept => {
      console.log(`     - ${dept}`)
    })
  }

  // Tüm departmanları ve bağlı çalışanları al
  const allDepartments = await prisma.department.findMany({
    include: {
      employees: {
        include: {
          manager: true
        }
      }
    }
  })

  console.log('\n🏢 Departman Analizi:')
  for (const dept of allDepartments) {
    console.log(`\n📁 ${dept.departmentName}`)
    
    // Bu departmandaki C Level çalışanları bul
    const cLevelInDept = dept.employees.filter(emp => 
      emp.levelName === 'C Level' || emp.levelName === 'Genel Müdür'
    )
    
    if (cLevelInDept.length > 0) {
      console.log(`   C Level Yöneticiler:`)
      cLevelInDept.forEach(emp => {
        console.log(`     - ${emp.firstLastName} (${emp.levelName})`)
      })
    } else {
      // Bu departmandaki çalışanların yöneticilerini kontrol et
      const managers = new Set<string>()
      dept.employees.forEach(emp => {
        if (emp.manager && (emp.manager.levelName === 'C Level' || emp.manager.levelName === 'Genel Müdür')) {
          managers.add(`${emp.manager.firstLastName} (${emp.manager.levelName})`)
        }
      })
      
      if (managers.size > 0) {
        console.log(`   Bağlı C Level Yöneticiler:`)
        managers.forEach(manager => {
          console.log(`     - ${manager}`)
        })
      } else {
        console.log(`   ⚠️ C Level bağlantısı bulunamadı`)
      }
    }
  }

  await prisma.$disconnect()
}

analyzeDepartmentRelations().catch(async (e) => {
  console.error(e)
  await prisma.$disconnect()
  process.exit(1)
})
