import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../../lib/db'
import formidable from 'formidable'
import * as XLSX from 'xlsx'
import fs from 'fs'

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

  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error('Form parse error:', err)
      return res.status(500).json({ message: 'Dosya yüklenirken hata oluştu' })
    }

    const file = files.file?.[0]
    const selectedTable = fields.table?.[0] as string || 'employee'
    let filePath: string | undefined

    if (!file) {
      return res.status(400).json({ message: 'Dosya bulunamadı' })
    }

    try {
      console.log('📊 Excel import başlıyor...')
      console.log('Selected table:', selectedTable)
      console.log('File path:', file.filepath)

      filePath = file.filepath
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
                levelOrder: levelOrder > 0 ? levelOrder : 1,
                description: description || `${levelName} seviyesi`
              }
            })
            importedCount++
          }
        }
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
      if (filePath && fs.existsSync(filePath)) {
        fs.unlinkSync(filePath) // Clean up the uploaded file
      }
    }
  })
}
