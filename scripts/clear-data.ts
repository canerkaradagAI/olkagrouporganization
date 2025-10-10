import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function clearData() {
  console.log('🗑️ Mevcut veriler temizleniyor...')
  
  try {
    // Foreign key constraints nedeniyle ters sırada sil
    await prisma.positionAssignment.deleteMany()
    console.log('✅ PositionAssignment verileri silindi')
    
    await prisma.employee.deleteMany()
    console.log('✅ Employee verileri silindi')
    
    await prisma.position.deleteMany()
    console.log('✅ Position verileri silindi')
    
    await prisma.department.deleteMany()
    console.log('✅ Department verileri silindi')
    
    await prisma.location.deleteMany()
    console.log('✅ Location verileri silindi')
    
    // Brand ve Company'yi silme, sadece yeni veriler ekleyeceğiz
    console.log('✅ Veriler temizlendi')
    
  } catch (error) {
    console.error('❌ Hata:', error)
  } finally {
    await prisma.$disconnect()
  }
}

clearData()
