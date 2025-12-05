import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../../lib/db'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'PATCH, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'PATCH') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const { currAccCode, hideFromChart } = req.body

    console.log('API called with:', { currAccCode, hideFromChart, type: typeof hideFromChart })

    if (!currAccCode) {
      return res.status(400).json({ message: 'currAccCode is required' })
    }

    if (typeof hideFromChart !== 'boolean') {
      return res.status(400).json({ message: 'hideFromChart must be a boolean', received: typeof hideFromChart })
    }

    console.log('Updating employee:', currAccCode, 'hideFromChart:', hideFromChart)

    // Önce employee'nin var olup olmadığını kontrol et
    const existingEmployee = await prisma.employee.findUnique({
      where: { currAccCode },
      select: { currAccCode: true }
    })

    if (!existingEmployee) {
      return res.status(404).json({ message: 'Employee not found' })
    }

    // Raw SQL ile güncelleme - PostgreSQL'de kolon adı snake_case olabilir
    try {
      // Önce snake_case ile dene
      await prisma.$executeRaw`
        UPDATE employees 
        SET "hideFromChart" = ${hideFromChart}::boolean 
        WHERE "currAccCode" = ${currAccCode}
      `
      
      console.log('Update successful (raw SQL - hideFromChart)')
      
      // Güncellenmiş veriyi kontrol et
      const updated = await prisma.$queryRaw<Array<{currAccCode: string, hideFromChart: boolean}>>`
        SELECT "currAccCode", "hideFromChart" 
        FROM employees 
        WHERE "currAccCode" = ${currAccCode}
      `
      
      return res.status(200).json({
        currAccCode,
        hideFromChart: updated[0]?.hideFromChart || hideFromChart
      })
    } catch (rawError: any) {
      console.error('Raw SQL error:', rawError.message)
      console.error('Trying normal Prisma update...')
      
      // Raw SQL başarısız olursa, normal update'i dene
      try {
        const employee = await prisma.employee.update({
          where: { currAccCode },
          data: { hideFromChart } as any, // Type assertion for safety
          select: {
            currAccCode: true,
            hideFromChart: true,
          },
        })

        console.log('Update successful (normal Prisma):', employee)
        
        return res.status(200).json(employee)
      } catch (prismaError: any) {
        console.error('Prisma update error:', prismaError.message)
        throw prismaError
      }
    }
  } catch (error: any) {
    console.error('API Error:', error)
    console.error('Error stack:', error?.stack)
    // Daha detaylı hata mesajı
    const errorMessage = error?.message || 'Internal server error'
    const errorCode = error?.code || 'UNKNOWN'
    console.error('Error details:', { errorMessage, errorCode, currAccCode: req.body?.currAccCode, hideFromChart: req.body?.hideFromChart })
    
    // JSON response garantisi
    res.status(500).json({ 
      message: 'Internal server error',
      error: errorMessage,
      code: errorCode,
      details: process.env.NODE_ENV === 'development' ? error?.stack : undefined
    })
  }
}

