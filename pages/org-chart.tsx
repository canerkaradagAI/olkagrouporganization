import { useState, useEffect } from 'react'
import Head from 'next/head'
import { Navbar } from '../components/navbar'
import dynamic from 'next/dynamic'

interface Employee {
  currAccCode: string
  firstLastName: string
  organization?: string | null
  positionId?: number | null
  locationId?: number | null
  isBlocked: boolean
  isManager: boolean
  managerId?: string | null
  brandId?: number | null
  levelName?: string | null
  position?: {
    positionId: number
    positionName: string
  } | null
  department?: {
    departmentId: number
    departmentName: string
  } | null
  brand?: {
    brandId: number
    brandName: string
  } | null
  location?: {
    locationId: number
    locationName: string
  } | null
  manager?: Employee | null
  subordinates?: Employee[]
}

interface OrgChartProps {
  employees: Employee[]
}

function OrgChart() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set())

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const response = await fetch('/api/organization/list')
        const data = await response.json()
        setEmployees(data)
      } catch (error) {
        console.error('Error fetching employees:', error)
        setEmployees([])
      } finally {
        setLoading(false)
      }
    }

    fetchEmployees()
  }, [])

  // Gerçek organizasyon hiyerarşisini oluştur
  const buildHierarchy = (employees: Employee[]) => {
    // Seviyeye göre grupla
    const groupedByLevel = employees.reduce((acc, emp) => {
      const level = emp.levelName || 'Belirsiz'
      if (!acc[level]) acc[level] = []
      acc[level].push(emp)
      return acc
    }, {} as Record<string, Employee[]>)

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

  const renderEmployeeNode = (employee: Employee) => {
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
        {loading ? (
          <div className="loading">Yükleniyor...</div>
        ) : (
          <>
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
                {buildHierarchy(employees).map(level => (
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
          </>
        )}
      </div>
    </>
  )
}

export default dynamic(() => Promise.resolve(OrgChart), { ssr: false })
