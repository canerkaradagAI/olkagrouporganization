import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Layout from '../components/Layout'
import OrganizationTree from '../components/OrganizationTree'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { MultiSelect } from '../components/ui/multi-select'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { SearchIcon, FilterIcon, Maximize2Icon, Minimize2Icon, Plus, Trash2 } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog'
import { Label } from '../components/ui/label'
import { Checkbox } from '../components/ui/checkbox'

interface Employee {
  currAccCode: string
  firstLastName: string
  positionName: string
  departmentName: string
  departmentId?: number | null
  managerName: string
  managerId?: string | null
  locationName: string
  locationId?: number | null
  brandName: string
  organization: string
  isManager: boolean
  hideFromChart?: boolean
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
  
  // Filter states - çoklu seçim için array olarak
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCompanyIds, setSelectedCompanyIds] = useState<(number | string)[]>([])
  const [selectedBrandIds, setSelectedBrandIds] = useState<(number | string)[]>([])
  const [selectedLocationIds, setSelectedLocationIds] = useState<(number | string)[]>([])
  const [selectedDepartmentIds, setSelectedDepartmentIds] = useState<(number | string)[]>([])

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
    
    // Çoklu brand seçimi
    if (selectedBrandIds.length > 0) {
      const brandNames = selectedBrandIds
        .map(id => filters.brands.find(b => b.id === parseInt(String(id), 10))?.name)
        .filter(Boolean) as string[]
      const brandKeys = brandNames.map(n => n.toLowerCase().trim())
      const locSet = new Set<number>()
      const depSet = new Set<number>()
      
      // Seçili brand'lerde çalışan kişilerin lokasyonlarını al
      for (const e of employees) {
        if (brandKeys.includes((e.brandName || '').toLowerCase().trim())) {
          if (typeof e.locationId === 'number') locSet.add(e.locationId)
          if (typeof e.departmentId === 'number') depSet.add(e.departmentId)
        }
      }
      
      locs = filters.locations.filter(l => locSet.has(l.id))
      deps = filters.departments.filter(d => depSet.has(d.id))
    }
    
    // Çoklu lokasyon seçimi
    if (selectedLocationIds.length > 0) {
      const selLocIds = selectedLocationIds.map(id => parseInt(String(id), 10))
      const bSet = new Set<string>()
      for (const e of employees) {
        if (e.locationId && selLocIds.includes(e.locationId) && e.brandName) {
          bSet.add(e.brandName.toLowerCase().trim())
        }
      }
      brs = filters.brands.filter(b => bSet.has(b.name.toLowerCase().trim()))
    }
    
    setVisibleLocations(locs)
    setVisibleDepartments(deps)
    setVisibleBrands(brs)
  }, [filters, employees, selectedBrandIds, selectedLocationIds])
  const [searchSuggestions, setSearchSuggestions] = useState<Employee[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [levelColors, setLevelColors] = useState<Record<string, string>>({})
  const [levelOrders, setLevelOrders] = useState<Record<string, number>>({})
  
  // Koltuk ekleme/silme state'leri
  const [showAddSeatDialog, setShowAddSeatDialog] = useState(false)
  const [selectedManagerId, setSelectedManagerId] = useState<string>('')
  const [selectedCompanyId, setSelectedCompanyId] = useState<number | string>('')
  const [selectedBrandId, setSelectedBrandId] = useState<number | string>('')
  const [selectedLocationId, setSelectedLocationId] = useState<number | string>('')
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<number | string>('')
  const [showInChart, setShowInChart] = useState(true)
  const [selectedSeats, setSelectedSeats] = useState<Set<string>>(new Set())
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<Set<string>>(new Set())

  // Callback'i useCallback ile sarmala - sonsuz loop'u önlemek için
  const handleSelectedIdsChange = useCallback((selectedIds: Set<string>) => {
    setSelectedEmployeeIds(selectedIds)
  }, [])

  useEffect(() => {
    fetchData()
  }, [])

  // Debug: filteredEmployees değişikliklerini izle
  useEffect(() => {
    console.log('📊 filteredEmployees değişti:', filteredEmployees.length, 'kişi')
    if (filteredEmployees.length > 0) {
      console.log('📊 İlk 5 filtered employee:', filteredEmployees.slice(0, 5).map(e => ({
        name: e.firstLastName,
        hideFromChart: e.hideFromChart,
        isManager: e.isManager
      })))
    }
  }, [filteredEmployees])

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

  // Apply filters - ÇOKLU SEÇİM DESTEKLİ
  useEffect(() => {
    let filtered = employees

    // Company filter - çoklu seçim
    if (selectedCompanyIds.length > 0) {
      const companyNames = selectedCompanyIds
        .map(id => filters.companies.find(c => c.id === parseInt(String(id), 10))?.name)
        .filter(Boolean) as string[]
      filtered = filtered.filter(emp => {
        const empOrg = emp.organization?.toLowerCase()
        return companyNames.some(cn => cn.toLowerCase() === empOrg)
      })
    }

    // Brand filter - çoklu seçim
    if (selectedBrandIds.length > 0) {
      const brandNames = selectedBrandIds
        .map(id => filters.brands.find(b => b.id === parseInt(String(id), 10))?.name)
        .filter(Boolean) as string[]
      filtered = filtered.filter(emp => {
        const empBrand = emp.brandName?.toLowerCase()
        return brandNames.some(bn => bn.toLowerCase() === empBrand)
      })
    }

    // Location filter - çoklu seçim
    if (selectedLocationIds.length > 0) {
      const locIds = selectedLocationIds.map(id => parseInt(String(id), 10))
      filtered = filtered.filter(emp => emp.locationId && locIds.includes(emp.locationId))
    }

    // Department filter - çoklu seçim
    if (selectedDepartmentIds.length > 0) {
      const deptIds = selectedDepartmentIds.map(id => parseInt(String(id), 10))
      filtered = filtered.filter(emp => emp.departmentId && deptIds.includes(emp.departmentId))
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
  }, [searchQuery, selectedCompanyIds, selectedBrandIds, selectedLocationIds, selectedDepartmentIds, employees, filters])

  // Debug: employees state değişikliklerini izle
  useEffect(() => {
    console.log('🔄 Employees state değişti:', employees.length, 'kişi')
  }, [employees])

  const resetFilters = () => {
    setSearchQuery('')
    setSelectedCompanyIds([])
    setSelectedBrandIds([])
    setSelectedLocationIds([])
    setSelectedDepartmentIds([])
  }

  // Arama ile eşleşen ilk kişinin ID'sini vurgulama için çıkar
  const highlightedId = (() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return undefined
    const match = employees.find(e => e.firstLastName.toLowerCase().includes(q) || e.currAccCode.toLowerCase().includes(q))
    return match?.currAccCode
  })()

  // Yönetici listesi (isManager olanlar)
  const managers = employees.filter(emp => emp.isManager)

  // Koltuk ekleme fonksiyonu
  const handleAddSeat = async () => {
    if (!selectedManagerId || !selectedCompanyId || !selectedBrandId || !selectedLocationId || !selectedDepartmentId) {
      alert('Lütfen tüm alanları doldurun')
      return
    }

    // Company name'i al
    const companyName = filters.companies.find(c => c.id === parseInt(String(selectedCompanyId), 10))?.name || String(selectedCompanyId)

    try {
      const response = await fetch('/api/organization/add-seat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          managerId: selectedManagerId,
          companyId: companyName, // Company name gönder
          brandId: selectedBrandId,
          locationId: selectedLocationId,
          departmentId: selectedDepartmentId,
          showInChart: showInChart,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Koltuk eklenirken hata oluştu')
      }

      // Başarılı - verileri yeniden yükle
      await fetchData()
      
      // Formu temizle
      setSelectedManagerId('')
      setSelectedCompanyId('')
      setSelectedBrandId('')
      setSelectedLocationId('')
      setSelectedDepartmentId('')
      setShowInChart(true)
      setShowAddSeatDialog(false)
    } catch (error: any) {
      console.error('Koltuk ekleme hatası:', error)
      alert(error.message || 'Koltuk eklenirken hata oluştu')
    }
  }

  // Koltuk silme fonksiyonu
  const handleDeleteSeats = async () => {
    if (selectedSeats.size === 0) {
      alert('Lütfen silmek için en az bir koltuk seçin')
      return
    }

    if (!confirm(`${selectedSeats.size} koltuk silinecek. Emin misiniz?`)) {
      return
    }

    try {
      const response = await fetch('/api/organization/delete-seats', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          seatIds: Array.from(selectedSeats),
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Koltuk silinirken hata oluştu')
      }

      // Başarılı - verileri yeniden yükle
      await fetchData()
      setSelectedSeats(new Set())
    } catch (error: any) {
      console.error('Koltuk silme hatası:', error)
      alert(error.message || 'Koltuk silinirken hata oluştu')
    }
  }

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
          <div className="flex gap-2">
            {(() => {
              // İki müdür seçildi mi kontrol et
              if (selectedEmployeeIds.size === 2) {
                const selectedArray = Array.from(selectedEmployeeIds)
                const emp1 = employees.find(e => e.currAccCode === selectedArray[0])
                const emp2 = employees.find(e => e.currAccCode === selectedArray[1])
                if (emp1?.isManager && emp2?.isManager) {
                  const countSubordinates = (managerId: string): number => {
                    return employees.filter(emp => emp.managerId === managerId).length
                  }
                  return (
                    <Button
                      onClick={async () => {
                        const manager1Id = selectedArray[0]
                        const manager2Id = selectedArray[1]
                        const team1 = countSubordinates(manager1Id)
                        const team2 = countSubordinates(manager2Id)
                        
                        if (confirm(
                          `İki müdür yer değiştirecek:\n\n` +
                          `${emp1.firstLastName} (${team1} kişi) ↔ ${emp2.firstLastName} (${team2} kişi)\n\n` +
                          `${emp1.firstLastName} ekibi → ${emp2.firstLastName} yöneticisine bağlanacak\n` +
                          `${emp2.firstLastName} ekibi → ${emp1.firstLastName} yöneticisine bağlanacak\n\n` +
                          `Devam etmek istiyor musunuz?`
                        )) {
                          try {
                            const response = await fetch('/api/organization/swap-managers', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ manager1Id, manager2Id })
                            })

                            if (response.ok) {
                              const result = await response.json()
                              alert(`✅ ${result.message}\n${result.manager1Name} ve ${result.manager2Name} yer değiştirildi.\nToplam ${result.totalUpdated} kişi güncellendi.`)
                              setSelectedEmployeeIds(new Set())
                              await fetchData()
                            } else {
                              const error = await response.json()
                              alert(`❌ Hata: ${error.message}`)
                            }
                          } catch (error) {
                            console.error('Swap managers error:', error)
                            alert('❌ Müdürler yer değiştirilirken hata oluştu')
                          }
                        }
                      }}
                      className="flex items-center gap-2"
                    >
                      🔄 Yer Değiştir
                    </Button>
                  )
                }
              }
              return null
            })()}
            <Button
              onClick={() => setShowAddSeatDialog(true)}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Koltuk Ekle
            </Button>
            <Button
              onClick={handleDeleteSeats}
              variant="destructive"
              className="flex items-center gap-2"
              disabled={selectedSeats.size === 0}
            >
              <Trash2 className="h-4 w-4" />
              Koltuk Sil ({selectedSeats.size})
            </Button>
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
                <label className="text-xs text-gray-600 mb-1 block">Arama</label>
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

              {/* Company Filter - Çoklu Seçim */}
              <div>
                <label className="text-xs text-gray-600 mb-1 block">Şirket</label>
                <MultiSelect
                  options={filters.companies.map(c => ({ id: c.id, name: c.name }))}
                  selected={selectedCompanyIds}
                  onSelectionChange={setSelectedCompanyIds}
                  placeholder="Tüm Şirketler"
                  allLabel="Tüm Şirketler"
                />
              </div>

              {/* Brand Filter - Çoklu Seçim */}
              <div>
                <label className="text-xs text-gray-600 mb-1 block">Marka</label>
                <MultiSelect
                  options={(visibleBrands.length ? visibleBrands : filters.brands).map(b => ({ id: b.id, name: b.name }))}
                  selected={selectedBrandIds}
                  onSelectionChange={setSelectedBrandIds}
                  placeholder="Tüm Markalar"
                  allLabel="Tüm Markalar"
                />
              </div>

              {/* Location Filter - Çoklu Seçim */}
              <div>
                <label className="text-xs text-gray-600 mb-1 block">Lokasyon</label>
                <MultiSelect
                  options={(visibleLocations.length ? visibleLocations : filters.locations).map(loc => ({ id: loc.id, name: loc.name }))}
                  selected={selectedLocationIds}
                  onSelectionChange={setSelectedLocationIds}
                  placeholder="Tüm Lokasyonlar"
                  allLabel="Tüm Lokasyonlar"
                />
              </div>

              {/* Department Filter - Çoklu Seçim */}
              <div>
                <label className="text-xs text-gray-600 mb-1 block">Departman</label>
                <MultiSelect
                  options={(visibleDepartments.length ? visibleDepartments : filters.departments).map(dept => ({ id: dept.id, name: dept.name }))}
                  selected={selectedDepartmentIds}
                  onSelectionChange={setSelectedDepartmentIds}
                  placeholder="Tüm Departmanlar"
                  allLabel="Tüm Departmanlar"
                />
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
          <OrganizationTree 
            employees={filteredEmployees} 
            highlightId={highlightedId} 
            levelColors={levelColors} 
            levelOrders={levelOrders} 
            searchQuery={searchQuery}
            selectedSeats={selectedSeats}
            onSeatSelectionChange={setSelectedSeats}
            onSelectedIdsChange={handleSelectedIdsChange}
          />
        </div>

        {/* Koltuk Ekle Dialog */}
        <Dialog open={showAddSeatDialog} onOpenChange={setShowAddSeatDialog}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Koltuk Ekle</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {/* Yönetici Seçimi */}
              <div>
                <Label htmlFor="manager">1. Yönetici *</Label>
                <Select value={selectedManagerId} onValueChange={setSelectedManagerId}>
                  <SelectTrigger id="manager" className="mt-1">
                    <SelectValue placeholder="Yönetici seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    {managers.map((manager) => (
                      <SelectItem key={manager.currAccCode} value={manager.currAccCode}>
                        {manager.firstLastName} ({manager.currAccCode})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Şirket Seçimi */}
              <div>
                <Label htmlFor="company">2. Şirket *</Label>
                <Select 
                  value={selectedCompanyId.toString()} 
                  onValueChange={(value) => setSelectedCompanyId(value)}
                >
                  <SelectTrigger id="company" className="mt-1">
                    <SelectValue placeholder="Şirket seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    {filters.companies.map((company) => (
                      <SelectItem key={company.id} value={company.id.toString()}>
                        {company.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Marka Seçimi */}
              <div>
                <Label htmlFor="brand">3. Marka *</Label>
                <Select 
                  value={selectedBrandId.toString()} 
                  onValueChange={(value) => setSelectedBrandId(value)}
                >
                  <SelectTrigger id="brand" className="mt-1">
                    <SelectValue placeholder="Marka seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    {filters.brands.map((brand) => (
                      <SelectItem key={brand.id} value={brand.id.toString()}>
                        {brand.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Lokasyon Seçimi */}
              <div>
                <Label htmlFor="location">4. Lokasyon *</Label>
                <Select 
                  value={selectedLocationId.toString()} 
                  onValueChange={(value) => setSelectedLocationId(value)}
                >
                  <SelectTrigger id="location" className="mt-1">
                    <SelectValue placeholder="Lokasyon seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    {filters.locations.map((location) => (
                      <SelectItem key={location.id} value={location.id.toString()}>
                        {location.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Departman Seçimi */}
              <div>
                <Label htmlFor="department">5. Departman *</Label>
                <Select 
                  value={selectedDepartmentId.toString()} 
                  onValueChange={(value) => setSelectedDepartmentId(value)}
                >
                  <SelectTrigger id="department" className="mt-1">
                    <SelectValue placeholder="Departman seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    {filters.departments.map((department) => (
                      <SelectItem key={department.id} value={department.id.toString()}>
                        {department.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Şemada Göster/Gizle */}
              <div className="flex items-center space-x-2 pt-2">
                <Checkbox 
                  id="showInChart" 
                  checked={showInChart}
                  onCheckedChange={(checked) => setShowInChart(checked === true)}
                />
                <Label htmlFor="showInChart" className="cursor-pointer">
                  Şemada göster
                </Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddSeatDialog(false)}>
                İptal
              </Button>
              <Button onClick={handleAddSeat}>
                Koltuk Ekle
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </div>
    </Layout>
  )
}
