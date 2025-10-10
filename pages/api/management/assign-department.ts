import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../../lib/db'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const { departmentId, newManagerId, departmentName, managerName } = req.body

    if (!departmentId || !newManagerId) {
      return res.status(400).json({ message: 'Department ID and Manager ID are required' })
    }

    // Departmanın mevcut yöneticisini bul
    const department = await prisma.department.findUnique({
      where: { departmentId: parseInt(departmentId) },
      include: {
        employees: {
          where: { isManager: true },
          include: { position: true }
        }
      }
    })

    if (!department) {
      return res.status(404).json({ message: 'Department not found' })
    }

    // Yeni yöneticiyi bul
    const newManager = await prisma.employee.findUnique({
      where: { currAccCode: newManagerId }
    })

    if (!newManager) {
      return res.status(404).json({ message: 'New manager not found' })
    }

    // Departmanın altındaki tüm çalışanları yeni yöneticiye ata
    const updateResult = await prisma.employee.updateMany({
      where: { 
        departmentId: parseInt(departmentId),
        currAccCode: { not: newManagerId } // Yöneticiyi kendisine atama
      },
      data: { 
        managerId: newManagerId 
      }
    })

    console.log(`✅ ${departmentName} departmanı ${managerName} yöneticisine atandı. ${updateResult.count} çalışan güncellendi.`)

    res.status(200).json({ 
      message: 'Department assigned successfully',
      updatedEmployees: updateResult.count,
      departmentName,
      managerName
    })

  } catch (error) {
    console.error('Department assignment error:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
}
