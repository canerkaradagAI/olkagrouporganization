import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Layout from '../components/Layout'
import OrganizationTree from '../components/OrganizationTree'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { SearchIcon, FilterIcon, Maximize2Icon, Minimize2Icon } from 'lucide-react'

interface Employee {
  currAccCode: string
  firstLastName: string
  positionName: string
  departmentName: string
  departmentId?: number | null
  managerName: string
  locationName: string
  locationId?: number | null
  brandName: string
  organization: string
  isManager: boolean
}

interface FilterOptions {
  departments: { id: number; name: string }[]
  locations: { id: number; name: string }[]
  brands: { id: number; name: string }[]
  companies: { id: number; name: string }[]
}

export default function OrganizationPageV2() {
  const router = useRouter()
  
  const [viewMode, setViewMode] = useState<'tree'>('tree')
  const [employees, setEmployees] = useState<Employee[]>([])
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([])
  const [filters, setFilters] = useState<FilterOptions>({ departments: [], locations: [], brands: [], companies: [] })
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(100) // Sayfa başına 100 çalışan
  const [isFullscreen, setIsFullscreen] = useState(false)
  const contentRef = useState<React.RefObject<HTMLDivElement>>()[0] || ({} as React.RefObject<HTMLDivElement>)
  // create ref lazily
  if (!contentRef.current) (contentRef as any).current = null
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('all')
  const [selectedBrandId, setSelectedBrandId] = useState<string>('all')
  const [selectedLocationId, setSelectedLocationId] = useState<string>('all')
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string>('all')

  // Brand seçimine göre görünür lokasyon ve departman seçeneklerini daralt
  const [visibleLocations, setVisibleLocations] = useState<{ id: number; name: string }[]>([])
  const [visibleDepartments, setVisibleDepartments] = useState<{ id: number; name: string }[]>([])
  const [visibleBrands, setVisibleBrands] = useState<{ id: number; name: string }[]>([])

  // Pagination hesaplamaları
  const totalPages = Math.ceil(filteredEmployees.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentEmployees = filteredEmployees.slice(startIndex, endIndex)

  useEffect(() => {
    // Varsayılan: tümü
    let locs = filters.locations
    let deps = filters.departments
    let brs = filters.brands
    
    if (selectedBrandId !== 'all') {
      const selId = parseInt(selectedBrandId, 10)
      const brandName = filters.brands.find(b => b.id === selId)?.name || ''
      const brandKey = brandName.toLowerCase().trim()
      const locSet = new Set<number>()
      const depSet = new Set<number>()
      
      // Sadece o brand'de çalışan kişilerin lokasyonlarını al (hiyerarşi değil)
      for (const e of employees) {
        if ((e.brandName || '').toLowerCase().trim() === brandKey) {
          if (typeof e.locationId === 'number') locSet.add(e.locationId)
          if (typeof e.departmentId === 'number') depSet.add(e.departmentId)
        }
      }
      
      locs = filters.locations.filter(l => locSet.has(l.id))
      deps = filters.departments.filter(d => depSet.has(d.id))
    }
    
    // Eğer lokasyon seçiliyse o lokasyonda çalışan brand'lerle sınırlayın
    if (selectedLocationId !== 'all') {
      const selLoc = parseInt(selectedLocationId, 10)
      const bSet = new Set<string>()
      for (const e of employees) {
        if ((e.locationId ?? -1) === selLoc && e.brandName) bSet.add(e.brandName.toLowerCase().trim())
      }
      brs = filters.brands.filter(b => bSet.has(b.name.toLowerCase().trim()))
    }
    
    setVisibleLocations(locs)
    setVisibleDepartments(deps)
    setVisibleBrands(brs)
  }, [filters, employees, selectedBrandId, selectedLocationId])
  const [searchSuggestions, setSearchSuggestions] = useState<Employee[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [levelColors, setLevelColors] = useState<Record<string, string>>({})
  const [levelOrders, setLevelOrders] = useState<Record<string, number>>({})

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      console.log('📡 fetchData çağrıldı')
      
      // Fetch employees, filter options, and levels
      const [employeesRes, filtersRes, levelsRes] = await Promise.all([
        fetch('/api/organization/list'),
        fetch('/api/organization/filters'),
        fetch('/api/organization/levels'),
      ])
      
      if (employeesRes.ok && filtersRes.ok) {
        const employeesData = await employeesRes.json()
        const filtersData = await filtersRes.json()
        
        console.log('📡 Employees data alındı:', employeesData.length, 'kişi')
        setEmployees(employeesData)
        setFilteredEmployees(employeesData)
        setFilters(filtersData)
      }

      if (levelsRes.ok) {
        const levels = await levelsRes.json()
        const map: Record<string, string> = {}
        const orderMap: Record<string, number> = {}
        for (const l of levels) {
          const key = (l.levelName as string).toLowerCase().trim()
          if (l.color) map[key] = l.color
          if (typeof l.levelOrder === 'number') orderMap[key] = l.levelOrder
        }
        setLevelColors(map)
        setLevelOrders(orderMap)
      }
    } catch (error) {
      console.error('Veri yükleme hatası:', error)
    } finally {
      setLoading(false)
    }
  }

  // Yazdıkça öneriler: firstLastName veya currAccCode içinde eşleşen ilk 10 kişi
  useEffect(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) {
      setSearchSuggestions([])
      setShowSuggestions(false)
      return
    }
    const list = employees
      .filter(e =>
        e.firstLastName.toLowerCase().includes(q) ||
        e.currAccCode.toLowerCase().includes(q)
      )
      .slice(0, 10)
    setSearchSuggestions(list)
    setShowSuggestions(true)
  }, [searchQuery, employees])

  // Organizasyon hiyerarşisini bulma fonksiyonu
  // - Aranan kişinin TÜM ALT EKİBİ (descendants)
  // - Yalnızca ÜST ZİNCİR (managers chain) eklenir; yöneticilerin diğer ekipleri eklenmez
  const findOrganizationHierarchy = (searchName: string, allEmployees: Employee[]): Employee[] => {
    console.log('🔍 findOrganizationHierarchy çağrıldı:', searchName, 'toplam çalışan:', allEmployees.length)

    const foundEmployee = allEmployees.find(emp =>
      emp.firstLastName.toLowerCase().includes(searchName.toLowerCase()) ||
      emp.currAccCode.toLowerCase().includes(searchName.toLowerCase())
    )

    console.log('👤 Bulunan çalışan:', foundEmployee?.firstLastName || 'YOK')
    if (!foundEmployee) return []

    const result = new Set<string>()

    // 1) Üst zinciri ekle (manager -> manager ...), ancak onların diğer ekiplerini ekleme
    let current: Employee | undefined = foundEmployee
    while (current && current.managerName) {
      const manager = allEmployees.find(emp => emp.firstLastName === current!.managerName)
      if (!manager) break
      result.add(manager.currAccCode)
      current = manager
    }

    // 2) Alt ekip: yalnızca aranan kişinin altındaki tüm kişiler
    const managerToSubs = new Map<string, Employee[]>()
    for (const emp of allEmployees) {
      if (!emp.managerName) continue
      const list = managerToSubs.get(emp.managerName) || []
      list.push(emp)
      managerToSubs.set(emp.managerName, list)
    }

    const stack: Employee[] = [foundEmployee]
    while (stack.length) {
      const node = stack.pop() as Employee
      if (result.has(node.currAccCode)) {
        // zaten eklendiyse geç
      }
      result.add(node.currAccCode)
      const subs = managerToSubs.get(node.firstLastName) || []
      for (const sub of subs) stack.push(sub)
    }

    console.log('🌳 Hiyerarşi sonucu:', result.size, 'kişi')
    return allEmployees.filter(emp => result.has(emp.currAccCode))
  }

  // Normalize helper (case/trim-insensitive)
  const norm = (v: string) => (v || '').toString().trim().toLowerCase()

  // Apply filters - BASIT VE TEMİZ
  useEffect(() => {
    let filtered = employees

    // Company filter
    if (selectedCompanyId !== 'all') {
      const companyName = filters.companies.find(c => c.id === parseInt(selectedCompanyId))?.name
      if (companyName) {
        filtered = filtered.filter(emp => emp.organization?.toLowerCase() === companyName.toLowerCase())
      }
    }

    // Brand filter - BASIT
    if (selectedBrandId !== 'all') {
      const brandName = filters.brands.find(b => b.id === parseInt(selectedBrandId))?.name
      if (brandName) {
        filtered = filtered.filter(emp => emp.brandName?.toLowerCase() === brandName.toLowerCase())
      }
    }

    // Location filter
    if (selectedLocationId !== 'all') {
      filtered = filtered.filter(emp => emp.locationId === parseInt(selectedLocationId))
    }

    // Department filter
    if (selectedDepartmentId !== 'all') {
      filtered = filtered.filter(emp => emp.departmentId === parseInt(selectedDepartmentId))
    }

    // Search filter - sadece arama yapıldığında hiyerarşi göster
    if (searchQuery.trim()) {
      filtered = findOrganizationHierarchy(searchQuery, filtered)
    } else {
      // Filtreleme yapıldığında, filtrelenen çalışanların üst zincirini de ekle
      const originalFilteredCount = filtered.length
      if (originalFilteredCount > 0 && originalFilteredCount < employees.length) {
        // Filtrelenen çalışanların üst zincirini bul
        const result = new Set<string>()
        
        // Her filtrelenen çalışan için üst zinciri ekle
        for (const emp of filtered) {
          result.add(emp.currAccCode)
          
          // Üst zinciri ekle
          let current: Employee | undefined = emp
          while (current && current.managerName) {
            const manager = employees.find(e => e.firstLastName === current!.managerName)
            if (!manager) break
            result.add(manager.currAccCode)
            current = manager
          }
        }
        
        // Sonucu filtrele
        filtered = employees.filter(emp => result.has(emp.currAccCode))
      }
    }

    setFilteredEmployees(filtered)
  }, [searchQuery, selectedCompanyId, selectedBrandId, selectedLocationId, selectedDepartmentId, employees, filters])

  // Debug: employees state değişikliklerini izle
  useEffect(() => {
    console.log('🔄 Employees state değişti:', employees.length, 'kişi')
  }, [employees])

  const resetFilters = () => {
    setSearchQuery('')
    setSelectedCompanyId('all')
    setSelectedBrandId('all')
    setSelectedLocationId('all')
    setSelectedDepartmentId('all')
  }

  // Arama ile eşleşen ilk kişinin ID'sini vurgulama için çıkar
  const highlightedId = (() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return undefined
    const match = employees.find(e => e.firstLastName.toLowerCase().includes(q) || e.currAccCode.toLowerCase().includes(q))
    return match?.currAccCode
  })()

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2">Yükleniyor...</span>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <Head>
        <title>Organizasyon Şeması - Olka Group</title>
      </Head>

      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Organizasyon Şeması</h1>
            <p className="text-gray-600">Şirket organizasyon yapısını görüntüleyin ve yönetin</p>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <FilterIcon className="h-4 w-4" />
              Filtreler
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
              {/* Search */}
              <div className="lg:col-span-2">
                <div className="relative">
                  <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Çalışan adı veya kodu ara..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => { if (searchSuggestions.length) setShowSuggestions(true) }}
                    className="pl-10"
                  />
                  {showSuggestions && searchSuggestions.length > 0 && (
                    <div className="absolute mt-1 left-0 right-0 z-20 max-h-72 overflow-auto rounded-md border bg-white shadow">
                      {searchSuggestions.map((s) => (
                        <button
                          key={s.currAccCode}
                          type="button"
                          onMouseDown={(e) => { e.preventDefault(); setSearchQuery(s.firstLastName); setShowSuggestions(false) }}
                          className="w-full text-left px-3 py-2 hover:bg-gray-100"
                        >
                          <div className="text-sm font-medium text-gray-900">{s.firstLastName}</div>
                          <div className="text-xs text-gray-500">{s.currAccCode} · {s.departmentName}</div>
                        </button>
                      ))}
                      {/* Serbest arama – yazılan metni seçenek olarak en sonda göster */}
                      <button
                        type="button"
                        onMouseDown={(e) => { e.preventDefault(); setShowSuggestions(false) }}
                        className="w-full text-left px-3 py-2 border-t hover:bg-gray-50 text-sm text-gray-700"
                      >
                        "{searchQuery}" ile ara
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Company Filter (Company) */}
              <div>
                <select 
                  value={selectedCompanyId} 
                  onChange={(e) => setSelectedCompanyId(e.target.value)}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="all">Tüm Şirketler</option>
                  {filters.companies.map((company) => (
                    <option key={company.id} value={company.id.toString()}>{company.name}</option>
                  ))}
                </select>
              </div>

              {/* Brand Filter - lokasyon bağımlı */}
              <div>
                <select 
                  value={selectedBrandId}
                  onChange={(e) => setSelectedBrandId(e.target.value)}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="all">Tüm Markalar</option>
                  {(visibleBrands.length ? visibleBrands : filters.brands).map((b) => (
                    <option key={b.id} value={b.id.toString()}>{b.name}</option>
                  ))}
                </select>
              </div>

              {/* Location Filter (ID) */}
              <div>
                <select 
                  value={selectedLocationId} 
                  onChange={(e) => setSelectedLocationId(e.target.value)}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="all">Tüm Lokasyonlar</option>
                  {(visibleLocations.length ? visibleLocations : filters.locations).map((loc) => (
                    <option key={loc.id} value={loc.id.toString()}>
                      {loc.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Department Filter (ID) */}
              <div>
                <select 
                  value={selectedDepartmentId} 
                  onChange={(e) => setSelectedDepartmentId(e.target.value)}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="all">Tüm Departmanlar</option>
                  {(visibleDepartments.length ? visibleDepartments : filters.departments).map((dept) => (
                    <option key={dept.id} value={dept.id.toString()}>
                      {dept.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Filter Actions */}
            <div className="flex items-center justify-between mt-4 pt-4 border-t">
              <p className="text-sm text-gray-600">
                {filteredEmployees.length} çalışan gösteriliyor
              </p>
              <Button onClick={resetFilters} variant="outline" size="sm">
                Filtreleri Temizle
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Content */}
        <div className="flex justify-end mb-2">
          <Button
            onClick={() => {
              const el = contentRef.current as any
              if (!document.fullscreenElement) {
                el?.requestFullscreen?.()
                setIsFullscreen(true)
              } else {
                document.exitFullscreen?.()
                setIsFullscreen(false)
              }
            }}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            {isFullscreen ? <Minimize2Icon className="h-4 w-4" /> : <Maximize2Icon className="h-4 w-4" />}
            {isFullscreen ? 'Tam Ekrandan Çık' : 'Tam Ekran'}
          </Button>
        </div>
        <div ref={contentRef as any} className="bg-white rounded-lg border shadow-sm">
          <OrganizationTree employees={filteredEmployees} highlightId={highlightedId} levelColors={levelColors} levelOrders={levelOrders} />
        </div>

      </div>
    </Layout>
  )
}
