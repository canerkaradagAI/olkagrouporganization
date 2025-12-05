import type { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../../lib/db'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const { managerId, companyId, brandId, locationId, departmentId, showInChart } = req.body

    // Validasyon
    if (!managerId || !companyId || !brandId || !locationId || !departmentId) {
      return res.status(400).json({ message: 'Tüm alanlar zorunludur' })
    }

    // Manager'ın var olup olmadığını kontrol et
    const manager = await prisma.employee.findUnique({
      where: { currAccCode: managerId }
    })

    if (!manager) {
      return res.status(404).json({ message: 'Yönetici bulunamadı' })
    }

    // Brand'ı al ve company bilgisini çıkar
    const brand = await prisma.brand.findUnique({
      where: { brandId: parseInt(brandId) },
      include: { company: true }
    })

    if (!brand) {
      return res.status(404).json({ message: 'Marka bulunamadı' })
    }

    const company = brand.company
    if (!company) {
      return res.status(404).json({ message: 'Şirket bulunamadı' })
    }

    // Company name'i kullan (filters'da id olarak index kullanılıyor, name gönderiliyor)
    const companyName = typeof companyId === 'string' ? companyId : company.companyName


    // Location'ın var olup olmadığını kontrol et
    const location = await prisma.location.findUnique({
      where: { locationId: parseInt(locationId) }
    })

    if (!location) {
      return res.status(404).json({ message: 'Lokasyon bulunamadı' })
    }

    // Department'ın var olup olmadığını kontrol et
    const department = await prisma.department.findUnique({
      where: { departmentId: parseInt(departmentId) }
    })

    if (!department) {
      return res.status(404).json({ message: 'Departman bulunamadı' })
    }

    // Benzersiz currAccCode oluştur (SEAT_ prefix ile)
    let seatCode = ''
    let counter = 1
    let exists = true
    
    while (exists) {
      seatCode = `SEAT_${Date.now()}_${counter}`
      const existing = await prisma.employee.findUnique({
        where: { currAccCode: seatCode }
      })
      if (!existing) {
        exists = false
      } else {
        counter++
      }
    }

    // Koltuk için varsayılan pozisyon oluştur veya bul
    let position = await prisma.position.findFirst({
      where: {
        positionName: 'Koltuk',
        departmentId: parseInt(departmentId)
      }
    })

    if (!position) {
      position = await prisma.position.create({
        data: {
          positionName: 'Koltuk',
          departmentId: parseInt(departmentId)
        }
      })
    }

    // Koltuk çalışanını oluştur
    const seat = await prisma.employee.create({
      data: {
        currAccCode: seatCode,
        firstLastName: 'Koltuk',
        organization: companyName,
        managerId: managerId,
        brandId: parseInt(brandId),
        locationId: parseInt(locationId),
        departmentId: parseInt(departmentId),
        positionId: position.positionId,
        isManager: false,
        isBlocked: false,
        hideFromChart: !showInChart,
        levelName: null, // Koltuklar için level yok
      }
    })

    console.log('✅ Koltuk oluşturuldu:', seatCode)

    res.status(200).json({
      message: 'Koltuk başarıyla eklendi',
      seat: {
        currAccCode: seat.currAccCode,
        firstLastName: seat.firstLastName,
        managerId: seat.managerId,
        brandId: seat.brandId,
        locationId: seat.locationId,
        departmentId: seat.departmentId,
        hideFromChart: seat.hideFromChart
      }
    })
  } catch (error: any) {
    console.error('Koltuk ekleme hatası:', error)
    res.status(500).json({
      message: 'Koltuk eklenirken hata oluştu',
      error: error?.message || 'Bilinmeyen hata'
    })
  }
}

