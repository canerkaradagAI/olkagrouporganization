import { PrismaClient } from '@prisma/client'
import XLSX from 'xlsx'
import path from 'path'

const prisma = new PrismaClient()

function sheetToJson(wb: XLSX.WorkBook, name: string) {
  const ws = wb.Sheets[name]
  if (!ws) return []
  return XLSX.utils.sheet_to_json(ws, { defval: '' }) as any[]
}

async function main() {
  const file = path.join(process.cwd(), 'Kitap1.xlsx')
  const wb = XLSX.readFile(file)
  const sheets = wb.SheetNames
  console.log('📄 Sayfalar:', sheets.join(', '))

  // Esnek mod: Eğer adlandırılmış sayfalar yoksa, "Sayfa1" içindeki veriyi tek seferde okuyup
  // markaları/departmanları/lokasyonları/pozisyonları/çalışanları ayıklayacağız
  const brandRows = sheetToJson(wb, 'Brand')
  const deptRows = sheetToJson(wb, 'Department')
  const locRows = sheetToJson(wb, 'Location')
  const posRows = sheetToJson(wb, 'Position')
  const empRows = sheetToJson(wb, 'Employee')
  const sayfa1 = sheetToJson(wb, 'Sayfa1')

  console.log('🧹 Temizleniyor...')
  await prisma.positionAssignment.deleteMany()
  await prisma.employee.deleteMany()
  await prisma.position.deleteMany()
  await prisma.department.deleteMany()
  await prisma.location.deleteMany()
  await prisma.brand.deleteMany()

  const company = await prisma.company.upsert({
    where: { companyName: 'Olka Group' }, update: {}, create: { companyName: 'Olka Group' }
  })

  const brandIdMap = new Map<string, number>()
  const brandBuffer: Array<{ id?: string; name: string }> = []
  for (const b of brandRows) {
    const id = String(b.BrandId || b.Id || '').trim()
    const name = String(b.BrandName || b.Name || '').trim()
    if (!name) continue
    brandBuffer.push({ id, name })
  }
  // Sayfa1'den de marka çıkar
  for (const r of sayfa1) {
    const name = String(r.BrandName || r.Brand || r.Markalar || '').trim()
    const id = String(r.BrandId || r.BrandID || '').trim()
    if (name) brandBuffer.push({ id: id || undefined, name })
  }
  // distinct
  const seenBrand = new Set<string>()
  for (const b of brandBuffer) {
    if (seenBrand.has(b.name)) continue
    const created = await prisma.brand.create({ data: { brandName: b.name, companyId: company.companyId } })
    if (b.id) brandIdMap.set(b.id, created.brandId)
    brandIdMap.set(b.name, created.brandId)
    seenBrand.add(b.name)
  }

  const deptIdMap = new Map<string, number>()
  const deptBuffer: Array<{ id?: string; name: string }> = []
  for (const d of deptRows) {
    const id = String(d.DepartmentId || d.Id || '').trim()
    const name = String(d.DepartmentName || d.Name || '').trim()
    if (!name) continue
    deptBuffer.push({ id, name })
  }
  for (const r of sayfa1) {
    const id = String(r.DepartmentId || r.DepId || '').trim()
    const name = String(r.DepartmentName || r.Department || r.Departman || '').trim()
    if (name) deptBuffer.push({ id: id || undefined, name })
  }
  const seenDept = new Set<string>()
  for (const d of deptBuffer) {
    if (seenDept.has(d.name)) continue
    const created = await prisma.department.create({ data: { departmentName: d.name } })
    if (d.id) deptIdMap.set(d.id, created.departmentId)
    deptIdMap.set(d.name, created.departmentId)
    seenDept.add(d.name)
  }

  const locIdMap = new Map<string, number>()
  const seenLoc = new Set<string>()
  const locBuffer: Array<{ id?: string; name: string }> = []
  for (const l of locRows) {
    const id = String(l.LocationId || l.Id || '').trim()
    const name = String(l.LocationName || l.Name || '').trim()
    if (!name || seenLoc.has(name)) continue
    locBuffer.push({ id, name })
  }
  for (const r of sayfa1) {
    const id = String(r.LocationId || r.LocId || '').trim()
    const name = String(r.LocationName || r.Location || r.Lokasyon || '').trim()
    if (name) locBuffer.push({ id: id || undefined, name })
  }
  for (const l of locBuffer) {
    if (seenLoc.has(l.name)) continue
    const created = await prisma.location.create({ data: { locationName: l.name } })
    seenLoc.add(l.name)
    if (l.id) locIdMap.set(l.id, created.locationId)
    locIdMap.set(l.name, created.locationId)
  }

  const posIdMap = new Map<string, number>()
  const posBuffer: Array<{id?: string; name: string; depKey?: string; locKey?: string; brandKey?: string; levelKey?: string; levelName?: string}> = []
  // Level hazırlığı: sayfalardan topla
  const levelKeySet = new Map<string, string>() // key -> levelName
  for (const r of posRows) {
    const k = String(r.LevelId || r.Level || '').trim()
    const n = String(r.LevelName || r.Level || '').trim()
    if (k || n) levelKeySet.set(k || n, n || k)
  }
  for (const r of sayfa1) {
    const k = String(r.LevelId || r.Level || '').trim()
    const n = String(r.LevelName || r.Level || '').trim()
    if (k || n) levelKeySet.set(k || n, n || k)
  }
  // JobTitleLevel tabloyu doldur
  const levelDbMap = new Map<string, number>() // key/name -> db id
  const levelIdToName = new Map<number, string>()
  let order = 1
  for (const [k, n] of levelKeySet.entries()) {
    const levelName = n || k
    if (!levelName) continue
    const created = await prisma.jobTitleLevel.upsert({
      where: { levelName },
      update: {},
      create: { levelName, levelOrder: order++, description: '' }
    })
    levelDbMap.set(k, created.levelId)
    levelDbMap.set(levelName, created.levelId)
    levelIdToName.set(created.levelId, created.levelName)
  }
  for (const p of posRows) {
    const id = String(p.PositionId || p.Id || '').trim()
    const name = String(p.PositionName || p.Name || '').trim()
    if (!name) continue
    const depKey = String(p.DepartmentId || p.DepartmentName || '').trim()
    const locKey = String(p.LocationId || p.LocationName || '').trim()
    const brandKey = String(p.BrandId || p.BrandName || '').trim()
    const levelKey = String(p.LevelId || p.Level || '').trim()
    const levelName = String(p.LevelName || '').trim()
    posBuffer.push({ id, name, depKey, locKey, brandKey, levelKey, levelName })
  }
  for (const r of sayfa1) {
    const id = String(r.PositionId || r.PosId || '').trim()
    const name = String(r.PositionName || r.Position || r.Pozisyon || '').trim()
    if (!name) continue
    const depKey = String(r.DepartmentId || r.Department || r.DepartmentName || '').trim()
    const locKey = String(r.LocationId || r.Location || r.LocationName || '').trim()
    const brandKey = String(r.BrandId || r.Brand || r.BrandName || '').trim()
    const levelKey = String(r.LevelId || r.Level || '').trim()
    const levelName = String(r.LevelName || '').trim()
    posBuffer.push({ id: id || undefined, name, depKey, locKey, brandKey, levelKey, levelName })
  }
  const posLevelNameMap = new Map<number, string>() // positionId -> levelName
  for (const p of posBuffer) {
    const depId = deptIdMap.get(p.depKey || '') || deptIdMap.get(String(p.depKey || '').trim())
      || (await prisma.department.create({ data: { departmentName: (String(p.depKey || 'Genel')) } })).departmentId
    const locId = locIdMap.get(p.locKey || '') || locIdMap.get(String(p.locKey || '').trim())
      || (await prisma.location.create({ data: { locationName: (String(p.locKey || 'Merkez')) } })).locationId
    const brId = brandIdMap.get(p.brandKey || '') || brandIdMap.get(String(p.brandKey || '').trim())
      || (await prisma.brand.create({ data: { brandName: (String(p.brandKey || 'Genel')), companyId: company.companyId } })).brandId
    const lvlId = levelDbMap.get(p.levelKey || '') || levelDbMap.get(String(p.levelName || '').trim()) || undefined
    const created = await prisma.position.create({ data: { positionName: p.name, departmentId: depId } })
    if (p.id) posIdMap.set(p.id, created.positionId)
    posIdMap.set(p.name, created.positionId)
  }

  // Employees (2 aşama)
  const pending: Array<{ code: string; managerId: string }> = []
  const allEmpRows = empRows.length ? empRows : sayfa1
  for (const e of allEmpRows) {
    const code = String(e.CurrAccCode || e.Id || e.ID || e.CurrAcc || '').trim()
    const name = String(e.NameSurname || e.FirstLastName || e.Name || '').trim()
    if (!code || !name) continue
    const brandId = brandIdMap.get(String(e.BrandId || e.BrandName || '').trim()) || undefined
    const locationId = locIdMap.get(String(e.LocationId || e.LocationName || '').trim()) || undefined
    const positionId = posIdMap.get(String(e.PositionId || e.PositionName || '').trim()) || undefined

    const empLevelName = String(e.LevelName || '').trim() || (positionId ? (posLevelNameMap.get(positionId) || '') : '')
    await prisma.employee.create({
      data: {
        currAccCode: code,
        firstLastName: name,
        organization: 'Olka Group',
        brandId, locationId, positionId,
        levelName: empLevelName || null,
        isManager: String(e.IsManager || '').toLowerCase() === 'true',
        isBlocked: String(e.IsBlocked || '').toLowerCase() === 'true'
      }
    })
    const mgr = String(e.ManagerId || '').trim()
    if (mgr) pending.push({ code, managerId: mgr })
  }

  let upd = 0
  for (const m of pending) {
    try { await prisma.employee.update({ where: { currAccCode: m.code }, data: { managerId: m.managerId } }); upd++ } catch {}
  }
  console.log(`🔗 ManagerId güncellendi: ${upd}/${pending.length}`)

  console.log('🎉 Excel import tamam')
}

main().catch(console.error).finally(async () => { await prisma.$disconnect() })


