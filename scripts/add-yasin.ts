import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('➕ Yasin Kavşak ekleniyor...')

  // Company
  const company = await prisma.company.upsert({
    where: { companyName: 'Olka Group' },
    update: {},
    create: { companyName: 'Olka Group' },
  })

  // Brand (Olka)
  const brand = await prisma.brand.upsert({
    where: { brandName: 'Olka' },
    update: { companyId: company.companyId },
    create: { brandName: 'Olka', companyId: company.companyId },
  })

  // Department (Yönetim)
  const department = await prisma.department.upsert({
    where: { departmentName: 'Yönetim' },
    update: {},
    create: { departmentName: 'Yönetim' },
  })

  // Location (MERKEZ)
  const location = await prisma.location.upsert({
    where: { locationName: 'MERKEZ' },
    update: {},
    create: { locationName: 'MERKEZ' },
  })

  // Level (Yönetim Kurulu)
  // Level order eşsiz; mevcut en büyük order'ı bulup +1 ile ekle
  const existingLevel = await prisma.jobTitleLevel.findUnique({ where: { levelName: 'Yönetim Kurulu' } })
  const level = existingLevel || await prisma.jobTitleLevel.create({
    data: {
      levelName: 'Yönetim Kurulu',
      levelOrder: ((await prisma.jobTitleLevel.findMany({ orderBy: { levelOrder: 'desc' }, take: 1 }))?.[0]?.levelOrder || 0) + 1,
      description: ''
    }
  })

  // Position (Yönetim Kurulu Başkanı)
  const position = await prisma.position.upsert({
    where: { positionId: 0 }, // upsert by composite field not available; fallback manual
    update: {},
    create: {
      positionName: 'Yönetim Kurulu Başkanı',
      departmentId: department.departmentId,
    },
  }).catch(async () => {
    // If upsert fails due to where, try find by unique-ish combination
    const existing = await prisma.position.findFirst({
      where: {
        positionName: 'Yönetim Kurulu Başkanı',
        departmentId: department.departmentId,
      },
    })
    if (existing) return existing
    return prisma.position.create({
      data: {
        positionName: 'Yönetim Kurulu Başkanı',
        departmentId: department.departmentId,
      },
    })
  })

  // Employee (Yasin Kavşak, CurrAccCode=1)
  await prisma.employee.upsert({
    where: { currAccCode: '1' },
    update: {
      firstLastName: 'Yasin Kavşak',
      organization: 'Olka Group',
      isManager: true,
      isBlocked: false,
      managerId: null,
      brandId: brand.brandId,
      locationId: location.locationId,
      positionId: position.positionId,
      levelName: 'Yönetim Kurulu',
    },
    create: {
      currAccCode: '1',
      firstLastName: 'Yasin Kavşak',
      organization: 'Olka Group',
      isManager: true,
      isBlocked: false,
      managerId: null,
      brandId: brand.brandId,
      locationId: location.locationId,
      positionId: position.positionId,
      levelName: 'Yönetim Kurulu',
    },
  })

  console.log('✅ Yasin Kavşak eklendi')
}

main().catch(console.error).finally(async () => { await prisma.$disconnect() })


