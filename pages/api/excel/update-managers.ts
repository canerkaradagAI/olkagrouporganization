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

  let filePath: string | undefined

  try {
    const [fields, files] = await form.parse(req)
    
    const file = files.file?.[0]

    if (!file) {
      return res.status(400).json({ message: 'Dosya bulunamadı' })
    }

    console.log('🔄 ManagerId güncelleme başlıyor...')

    filePath = file.filepath
    const workbook = XLSX.readFile(filePath)
    const sheetName = workbook.SheetNames[0]
    const sheet = workbook.Sheets[sheetName]
    const data: any[] = XLSX.utils.sheet_to_json(sheet)

    console.log(`📊 Excel dosyası okundu: ${data.length} satır`)

    let updatedCount = 0
    const errors: string[] = []

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
            updatedCount++
          } else {
            console.log(`⚠️ Manager bulunamadı: ${managerId} (Employee: ${currAccCode})`)
            errors.push(`Manager bulunamadı: ${managerId} (Employee: ${currAccCode})`)
          }
        }
      } catch (error: any) {
        console.error(`❌ ManagerId güncelleme hatası: ${error.message}`)
        errors.push(`Hata: ${error.message}`)
      }
    }

    console.log(`✅ ManagerId güncelleme tamamlandı: ${updatedCount} kayıt`)

    res.status(200).json({
      message: `${updatedCount} ManagerId başarıyla güncellendi`,
      updatedCount,
      errors: errors.slice(0, 10)
    })

  } catch (error: any) {
    console.error('ManagerId güncelleme hatası:', error)
    res.status(500).json({ message: 'Güncelleme hatası: ' + error.message })
  } finally {
    if (filePath && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath)
    }
    await prisma.$disconnect()
  }
}

