import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'

const prisma = new PrismaClient()

function norm(s: string) {
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

  const nameToLevel = new Map<string, string>()
  for (const row of rows) {
    const [firstLastName, locationName, departmentName, positionName, manager, levelName] = row.split(';')
    const name = norm(firstLastName || '')
    const level = norm(levelName || '')
    if (!name) continue
    if (level) nameToLevel.set(name, level)
  }

  const emps = await prisma.employee.findMany({ select: { currAccCode: true, firstLastName: true, levelName: true } })

  let missingInCSV = 0
  let nullInDB = 0
  let mismatches = 0
  const samples: any[] = []

  for (const e of emps) {
    const csvLevel = nameToLevel.get(norm(e.firstLastName))
    if (!csvLevel) { missingInCSV++; continue }
    if (!e.levelName) { nullInDB++; samples.length < 10 && samples.push({ code: e.currAccCode, name: e.firstLastName, db: e.levelName, csv: csvLevel }); continue }
    if (norm(e.levelName) !== csvLevel) {
      mismatches++
      if (samples.length < 10) samples.push({ code: e.currAccCode, name: e.firstLastName, db: e.levelName, csv: csvLevel })
    }
  }

  console.log(`Toplam: ${emps.length}`)
  console.log(`CSV'de Level bulunamayan isim: ${missingInCSV}`)
  console.log(`DB'de levelName NULL: ${nullInDB}`)
  console.log(`Farklı (db vs csv) sayısı: ${mismatches}`)
  console.log('Örnekler:', samples)
}

run().catch((e) => { console.error(e); process.exit(1) }).finally(async () => { await prisma.$disconnect() })
