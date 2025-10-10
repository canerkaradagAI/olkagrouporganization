import { PrismaClient } from '@prisma/client'
import fs from 'fs'
import path from 'path'

const prisma = new PrismaClient()

function parseCsv(filePath: string): any[] {
  const abs = path.resolve(filePath)
  if (!fs.existsSync(abs)) throw new Error(`CSV bulunamadı: ${abs}`)
  let raw = fs.readFileSync(abs, 'utf8')
  // UTF-8 BOM temizle
  if (raw.charCodeAt(0) === 0xfeff) raw = raw.slice(1)
  const rows = raw.split(/\r?\n/).filter(l => l.trim().length > 0)
  if (rows.length === 0) return []
  const headerLine = rows.shift() as string
  // Ayraç tespiti: ; varsa öncelik ver, yoksa ,
  const delimiter = headerLine.includes(';') ? ';' : ','
  let headers = headerLine.split(delimiter).map(h => h.trim())
  // Başlıksız dosya desteği: eğer ilk satır tamamen sayısal/alfasayısal ID ve ad ise
  const headerLooksLikeData = headers.length >= 2 &&
    (/^\d+[A-Za-z0-9-]*$/.test(headers[0]) || /^\d+$/.test(headers[0])) &&
    headers[1].length > 0 && !/[A-Z]/i.test(headers[1])
  if (headerLooksLikeData) {
    // İlk satırı veri olarak geri ekle, varsayılan başlıkları ayarla
    rows.unshift(headerLine)
    headers = ['Id', 'Name']
  }
  const lines = rows
  return lines.map(l => {
    const cols = l.split(delimiter)
    const obj: any = {}
    headers.forEach((h, i) => {
      obj[h] = (cols[i] ?? '').trim()
    })
    return obj
  })
}

async function main() {
  console.log('🧹 Tablolar temizleniyor...')
  await prisma.positionAssignment.deleteMany()
  await prisma.employee.deleteMany()
  await prisma.position.deleteMany()
  await prisma.department.deleteMany()
  await prisma.location.deleteMany()
  await prisma.brand.deleteMany()

  console.log('📥 CSV dosyaları okunuyor...')
  const base = process.cwd()
  const brandCsv = parseCsv(path.join(base, 'data', 'Brand.csv'))
  const deptCsv = parseCsv(path.join(base, 'data', 'Department.csv'))
  const locCsv = parseCsv(path.join(base, 'data', 'Location.csv'))
  const posCsv = parseCsv(path.join(base, 'data', 'Position.csv'))
  const empCsv = parseCsv(path.join(base, 'data', 'Employee.csv'))

  // Company (id:1) garanti et
  const company = await prisma.company.upsert({
    where: { companyName: 'Olka Group' },
    update: {},
    create: { companyName: 'Olka Group' },
  })

  // 1) Brand: CSV Id -> DB Id haritası
  console.log(`🏷️ Brand import (${brandCsv.length})`)
  const brandIdMap = new Map<string, number>() // key: csvId or name -> dbId
  const brandCsvIdToName = new Map<string, string>()
  for (const b of brandCsv) {
    const csvId = (b.BrandId || b.id || b.ID || '').toString().trim()
    const name = (b.BrandName || b.brandName || b.name || '').trim()
    if (!name) continue
    const created = await prisma.brand.create({ data: { brandName: name, companyId: company.companyId } })
    if (csvId) brandIdMap.set(csvId, created.brandId)
    brandIdMap.set(name, created.brandId)
    if (csvId) brandCsvIdToName.set(csvId, name)
  }

  // 2) Department
  console.log(`🏢 Department import (${deptCsv.length})`)
  const deptIdMap = new Map<string, number>()
  const deptCsvIdToName = new Map<string, string>()
  for (const d of deptCsv) {
    const csvId = (d.DepartmentId || d.id || d.ID || '').toString().trim()
    const name = (d.DepartmentName || d.departmentName || d.name || '').trim()
    if (!name) continue
    const created = await prisma.department.create({ data: { departmentName: name } })
    if (csvId) deptIdMap.set(csvId, created.departmentId)
    deptIdMap.set(name, created.departmentId)
    if (csvId) deptCsvIdToName.set(csvId, name)
  }

  // 3) Location
  console.log(`📍 Location import (${locCsv.length})`)
  const locIdMap = new Map<string, number>()
  const locCsvIdToName = new Map<string, string>()
  const seenLoc = new Set<string>()
  for (const l of locCsv) {
    const csvId = (l.LocationId || l.id || l.ID || '').toString().trim()
    const name = (l.LocationName || l.locationName || l.name || '').trim()
    if (!name || seenLoc.has(name)) continue
    const created = await prisma.location.create({ data: { locationName: name } })
    seenLoc.add(name)
    if (csvId) locIdMap.set(csvId, created.locationId)
    locIdMap.set(name, created.locationId)
    if (csvId) locCsvIdToName.set(csvId, name)
  }

  // 4) Position
  console.log(`💼 Position import (${posCsv.length})`)
  const posIdMap = new Map<string, number>()
  for (const p of posCsv) {
    const csvId = (p.PositionId || p.id || p.ID || '').toString().trim()
    const positionName = (p.PositionName || p.positionName || p.name || '').trim()
    if (!positionName) continue
    const depKey = (p.DepartmentId || p.DepartmentName || '').toString().trim()
    const locKey = (p.LocationId || p.LocationName || '').toString().trim()
    const brandKey = (p.BrandId || p.BrandName || '').toString().trim()

    // Department resolve: id->name->db or name->db
    let depName = deptCsvIdToName.get(depKey) || (p.DepartmentName || '').toString().trim()
    let departmentId = depName ? deptIdMap.get(depName) : deptIdMap.get(depKey)
    if (!departmentId) {
      // Eksikse oluştur
      depName = depName || depKey || 'Bilinmeyen Departman'
      const created = await prisma.department.create({ data: { departmentName: depName } })
      departmentId = created.departmentId
      deptIdMap.set(depName, departmentId)
    }

    // Location resolve
    let locName = locCsvIdToName.get(locKey) || (p.LocationName || '').toString().trim()
    let locationId = locName ? locIdMap.get(locName) : locIdMap.get(locKey)
    if (!locationId) {
      // Eksikse oluştur
      locName = locName || locKey || 'Bilinmeyen Lokasyon'
      const created = await prisma.location.create({ data: { locationName: locName } })
      locationId = created.locationId
      locIdMap.set(locName, locationId)
    }

    // Brand resolve
    let brandName = brandCsvIdToName.get(brandKey) || (p.BrandName || '').toString().trim()
    let brandId = brandName ? brandIdMap.get(brandName) : brandIdMap.get(brandKey)
    if (!brandId) {
      brandName = brandName || brandKey || 'Genel'
      const created = await prisma.brand.create({ data: { brandName, companyId: company.companyId } })
      brandId = created.brandId
      brandIdMap.set(brandName, brandId)
    }
    const created = await prisma.position.create({
      data: { 
        positionName,
        departmentId: departmentId
      }
    })
    if (csvId) posIdMap.set(csvId, created.positionId)
    posIdMap.set(positionName, created.positionId)
  }

  // 5) Employee (iki aşama: önce managersız ekle, sonra managerId güncelle)
  console.log(`👥 Employee import (${empCsv.length})`)
  const pendingManagers: Array<{ currAccCode: string; managerId: string } > = []
  for (const e of empCsv) {
    const currAccCode = (e.currAccCode || e.CurrAccCode || e.EmployeeCode || e.Id || e.ID || e.CurrAcc || '').toString().trim()
    const firstLastName = (e.firstLastName || e.FirstLastName || e.Name || e.NameSurname || '').trim()
    if (!currAccCode || !firstLastName) continue

    const brandId = brandIdMap.get((e.BrandId || e.BrandName || '').toString().trim())
      ?? brandIdMap.get((e.BrandName || '').toString().trim())
    const locationId = locIdMap.get((e.LocationId || e.LocationName || '').toString().trim())
      ?? locIdMap.get((e.LocationName || '').toString().trim())
    const positionId = posIdMap.get((e.PositionId || e.PositionName || '').toString().trim())
      ?? posIdMap.get((e.PositionName || '').toString().trim())
    const managerId = (e.ManagerId || e.managerId || '').toString().trim()
    const levelName = (e.LevelName || e.levelName || '').toString().trim() || null
    
    // Position'dan DepartmentId al
    let employeeDepartmentId = null
    if (positionId) {
      const position = await prisma.position.findUnique({
        where: { positionId: positionId },
        select: { departmentId: true }
      })
      employeeDepartmentId = position?.departmentId || null
    }

    await prisma.employee.create({
      data: {
        currAccCode,
        firstLastName,
        organization: 'Olka Group',
        brandId: brandId ?? undefined,
        locationId: locationId ?? undefined,
        positionId: positionId ?? undefined,
        departmentId: employeeDepartmentId,
        managerId: null,
        levelName: levelName,
        isManager: (String(e.IsManager || e.isManager || '').toLowerCase() === 'true') || false,
      }
    })
    if (managerId) pendingManagers.push({ currAccCode, managerId })
  }

  // ManagerId güncelle
  let updatedManagers = 0
  for (const m of pendingManagers) {
    try {
      await prisma.employee.update({ where: { currAccCode: m.currAccCode }, data: { managerId: m.managerId } })
      updatedManagers++
    } catch {}
  }
  console.log(`🔗 ManagerId güncellendi: ${updatedManagers}/${pendingManagers.length}`)

  console.log('🎉 İçe aktarma tamamlandı!')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(async () => { await prisma.$disconnect() })


