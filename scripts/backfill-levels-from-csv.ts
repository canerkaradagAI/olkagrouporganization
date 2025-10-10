import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'

const prisma = new PrismaClient()

function normalize(s: string | undefined | null) {
  return (s || '').trim().replace(/\s+/g, ' ')
}

function mapLevelToGroup(levelRaw: string | undefined | null): string | null {
  const t = normalize(levelRaw).toLowerCase()
  if (!t) return null
  // Sözlük
  if (t === 'yönetim kurulu' || t === 'yönetim kurulu başkanı') return 'YK'
  if (t === 'genel müdür' || t === 'ceo' || t === 'c level' || ['coo','cfo','cto','cmo','chro','cio'].includes(t)) return 'C Level'
  if (t === 'direktör') return 'Direktör'
  if (t === 'kıdemli müdür') return 'Müdür'
  if (t === 'müdür') return 'Müdür'
  if (t === 'müdür yardımcısı') return 'Yönetici'
  if (t === 'yönetici' || t === 'kıdemli yönetici' || t === 'takım lideri') return 'Yönetici'
  if (['kıdemli uzman','uzman','uzman yardımcısı','asistan','destek','stajyer','mavi yaka','uzman danışman','danışman'].includes(t)) return 'Uzman'
  // Varsayılan: Uzman
  return 'Uzman'
}

async function run() {
  const csvPath = path.join(process.cwd(), 'Olka Organizasyon.csv')
  if (!fs.existsSync(csvPath)) {
    console.error('CSV dosyası bulunamadı:', csvPath)
    process.exit(1)
  }

  const content = fs.readFileSync(csvPath, 'utf-8')
  const rows = content.split('\n').filter((l) => l.trim().length > 0)
  const body = rows.slice(1)

  type Row = { name: string; level: string }
  const entries: Row[] = []
  for (const row of body) {
    const parts = row.split(';')
    const name = normalize(parts[0])
    const level = normalize(parts[5])
    if (!name) continue
    entries.push({ name, level })
  }

  const nameToGroup = new Map<string, string>()
  for (const e of entries) {
    const grp = mapLevelToGroup(e.level)
    if (grp) nameToGroup.set(e.name, grp)
  }

  const all = await prisma.employee.findMany({ select: { currAccCode: true, firstLastName: true, levelName: true } })
  let updated = 0
  let missing = 0

  for (const emp of all) {
    const grp = nameToGroup.get(normalize(emp.firstLastName))
    if (!grp) { missing++; continue }
    if (emp.levelName === grp) continue
    await prisma.employee.update({ where: { currAccCode: emp.currAccCode }, data: { levelName: grp } })
    updated++
  }

  console.log(`Güncellendi (levelName=Grup): ${updated}, CSV’de bulunamayan: ${missing}, Toplam: ${all.length}`)
}

run()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(async () => { await prisma.$disconnect() })
