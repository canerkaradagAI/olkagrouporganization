import type { NextApiRequest, NextApiResponse } from 'next'
import { PrismaClient } from '@prisma/client'
import formidable from 'formidable'
import * as XLSX from 'xlsx'
import fs from 'fs'

const prisma = new PrismaClient()

export const config = {
  api: {
    bodyParser: false,
  },
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  const form = formidable({ multiples: false })

  try {
    const [fields, files] = await form.parse(req)
    
    const file = files.file?.[0]
    const selectedTable = fields.table?.[0] as string || 'employee'

    if (!file) {
      return res.status(400).json({ message: 'Dosya bulunamadı' })
    }

    console.log('📊 Excel import başlıyor...')
    console.log('Selected table:', selectedTable)
    console.log('File path:', file.filepath)

    const filePath = file.filepath
    const workbook = XLSX.readFile(filePath)
    const sheetName = workbook.SheetNames[0]
    const sheet = workbook.Sheets[sheetName]
    const data: any[] = XLSX.utils.sheet_to_json(sheet)

    console.log(`📊 Excel dosyası okundu: ${data.length} satır`)

    // Import data
    let importedCount = 0
    const errors: string[] = []
    
    if (selectedTable === 'company') {
      console.log('🏢 Company import başlıyor...')
      for (const row of data) {
        const companyName = (row.CompanyName || row.companyName || '').toString().trim()
        if (companyName) {
          await prisma.company.create({ data: { companyName } })
          importedCount++
        }
      }
    } else if (selectedTable === 'brand') {
      console.log('🏢 Brand import başlıyor...')
      const company = await prisma.company.upsert({
        where: { companyName: 'Olka Group' },
        update: {},
        create: { companyName: 'Olka Group' },
      })
      for (const row of data) {
        const brandName = (row.BrandName || row.brandName || '').toString().trim()
        if (brandName) {
          await prisma.brand.create({ data: { brandName, companyId: company.companyId } })
          importedCount++
        }
      }
    } else if (selectedTable === 'location') {
      console.log('📍 Location import başlıyor...')
      for (const row of data) {
        const locationName = (row.LocationName || row.locationName || '').toString().trim()
        if (locationName) {
          await prisma.location.create({ data: { locationName } })
          importedCount++
        }
      }
    } else if (selectedTable === 'department') {
      console.log('🏢 Department import başlıyor...')
      for (const row of data) {
        const departmentName = (row.DepartmentName || row.departmentName || '').toString().trim()
        if (departmentName) {
          await prisma.department.create({ data: { departmentName } })
          importedCount++
        }
      }
    } else if (selectedTable === 'position') {
      console.log('💼 Position import başlıyor...')
      for (const row of data) {
        const positionName = (row.PositionName || row.positionName || '').toString().trim()
        if (positionName) {
          await prisma.position.create({ data: { positionName } })
          importedCount++
        }
      }
    } else if (selectedTable === 'jobtitlelevel') {
      console.log('📊 JobTitleLevel import başlıyor...')
      for (const row of data) {
        const levelName = (row.LevelName || row.levelName || '').toString().trim()
        const levelOrder = parseInt(row.LevelOrder || row.levelOrder || '0')
        const description = (row.Description || row.description || '').toString().trim()
        if (levelName) {
          await prisma.jobTitleLevel.create({
            data: {
              levelName,
              levelOrder: levelOrder > 0 ? levelOrder : undefined,
              description: description || `${levelName} seviyesi`
            }
          })
          importedCount++
        }
      }
    } else if (selectedTable === 'employee') {
      console.log('👥 Employee import başlıyor...')
      
      // Unique değerleri topla
      const uniqueBrands = new Map<string, number>()
      const uniqueLocations = new Map<string, number>()
      const uniqueDepartments = new Map<string, number>()
      const uniquePositions = new Map<string, number>()
      const uniqueLevels = new Map<string, number>()
      
      let brandCounter = 1
      let locationCounter = 1
      let departmentCounter = 1
      let positionCounter = 1
      let levelCounter = 1

      // İlk geçiş: Unique değerleri topla
      console.log('📊 Unique değerler toplanıyor...')
      for (const row of data) {
        const brandName = (row.BrandName || row.brandName || '').toString().trim()
        const locationName = (row.LocationName || row.locationName || '').toString().trim()
        const departmentName = (row.DepartmentName || row.departmentName || '').toString().trim()
        const positionName = (row.PositionName || row.positionName || '').toString().trim()
        const levelName = (row.LevelName || row.levelName || '').toString().trim()

        if (brandName && !uniqueBrands.has(brandName)) {
          uniqueBrands.set(brandName, brandCounter++)
        }
        if (locationName && !uniqueLocations.has(locationName)) {
          uniqueLocations.set(locationName, locationCounter++)
        }
        if (departmentName && !uniqueDepartments.has(departmentName)) {
          uniqueDepartments.set(departmentName, departmentCounter++)
        }
        if (positionName && !uniquePositions.has(positionName)) {
          uniquePositions.set(positionName, positionCounter++)
        }
        if (levelName && !uniqueLevels.has(levelName)) {
          uniqueLevels.set(levelName, levelCounter++)
        }
      }

      // Company oluştur
      const company = await prisma.company.upsert({
        where: { companyName: 'Olka Group' },
        update: {},
        create: { companyName: 'Olka Group' },
      })

      // Brand'leri oluştur
      console.log('🏢 Brand\'ler oluşturuluyor...')
      const brandIdMap = new Map<string, number>()
      for (const [brandName, id] of uniqueBrands) {
        const brand = await prisma.brand.upsert({
          where: { brandName: brandName },
          update: { companyId: company.companyId },
          create: {
            brandName: brandName,
            companyId: company.companyId
          }
        })
        brandIdMap.set(brandName, brand.brandId)
      }

      // Location'ları oluştur
      console.log('📍 Location\'lar oluşturuluyor...')
      const locationIdMap = new Map<string, number>()
      for (const [locationName, id] of uniqueLocations) {
        const location = await prisma.location.upsert({
          where: { locationName: locationName },
          update: {},
          create: { locationName: locationName }
        })
        locationIdMap.set(locationName, location.locationId)
      }

      // Department'leri oluştur
      console.log('🏢 Department\'ler oluşturuluyor...')
      const departmentIdMap = new Map<string, number>()
      for (const [departmentName, id] of uniqueDepartments) {
        const department = await prisma.department.upsert({
          where: { departmentName: departmentName },
          update: {},
          create: { departmentName: departmentName }
        })
        departmentIdMap.set(departmentName, department.departmentId)
      }

      // JobTitleLevel'leri oluştur
      console.log('📊 JobTitleLevel\'ler oluşturuluyor...')
      const levelIdMap = new Map<string, number>()
      for (const [levelName, id] of uniqueLevels) {
        const level = await prisma.jobTitleLevel.upsert({
          where: { levelName: levelName },
          update: {},
          create: {
            levelName: levelName,
            levelOrder: id,
            description: `${levelName} seviyesi`
          }
        })
        levelIdMap.set(levelName, level.levelId)
      }

      // Position'ları oluştur
      console.log('💼 Position\'lar oluşturuluyor...')
      const positionIdMap = new Map<string, number>()
      for (const [positionName, id] of uniquePositions) {
        // Önce mevcut position'ı kontrol et
        let position = await prisma.position.findFirst({
          where: { positionName: positionName }
        })
        
        // Yoksa oluştur
        if (!position) {
          position = await prisma.position.create({
            data: {
              positionName: positionName,
            }
          })
        }
        
        positionIdMap.set(positionName, position.positionId)
      }

      // Employee'leri oluştur - İlk aşama: ManagerId olmadan
      console.log('👥 Employee\'ler oluşturuluyor (1. aşama - ManagerId olmadan)...')
      console.log(`📊 Toplam ${data.length} satır işlenecek`)
      
      for (const row of data) {
        try {
          const currAccCode = (row.CurrAccCode || row.currAccCode || '').toString().trim()
          const nameSurname = (row.NameSurname || row.nameSurname || '').toString().trim()
          const brandName = (row.BrandName || row.brandName || '').toString().trim()
          const locationName = (row.LocationName || row.locationName || '').toString().trim()
          const departmentName = (row.DepartmentName || row.departmentName || '').toString().trim()
          const positionName = (row.PositionName || row.positionName || '').toString().trim()
          const managerId = (row.ManagerId || row.managerId || '').toString().trim() || null
          const levelName = (row.LevelName || row.levelName || '').toString().trim() || null
          const isManager = String(row.IsManager || row.isManager || '').toLowerCase() === 'true'

          console.log(`🔍 Satır ${importedCount + 1}: CurrAccCode="${currAccCode}", NameSurname="${nameSurname}"`)

          if (!currAccCode || !nameSurname) {
            console.log(`❌ Satır ${importedCount + 1}: CurrAccCode veya NameSurname boş - ATLANIYOR`)
            errors.push(`Satır ${importedCount + 1}: CurrAccCode veya NameSurname boş`)
            continue
          }

          // ID'leri bul - eğer yoksa oluştur
          console.log(`🔍 Arama: brandName="${brandName}", locationName="${locationName}", departmentName="${departmentName}", positionName="${positionName}"`)
          console.log(`🔍 BrandIdMap keys:`, Array.from(brandIdMap.keys()))
          
          let brandId = brandName ? brandIdMap.get(brandName) : null
          let locationId = locationName ? locationIdMap.get(locationName) : null
          let departmentId = departmentName ? departmentIdMap.get(departmentName) : null
          let positionId = positionName ? positionIdMap.get(positionName) : null
          
          console.log(`🔍 Bulunan ID'ler: brandId=${brandId}, locationId=${locationId}, departmentId=${departmentId}, positionId=${positionId}`)

          // Eksik kayıtları oluştur
          if (brandName && !brandId) {
            console.log(`⚠️ Brand bulunamadı, oluşturuluyor: ${brandName}`)
            const newBrand = await prisma.brand.create({
              data: {
                brandName: brandName,
                companyId: company.companyId
              }
            })
            brandId = newBrand.brandId
            brandIdMap.set(brandName, brandId)
          }

          if (locationName && !locationId) {
            console.log(`⚠️ Location bulunamadı, oluşturuluyor: ${locationName}`)
            const newLocation = await prisma.location.create({
              data: { locationName: locationName }
            })
            locationId = newLocation.locationId
            locationIdMap.set(locationName, locationId)
          }

          if (departmentName && !departmentId) {
            console.log(`⚠️ Department bulunamadı, oluşturuluyor: ${departmentName}`)
            const newDepartment = await prisma.department.create({
              data: { departmentName: departmentName }
            })
            departmentId = newDepartment.departmentId
            departmentIdMap.set(departmentName, departmentId)
          }

          if (positionName && !positionId) {
            console.log(`⚠️ Position bulunamadı, oluşturuluyor: ${positionName}`)
            const newPosition = await prisma.position.create({
              data: { positionName: positionName }
            })
            positionId = newPosition.positionId
            positionIdMap.set(positionName, positionId)
          }

          console.log(`💾 Employee oluşturuluyor: ${currAccCode} - ${nameSurname}`)
          console.log(`   BrandId: ${brandId}, LocationId: ${locationId}, DepartmentId: ${departmentId}, PositionId: ${positionId}`)

          // İlk aşamada ManagerId'yi null yap (ikinci aşamada güncellenecek)
          const validManagerId = null

          // Mevcut çalışanı kontrol et (upsert yerine create kullanmak için)
          const existingEmployee = await prisma.employee.findUnique({
            where: { currAccCode: currAccCode }
          });

          if (existingEmployee) {
            // Eğer çalışan zaten varsa, güncelle
            await prisma.employee.update({
              where: { currAccCode: currAccCode },
              data: {
                firstLastName: nameSurname,
                organization: 'Olka Group',
                brandId: brandId,
                locationId: locationId,
                departmentId: departmentId,
                positionId: positionId,
                managerId: validManagerId,
                isManager: isManager,
                levelName: levelName,
              }
            });
            console.log(`🔄 Employee güncellendi: ${currAccCode}`);
          } else {
            // Çalışan yoksa, oluştur
            await prisma.employee.create({
              data: {
                currAccCode,
                firstLastName: nameSurname,
                organization: 'Olka Group',
                brandId: brandId,
                locationId: locationId,
                departmentId: departmentId,
                positionId: positionId,
                managerId: validManagerId,
                isManager: isManager,
                levelName: levelName,
              }
            });
            console.log(`✅ Employee oluşturuldu: ${currAccCode}`);
          }

          importedCount++
        } catch (error: any) {
          console.error(`❌ Employee oluşturma hatası (Satır ${importedCount + 1}):`, error.message)
          errors.push(`Satır ${importedCount + 1}: ${error.message}`)
        }
      }

      // İkinci aşama: ManagerId'leri güncelle
      console.log('👥 ManagerId\'ler güncelleniyor (2. aşama)...')
      let managerUpdateCount = 0
      
      for (const row of data) {
        try {
          const currAccCode = (row.CurrAccCode || row.currAccCode || '').toString().trim()
          const managerId = (row.ManagerId || row.managerId || '').toString().trim()
          
          if (currAccCode && managerId) {
            // Manager'ın var olup olmadığını kontrol et
            const managerExists = await prisma.employee.findUnique({
              where: { currAccCode: managerId }
            })
            
            if (managerExists) {
              // Employee'yi güncelle
              await prisma.employee.update({
                where: { currAccCode: currAccCode },
                data: { managerId: managerId }
              })
              console.log(`🔄 ManagerId güncellendi: ${currAccCode} -> ${managerId}`)
              managerUpdateCount++
            } else {
              console.log(`⚠️ Manager bulunamadı: ${managerId} (Employee: ${currAccCode})`)
            }
          }
        } catch (error: any) {
          console.error(`❌ ManagerId güncelleme hatası: ${error.message}`)
        }
      }
      
      console.log(`✅ ManagerId güncelleme tamamlandı: ${managerUpdateCount} kayıt`)
    }

    console.log(`✅ Import tamamlandı: ${importedCount} kayıt`)

    res.status(200).json({
      message: `${importedCount} kayıt başarıyla içe aktarıldı`,
      importedCount,
      errors: errors.slice(0, 10)
    })

  } catch (error: any) {
    console.error('Excel import hatası:', error)
    res.status(500).json({ message: 'Import hatası: ' + error.message })
  } finally {
    await prisma.$disconnect()
  }
}
