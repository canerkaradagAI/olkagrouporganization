import { useState, useRef, useEffect } from 'react'
import React from 'react'
import Layout from '../components/Layout'
import Head from 'next/head'
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
  manager?: Employee | null
  subordinates?: Employee[]
  location?: {
    locationId: number
    locationName: string
  } | null
}

interface TreeViewProps {
  employees: Employee[]
  companies: string[]
  brands: string[]
}

function TreeViewPage() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [companies, setCompanies] = useState<string[]>([])
  const [brands, setBrands] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCompany, setSelectedCompany] = useState<string>('all')
  const [selectedBrand, setSelectedBrand] = useState<string>('all')
  const [selectedEmployee, setSelectedEmployee] = useState<string>('all')
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set())
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([])

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/organization/list')
        const data = await response.json()
        setEmployees(data)
        setFilteredEmployees(data)
        
        // Companies ve brands'i çıkar
        const uniqueCompanies = [...new Set(data.map((emp: Employee) => emp.organization).filter(Boolean))]
        const uniqueBrands = [...new Set(data.map((emp: Employee) => emp.brand?.brandName).filter(Boolean))]
        
        setCompanies(uniqueCompanies as string[])
        setBrands(uniqueBrands as string[])
      } catch (error) {
        console.error('Error fetching data:', error)
        setEmployees([])
        setFilteredEmployees([])
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // Ağaç yapısını oluştur - Basit managerId bağlantıları
  const buildTree = (employees: Employee[]) => {
    const employeeMap = new Map<string, Employee>()
    const rootEmployees: Employee[] = []

    // Tüm çalışanları map'e ekle
    employees.forEach(emp => {
      employeeMap.set(emp.currAccCode, { ...emp, subordinates: [] })
    })

    // Hiyerarşiyi oluştur - direkt managerId bağlantıları
    employees.forEach(emp => {
      const employee = employeeMap.get(emp.currAccCode)!
      
      if (emp.managerId && employeeMap.has(emp.managerId)) {
        const manager = employeeMap.get(emp.managerId)!
        if (!manager.subordinates) manager.subordinates = []
        manager.subordinates.push(employee)
      } else {
        // Root employee (yöneticisi yok veya yöneticisi listede yok)
        rootEmployees.push(employee)
      }
    })

    // Alt çalışanları seviye bazlı sırala
    const sortSubordinates = (emp: EmployeeWithRelations) => {
      if (emp.subordinates && emp.subordinates.length > 0) {
        emp.subordinates.sort((a, b) => {
          // Önce seviyeye göre, sonra isme göre sırala
          const levelOrder = [
            'Yönetim Kurulu', 'Genel Müdür', 'C Level', 'Direktör', 
            'Kıdemli Müdür', 'Müdür', 'Kıdemli Yönetici', 'Yönetici',
            'Kıdemli Uzman', 'Uzman', 'Uzman Yardımcısı', 'Mavi Yaka', 'Destek', 'Stajyer'
          ]
          const aLevel = levelOrder.indexOf(a.levelName || '')
          const bLevel = levelOrder.indexOf(b.levelName || '')
          
          if (aLevel !== bLevel) return aLevel - bLevel
          return a.firstLastName.localeCompare(b.firstLastName, 'tr')
        })
        
        // Recursive olarak alt çalışanları da sırala
        emp.subordinates.forEach(sortSubordinates)
      }
    }

    // Root çalışanları sırala
    rootEmployees.sort((a, b) => {
      const levelOrder = [
        'Yönetim Kurulu', 'Genel Müdür', 'C Level', 'Direktör', 
        'Kıdemli Müdür', 'Müdür', 'Kıdemli Yönetici', 'Yönetici',
        'Kıdemli Uzman', 'Uzman', 'Uzman Yardımcısı', 'Mavi Yaka', 'Destek', 'Stajyer'
      ]
      const aLevel = levelOrder.indexOf(a.levelName || '')
      const bLevel = levelOrder.indexOf(b.levelName || '')
      
      if (aLevel !== bLevel) return aLevel - bLevel
      return a.firstLastName.localeCompare(b.firstLastName, 'tr')
    })

    // Tüm çalışanların alt çalışanlarını sırala
    rootEmployees.forEach(sortSubordinates)

    return rootEmployees
  }

  // Tüm düğümleri açık yap
  useEffect(() => {
    const allNodeIds = new Set<string>()
    const addAllNodes = (employees: EmployeeWithRelations[]) => {
      employees.forEach(emp => {
        allNodeIds.add(emp.currAccCode)
        if (emp.subordinates && emp.subordinates.length > 0) {
          addAllNodes(emp.subordinates)
        }
      })
    }
    const treeData = buildTree(filteredEmployees)
    addAllNodes(treeData)
    setExpandedNodes(allNodeIds)
  }, [filteredEmployees])

  // Filtreleme fonksiyonu - hiyerarşiyi koruyarak filtrele
  const applyFilters = () => {
    let filtered = employees

    if (selectedCompany !== 'all') {
      filtered = filtered.filter(emp => emp.organization === selectedCompany)
    }

    if (selectedBrand !== 'all') {
      const brandFilteredEmployees = filtered.filter(emp => emp.brand?.brandName === selectedBrand)
      const allRelevantEmployees = new Set<EmployeeWithRelations>()

      // Seçilen markadaki tüm çalışanları ekle
      brandFilteredEmployees.forEach(emp => allRelevantEmployees.add(emp))

      // Her çalışanın yöneticilerini yukarı doğru ekle
      const addManagers = (emp: EmployeeWithRelations) => {
        if (emp.managerId) {
          const manager = employees.find(e => e.currAccCode === emp.managerId)
          if (manager && !allRelevantEmployees.has(manager)) {
            allRelevantEmployees.add(manager)
            addManagers(manager)
          }
        }
      }

      brandFilteredEmployees.forEach(addManagers)
      filtered = Array.from(allRelevantEmployees)
    }

    if (selectedEmployee !== 'all') {
      const selectedEmp = employees.find(emp => emp.currAccCode === selectedEmployee)
      if (selectedEmp) {
        const allRelevantEmployees = new Set<EmployeeWithRelations>()
        
        // Seçilen çalışanı ekle
        allRelevantEmployees.add(selectedEmp)
        
        // Alt çalışanları ekle (recursive)
        const addSubordinates = (emp: EmployeeWithRelations) => {
          const subordinates = employees.filter(e => e.managerId === emp.currAccCode)
          subordinates.forEach(sub => {
            if (!allRelevantEmployees.has(sub)) {
              allRelevantEmployees.add(sub)
              addSubordinates(sub)
            }
          })
        }
        
        // Üst yöneticileri ekle (recursive)
        const addManagers = (emp: EmployeeWithRelations) => {
          if (emp.managerId) {
            const manager = employees.find(e => e.currAccCode === emp.managerId)
            if (manager && !allRelevantEmployees.has(manager)) {
              allRelevantEmployees.add(manager)
              addManagers(manager)
            }
          }
        }
        
        addSubordinates(selectedEmp)
        addManagers(selectedEmp)
        filtered = Array.from(allRelevantEmployees)
      }
    }

    setFilteredEmployees(filtered)
  }

  // Filtre değiştiğinde otomatik uygula
  React.useEffect(() => {
    applyFilters()
  }, [selectedCompany, selectedBrand, selectedEmployee, employees])

  // Node'u genişlet/daralt
  const toggleNode = (employeeId: string) => {
    const newExpanded = new Set(expandedNodes)
    if (newExpanded.has(employeeId)) {
      newExpanded.delete(employeeId)
    } else {
      newExpanded.add(employeeId)
    }
    setExpandedNodes(newExpanded)
  }

  // Tümünü genişlet
  const expandAll = () => {
    const allIds = new Set<string>()
    const collectIds = (employees: EmployeeWithRelations[]) => {
      employees.forEach(emp => {
        allIds.add(emp.currAccCode)
        if (emp.subordinates && emp.subordinates.length > 0) {
          collectIds(emp.subordinates)
        }
      })
    }
    collectIds(filteredEmployees)
    setExpandedNodes(allIds)
  }

  // Tümünü daralt
  const collapseAll = () => {
    setExpandedNodes(new Set())
  }

  // Avatar için baş harfler
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const getLevelClass = (levelName: string | null) => {
    if (!levelName) return ''
    
    const level = levelName.toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/&/g, '')
      .replace(/\(/g, '')
      .replace(/\)/g, '')
    
    return `level-${level}`
  }

  // Çalışan kartını render et
  const renderEmployee = (employee: EmployeeWithRelations, level: number = 0) => {
    const isExpanded = expandedNodes.has(employee.currAccCode)
    const hasSubordinates = employee.subordinates && employee.subordinates.length > 0
    const isResigned = employee.isBlocked // İşten ayrılmış olanlar için

    return (
      <div key={employee.currAccCode} className="tree-node">
        <div 
          className={`employee-card ${hasSubordinates ? 'has-subordinates' : ''} ${
            isResigned ? 'opacity-60' : ''
          } ${getLevelClass(employee.levelName)}`}
          onClick={() => hasSubordinates && toggleNode(employee.currAccCode)}
        >
          {/* Çalışan Detayları - Avatar ile birlikte tek satırda */}
          <div className="employee-content">
            <div className="employee-name">
              <span className="employee-avatar-inline">
                {getInitials(employee.firstLastName)}
              </span>
              <span className="name-part">{employee.firstLastName}</span>
              <span className="details-part"> - {employee.position?.positionName} ({employee.department?.departmentName})</span>
            </div>
          </div>
        </div>

        {/* Alt çalışanlar */}
        {hasSubordinates && isExpanded && (
          <div className="subordinates-container">
            {employee.subordinates!.map(sub => renderEmployee(sub, level + 1))}
          </div>
        )}
      </div>
    )
  }

  const treeData = buildTree(filteredEmployees)

  return (
    <Layout>
      <Head>
        <title>Organizasyon Ağaç Görünümü - OLKA Group</title>
      </Head>
      
      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Page Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            ORGANİZASYON AĞAÇ GÖRÜNÜMÜ
          </h1>
          <p className="text-gray-600">
            Çalışan hiyerarşisi ve bireysel bağlantılar
          </p>
        </div>

        {/* Filtreler */}
        <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
          <div className="flex flex-wrap gap-4 items-center justify-center">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">Şirket:</label>
              <select 
                value={selectedCompany} 
                onChange={(e) => setSelectedCompany(e.target.value)}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Tümü</option>
                {companies.map(company => (
                  <option key={company} value={company}>{company}</option>
                ))}
              </select>
            </div>
            
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">Marka:</label>
              <select 
                value={selectedBrand} 
                onChange={(e) => setSelectedBrand(e.target.value)}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Tümü</option>
                {brands.map(brand => (
                  <option key={brand} value={brand}>{brand}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">Kişi:</label>
              <select 
                value={selectedEmployee} 
                onChange={(e) => setSelectedEmployee(e.target.value)}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[200px]"
              >
                <option value="all">Tümü</option>
                {employees.map(employee => (
                  <option key={employee.currAccCode} value={employee.currAccCode}>
                    {employee.firstLastName} - {employee.position?.positionName}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Kontrol Butonları */}
        <div className="flex justify-center gap-4 mb-6">
          <button
            onClick={expandAll}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Tümünü Genişlet
          </button>
          <button
            onClick={collapseAll}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
          >
            Tümünü Daralt
          </button>
        </div>

        {/* Ağaç Görünümü */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-500 mt-2">Veriler yükleniyor...</p>
            </div>
          ) : treeData.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              Gösterilecek çalışan bulunamadı.
            </p>
          ) : (
            <div className="org-tree">
              {treeData.map(employee => renderEmployee(employee))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}

export default dynamic(() => Promise.resolve(TreeViewPage), { ssr: false })