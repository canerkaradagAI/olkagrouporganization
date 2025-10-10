import { useState, useEffect } from 'react'
import { GetServerSideProps } from 'next'
import { prisma } from '../lib/db'
import { Employee, Department, Position, Brand, Location } from '@prisma/client'
import Head from 'next/head'
import { Navbar } from '../components/navbar'

interface EmployeeWithRelations extends Employee {
  position?: Position | null
  department?: Department | null
  brand?: Brand | null
  location?: Location | null
  manager?: EmployeeWithRelations | null
  subordinates?: EmployeeWithRelations[]
}

interface OrgChartProps {
  employees: EmployeeWithRelations[]
}

export default function OrgChart({ employees }: OrgChartProps) {
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeWithRelations | null>(null)
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set())

  // Gerçek organizasyon hiyerarşisini oluştur
  const buildHierarchy = (employees: EmployeeWithRelations[]) => {
    // Seviyeye göre grupla
    const groupedByLevel = employees.reduce((acc, emp) => {
      const level = emp.levelName || 'Belirsiz'
      if (!acc[level]) acc[level] = []
      acc[level].push(emp)
      return acc
    }, {} as Record<string, EmployeeWithRelations[]>)

    // Seviye sıralamasına göre düzenle
    const levelOrder = [
      'Yönetim Kurulu',
      'Genel Müdür', 
      'C Level',
      'Direktör',
      'Kıdemli Müdür',
      'Müdür',
      'Kıdemli Yönetici',
      'Yönetici',
      'Kıdemli Uzman',
      'Uzman',
      'Uzman Yardımcısı',
      'Mavi Yaka',
      'Destek',
      'Stajyer'
    ]

    return levelOrder
      .filter(level => groupedByLevel[level])
      .map(level => ({
        levelName: level,
        employees: groupedByLevel[level]
      }))
  }

  const rootEmployees = buildHierarchy(employees)

  const toggleNode = (levelName: string) => {
    const newExpanded = new Set(expandedNodes)
    if (newExpanded.has(levelName)) {
      newExpanded.delete(levelName)
    } else {
      newExpanded.add(levelName)
    }
    setExpandedNodes(newExpanded)
  }

  const renderEmployeeNode = (employee: EmployeeWithRelations) => {
    return (
      <div key={employee.currAccCode} className="employee-card">
        <div className="employee-info">
          <h3 className="employee-name">{employee.firstLastName}</h3>
          <p className="employee-position">{employee.position?.positionName}</p>
          <p className="employee-department">{employee.department?.departmentName}</p>
          <p className="employee-level">{employee.levelName}</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <Head>
        <title>Organizasyon Şeması - Ağaç Görünümü</title>
      </Head>
      <Navbar />
      <div className="org-chart-container">
      <div className="org-chart-header">
        <h1>Organizasyon Şeması</h1>
        <div className="chart-controls">
          <button 
            onClick={() => setExpandedNodes(new Set())}
            className="btn-collapse-all"
          >
            Tümünü Daralt
          </button>
          <button 
            onClick={() => {
              const allIds = new Set(employees.map(emp => emp.currAccCode))
              setExpandedNodes(allIds)
            }}
            className="btn-expand-all"
          >
            Tümünü Genişlet
          </button>
        </div>
      </div>

      <div className="org-chart-content">
        <div className="org-tree">
          {rootEmployees.map(level => (
            <div key={level.levelName} className="level-section">
              <div 
                className="level-title"
                onClick={() => toggleNode(level.levelName)}
              >
                {level.levelName} ({level.employees.length} kişi)
                <span className="expand-indicator">
                  {expandedNodes.has(level.levelName) ? '▼' : '▶'}
                </span>
              </div>
              {expandedNodes.has(level.levelName) && (
                <div className="level-employees">
                  {level.employees.map(employee => renderEmployeeNode(employee))}
                </div>
              )}
            </div>
          ))}
        </div>
        
        {selectedEmployee && (
          <div className="employee-details">
            <h3>Çalışan Detayları</h3>
            <div className="detail-section">
              <h4>Kişisel Bilgiler</h4>
              <p><strong>Ad Soyad:</strong> {selectedEmployee.firstLastName}</p>
              <p><strong>Çalışan Kodu:</strong> {selectedEmployee.currAccCode}</p>
              <p><strong>Organizasyon:</strong> {selectedEmployee.organization}</p>
            </div>
            
            <div className="detail-section">
              <h4>Pozisyon Bilgileri</h4>
              <p><strong>Pozisyon:</strong> {selectedEmployee.position?.positionName || 'Belirtilmemiş'}</p>
              <p><strong>Departman:</strong> {selectedEmployee.department?.departmentName || 'Belirtilmemiş'}</p>
              <p><strong>Seviye:</strong> {selectedEmployee.levelName || 'Belirtilmemiş'}</p>
              <p><strong>Marka:</strong> {selectedEmployee.brand?.brandName || 'Belirtilmemiş'}</p>
              <p><strong>Lokasyon:</strong> {selectedEmployee.location?.locationName || 'Belirtilmemiş'}</p>
            </div>
            
            <div className="detail-section">
              <h4>Yönetim Bilgileri</h4>
              <p><strong>Yönetici:</strong> {selectedEmployee.manager?.firstLastName || 'Yok'}</p>
              <p><strong>Alt Çalışan Sayısı:</strong> {selectedEmployee.subordinates?.length || 0}</p>
              <p><strong>Müdür:</strong> {selectedEmployee.isManager ? 'Evet' : 'Hayır'}</p>
            </div>
          </div>
        )}
      </div>
    </div>
    </>
  )
}

export const getServerSideProps: GetServerSideProps = async () => {
  try {
    const employees = await prisma.employee.findMany({
      include: {
        position: true,
        department: true,
        brand: true,
        location: true,
        manager: {
          include: {
            position: true,
            department: true,
            brand: true,
            location: true,
          }
        },
        subordinates: {
          include: {
            position: true,
            department: true,
            brand: true,
            location: true,
          }
        }
      },
      orderBy: [
        { levelName: 'asc' },
        { firstLastName: 'asc' }
      ]
    })

    return {
      props: {
        employees: JSON.parse(JSON.stringify(employees))
      }
    }
  } catch (error) {
    console.error('Error fetching employees:', error)
    return {
      props: {
        employees: []
      }
    }
  }
}
