import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'

const prisma = new PrismaClient()

function norm(s: string | undefined | null) {
  return (s || '').trim().replace(/\s+/g, ' ')
}

async function run() {
  const csvPath = path.join(process.cwd(), 'Olka Organizasyon.csv')
  if (!fs.existsSync(csvPath)) {
    console.error('CSV dosyası yok:', csvPath)
    process.exit(1)
  }
  const content = fs.readFileSync(csvPath, 'utf-8')
  const lines = content.split('\n').filter(l => l.trim().length > 0)
  const rows = lines.slice(1)

  // CSV kolonları: FirstLastName;LocationName;DepartmentName;PositionName;Level;Manager
  const nameToLevel = new Map<string, string>()
  for (const row of rows) {
    const parts = row.split(';')
    const name = norm(parts[0])
    const level = norm(parts[4])
    if (!name) continue
    if (level) nameToLevel.set(name, level)
  }

  const emps = await prisma.employee.findMany({ select: { currAccCode: true, firstLastName: true } })
  let updated = 0, missing = 0
  for (const e of emps) {
    const level = nameToLevel.get(norm(e.firstLastName))
    if (!level) { missing++; continue }
    await prisma.employee.update({ where: { currAccCode: e.currAccCode }, data: { levelName: level } })
    updated++
  }
  console.log(`Güncellendi: ${updated}, CSV'de bulunamayan: ${missing}, Toplam: ${emps.length}`)
}

run().catch(err => { console.error(err); process.exit(1) }).finally(async () => { await prisma.$disconnect() })
