import { useState, useRef, useEffect } from 'react'
import React from 'react'
import Layout from '../components/Layout'
import Head from 'next/head'
import { toast } from 'react-hot-toast'
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

interface Department {
  departmentId: number
  departmentName: string
}

interface ManagementLevel {
  levelName: string
  employees: Employee[]
  departments: Department[]
}

interface ManagementProps {
  managementLevels: ManagementLevel[]
  cLevelWithDepartments: Array<{
    employee: Employee
    departments: Department[]
  }>
  yasinDirectDepartments: Array<{
    employee: Employee
    departments: Department[]
  }>
  allDepartments: Department[]
  companies: string[]
  brands: string[]
}

function ManagementPage() {
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)
  const [zoomLevel, setZoomLevel] = useState(1)
  const [draggedDepartment, setDraggedDepartment] = useState<Department | null>(null)
  const [dragOverEmployee, setDragOverEmployee] = useState<string | null>(null)
  const [selectedCompany, setSelectedCompany] = useState<string>('all')
  const [selectedBrand, setSelectedBrand] = useState<string>('all')
  const [loading, setLoading] = useState(true)
  
  // Data states
  const [managementLevels, setManagementLevels] = useState<ManagementLevel[]>([])
  const [cLevelWithDepartments, setCLevelWithDepartments] = useState<Array<{
    employee: Employee
    departments: Department[]
  }>>([])
  const [yasinDirectDepartments, setYasinDirectDepartments] = useState<Array<{
    employee: Employee
    departments: Department[]
  }>>([])
  const [allDepartments, setAllDepartments] = useState<Department[]>([])
  const [companies, setCompanies] = useState<string[]>([])
  const [brands, setBrands] = useState<string[]>([])
  
  const [filteredData, setFilteredData] = useState({
    managementLevels: [] as ManagementLevel[],
    cLevelWithDepartments: [] as Array<{ employee: Employee; departments: Department[] }>,
    yasinDirectDepartments: [] as Array<{ employee: Employee; departments: Department[] }>,
    allDepartments: [] as Department[]
  })
  const orgChartRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/management/data')
        const data = await response.json()
        
        setManagementLevels(data.managementLevels || [])
        setCLevelWithDepartments(data.cLevelWithDepartments || [])
        setYasinDirectDepartments(data.yasinDirectDepartments || [])
        setAllDepartments(data.allDepartments || [])
        setCompanies(data.companies || [])
        setBrands(data.brands || [])
        
        setFilteredData({
          managementLevels: data.managementLevels || [],
          cLevelWithDepartments: data.cLevelWithDepartments || [],
          yasinDirectDepartments: data.yasinDirectDepartments || [],
          allDepartments: data.allDepartments || []
        })
      } catch (error) {
        console.error('Error fetching management data:', error)
        toast.error('Veri yüklenirken hata oluştu')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // Filtreleme fonksiyonu
  const applyFilters = () => {
    let filteredLevels = managementLevels
    let filteredCLevels = cLevelWithDepartments
    let filteredYasinDepartments = yasinDirectDepartments
    let filteredDepartments = allDepartments

    // Şirket filtresi
    if (selectedCompany !== 'all') {
      filteredLevels = managementLevels.map(level => ({
        ...level,
        employees: level.employees.filter(emp => emp.organization === selectedCompany)
      }))
      
      filteredCLevels = cLevelWithDepartments.filter(({ employee }) => 
        employee.organization === selectedCompany
      )

      filteredYasinDepartments = yasinDirectDepartments.filter(({ employee }) => 
        employee.organization === selectedCompany
      )
    }

    // Marka filtresi
    if (selectedBrand !== 'all') {
      filteredLevels = filteredLevels.map(level => ({
        ...level,
        employees: level.employees.filter(emp => emp.brand?.brandName === selectedBrand)
      }))
      
      filteredCLevels = filteredCLevels.filter(({ employee }) => 
        employee.brand?.brandName === selectedBrand
      )

      filteredYasinDepartments = filteredYasinDepartments.filter(({ employee }) => 
        employee.brand?.brandName === selectedBrand
      )
    }

    // Departmanları filtrele - sadece seçili şirket/markadaki çalışanların departmanları
    if (selectedCompany !== 'all' || selectedBrand !== 'all') {
      const relevantEmployeeIds = new Set()
      
      // Filtrelenmiş çalışanların ID'lerini topla
      filteredLevels.forEach(level => {
        level.employees.forEach(emp => relevantEmployeeIds.add(emp.currAccCode))
      })
      filteredCLevels.forEach(({ employee }) => {
        relevantEmployeeIds.add(employee.currAccCode)
      })
      filteredYasinDepartments.forEach(({ employee }) => {
        relevantEmployeeIds.add(employee.currAccCode)
      })
      
      // Bu çalışanların departmanlarını filtrele
      filteredDepartments = allDepartments.filter(dept => {
        // Bu departmanda çalışan var mı kontrol et
        return true // Şimdilik tüm departmanları göster
      })
    }

    setFilteredData({
      managementLevels: filteredLevels,
      cLevelWithDepartments: filteredCLevels,
      yasinDirectDepartments: filteredYasinDepartments,
      allDepartments: filteredDepartments
    })
  }

  // Filtre değiştiğinde otomatik uygula
  React.useEffect(() => {
    applyFilters()
  }, [selectedCompany, selectedBrand, managementLevels, cLevelWithDepartments, yasinDirectDepartments, allDepartments])

  // Drag & Drop fonksiyonları
  const handleDragStart = (e: React.DragEvent, department: Department) => {
    setDraggedDepartment(department)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/html', department.departmentName)
  }

  const handleDragOver = (e: React.DragEvent, employeeId: string) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverEmployee(employeeId)
  }

  const handleDragLeave = () => {
    setDragOverEmployee(null)
  }

  const handleDrop = async (e: React.DragEvent, targetEmployee: Employee) => {
    e.preventDefault()
    setDragOverEmployee(null)
    
    if (!draggedDepartment) return

    try {
      // API çağrısı ile departmanı yeni yöneticiye ata
      const response = await fetch('/api/management/assign-department', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          departmentId: draggedDepartment.departmentId,
          newManagerId: targetEmployee.currAccCode,
          departmentName: draggedDepartment.departmentName,
          managerName: targetEmployee.firstLastName
        }),
      })

      if (response.ok) {
        toast.success(`${draggedDepartment.departmentName} departmanı ${targetEmployee.firstLastName} yöneticisine atandı!`)
        // Sayfayı yenile
        window.location.reload()
      } else {
        toast.error('Departman atama işlemi başarısız oldu!')
      }
    } catch (error) {
      console.error('Departman atama hatası:', error)
      toast.error('Bir hata oluştu!')
    }

    setDraggedDepartment(null)
  }

  const renderOrgChart = () => {
    return (
      <div 
        className="bg-white rounded-lg shadow-sm border p-6 overflow-x-auto" 
        ref={orgChartRef}
        style={{
          transform: `scale(${zoomLevel})`,
          transformOrigin: 'center center',
          transition: 'transform 0.3s ease'
        }}
      >
        <div className="min-w-max">

                 {/* Yasin Kavşak ve Sağ Tarafındaki İç Denetim */}
                 <div className="flex justify-center items-center gap-8 mb-8">
                   {/* Yasin Kavşak */}
        <div className="bg-yellow-100 border border-yellow-300 rounded-lg p-3 text-center">
          <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-2">
            <span className="text-white font-bold text-sm">
              {filteredData.managementLevels[0]?.employees[0]?.firstLastName.split(' ').map(n => n[0]).join('')}
            </span>
          </div>
          <div className="text-yellow-800 font-medium text-sm">Yönetim Kurulu</div>
          <div className="font-semibold text-gray-900 text-base">{filteredData.managementLevels[0]?.employees[0]?.firstLastName}</div>
          <div className="text-sm text-gray-600">{filteredData.managementLevels[0]?.employees[0]?.position?.positionName}</div>
        </div>

                   {/* Sağ Taraf Bağlantı Çizgisi */}
                   {filteredData.yasinDirectDepartments.length > 0 && (
                     <>
                       <div className="w-8 h-1 bg-gray-400"></div>
                       
                       {/* İç Denetim */}
                       {filteredData.yasinDirectDepartments[0]?.departments.map(department => (
                       <div key={department.departmentId} className="bg-purple-50 border border-purple-200 rounded-lg p-3 text-center">
                         <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-2">
                           <span className="text-white font-semibold text-sm">İD</span>
                         </div>
                         <div className="text-purple-800 font-medium text-sm">{department.departmentName}</div>
                         <div className="text-sm text-purple-600 mt-1">Direkt Bağlı</div>
                       </div>
                       ))}
                     </>
                   )}
                 </div>

                 {/* Bağlantı Çizgileri */}
                 <div className="flex justify-center mb-8">
                   <div className="w-1 h-8 bg-gray-400"></div>
                 </div>
                 <div className="flex justify-center mb-8">
                   <div className="w-full max-w-4xl h-1 bg-gray-400"></div>
                 </div>

          {/* C Level & Genel Müdürler */}
          <div className="flex justify-center gap-8 flex-wrap">
            {filteredData.cLevelWithDepartments.map(({ employee, departments }) => (
              <div key={employee.currAccCode} className="text-center">
                {/* C Level Çalışan */}
                     <div
                       className={`bg-blue-100 border border-blue-300 rounded-lg p-3 mb-2 transition-all duration-200 ${
                         dragOverEmployee === employee.currAccCode
                           ? 'ring-4 ring-blue-400 ring-opacity-50 scale-105'
                           : ''
                       }`}
                       onDragOver={(e) => handleDragOver(e, employee.currAccCode)}
                       onDragLeave={handleDragLeave}
                       onDrop={(e) => handleDrop(e, employee)}
                     >
                       <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-2">
                         <span className="text-white font-semibold text-sm">
                           {employee.firstLastName.split(' ').map(n => n[0]).join('')}
                         </span>
                       </div>
                       <div className="text-blue-800 font-medium text-sm">{employee.department?.departmentName}</div>
                       <div className="font-semibold text-gray-900 text-base">{employee.firstLastName}</div>
                       <div className="text-sm text-gray-600">{employee.position?.positionName}</div>
                       {dragOverEmployee === employee.currAccCode && (
                         <div className="mt-2 text-sm text-blue-600 font-medium">
                           Departmanı buraya bırakın
                         </div>
                       )}
                     </div>

                {/* Bu C Level'a bağlı departmanlar */}
                {departments.length > 0 && (
                  <div className="space-y-2">
                    <div className="w-1 h-4 bg-gray-400 mx-auto"></div>
                    <div className="space-y-1">
                      {departments.map(department => (
                        <div 
                          key={department.departmentId} 
                          className="bg-green-50 border border-green-200 rounded p-2 cursor-move hover:bg-green-100 transition-colors"
                          draggable
                          onDragStart={(e) => handleDragStart(e, department)}
                        >
                          <div className="text-green-800 text-sm font-medium">{department.departmentName}</div>
                          <div className="text-xs text-green-600 mt-1">Sürükleyerek taşıyın</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const renderAllDepartments = () => {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Tüm Departmanlar ({filteredData.allDepartments.length})</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {filteredData.allDepartments.map(department => (
               <div
                 key={department.departmentId}
                 className="bg-green-50 border border-green-200 rounded p-3 cursor-move hover:bg-green-100 transition-colors"
                 draggable
                 onDragStart={(e) => handleDragStart(e, department)}
               >
                 <div className="text-green-800 text-sm font-medium">{department.departmentName}</div>
                 <div className="text-sm text-green-600 mt-1">Sürükleyerek taşıyın</div>
               </div>
          ))}
        </div>
      </div>
    )
  }

  const renderDepartmentConnections = () => {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Departman-Yönetici Bağlantıları</h2>
        <div className="space-y-4">
          {filteredData.cLevelWithDepartments.map(({ employee, departments }) => (
            <div key={employee.currAccCode} className="border rounded-lg p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-semibold text-sm">
                    {employee.firstLastName.split(' ').map(n => n[0]).join('')}
                  </span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{employee.firstLastName}</h3>
                  <p className="text-sm text-gray-600">{employee.position?.positionName}</p>
                </div>
              </div>
              
              {departments.length > 0 && (
                <div className="ml-13">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Bağlı Departmanlar ({departments.length}):</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                    {departments.map(department => (
                     <div key={department.departmentId} className="bg-green-50 border border-green-200 rounded p-2">
                       <div className="text-green-800 text-sm font-medium">{department.departmentName}</div>
                     </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <Layout>
      <Head>
        <title>Yönetim Organizasyonu - OLKA Group</title>
      </Head>
      
      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Page Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            OLKA GRUP C-LEVEL YÖNETİM
          </h1>
          <p className="text-gray-600">
            Üst düzey yönetim organizasyonu ve departman bağlantıları
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
            
            <div className="text-sm text-gray-500">
              {filteredData.cLevelWithDepartments.length} yönetici gösteriliyor
            </div>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-500 mt-2">Veriler yükleniyor...</p>
          </div>
        ) : (
          <>
            {renderOrgChart()}
            
            {/* Tüm Departmanlar */}
            {renderAllDepartments()}
            
            {/* Departman-Yönetici Bağlantıları */}
            {renderDepartmentConnections()}
          </>
        )}
        
        {/* Employee Details Modal */}
        {selectedEmployee && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Çalışan Detayları</h3>
                <button 
                  className="text-gray-500 hover:text-gray-700"
                  onClick={() => setSelectedEmployee(null)}
                >
                  ×
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900">Kişisel Bilgiler</h4>
                  <p className="text-sm text-gray-600"><strong>Ad Soyad:</strong> {selectedEmployee.firstLastName}</p>
                  <p className="text-sm text-gray-600"><strong>Çalışan Kodu:</strong> {selectedEmployee.currAccCode}</p>
                  <p className="text-sm text-gray-600"><strong>Organizasyon:</strong> {selectedEmployee.organization}</p>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900">İş Bilgileri</h4>
                  <p className="text-sm text-gray-600"><strong>Pozisyon:</strong> {selectedEmployee.position?.positionName}</p>
                  <p className="text-sm text-gray-600"><strong>Departman:</strong> {selectedEmployee.department?.departmentName}</p>
                  <p className="text-sm text-gray-600"><strong>Seviye:</strong> {selectedEmployee.levelName}</p>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900">Diğer Bilgiler</h4>
                  <p className="text-sm text-gray-600"><strong>Marka:</strong> {selectedEmployee.brand?.brandName}</p>
                  <p className="text-sm text-gray-600"><strong>Lokasyon:</strong> {selectedEmployee.location?.locationName}</p>
                  <p className="text-sm text-gray-600"><strong>Yönetici:</strong> {selectedEmployee.isManager ? 'Evet' : 'Hayır'}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}

export default dynamic(() => Promise.resolve(ManagementPage), { ssr: false })