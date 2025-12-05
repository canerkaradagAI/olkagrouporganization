import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Layout from '../components/Layout'
import { Input } from '../components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { SearchIcon } from 'lucide-react'
import { MultiSelect } from '../components/ui/multi-select'
import { Checkbox } from '../components/ui/checkbox'
import { toast } from 'react-hot-toast'

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
  brandId?: number | null
  companyName: string
  companyId?: number | null
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

export default function PersonnelListPage() {
  const router = useRouter()
  const [employees, setEmployees] = useState<Employee[]>([])
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([])
  const [filters, setFilters] = useState<FilterOptions>({ departments: [], locations: [], brands: [], companies: [] })
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(50)
  const [sortField, setSortField] = useState<keyof Employee>('firstLastName')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')

  // Filter states
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCompanyIds, setSelectedCompanyIds] = useState<(number | string)[]>([])
  const [selectedBrandIds, setSelectedBrandIds] = useState<(number | string)[]>([])
  const [selectedLocationIds, setSelectedLocationIds] = useState<(number | string)[]>([])
  const [selectedDepartmentIds, setSelectedDepartmentIds] = useState<(number | string)[]>([])
  const [showOnlyHidden, setShowOnlyHidden] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [employeesRes, filtersRes] = await Promise.all([
        fetch('/api/organization/list'),
        fetch('/api/organization/filters')
      ])
      
      if (employeesRes.ok && filtersRes.ok) {
        const employeesData = await employeesRes.json()
        const filtersData = await filtersRes.json()
        
        // hideFromChart alanını da dahil et
        const employeesWithHideFromChart = employeesData.map((emp: any) => ({
          ...emp,
          hideFromChart: emp.hideFromChart || false
        }))
        
        setEmployees(employeesWithHideFromChart)
        setFilteredEmployees(employeesWithHideFromChart)
        setFilters(filtersData)
      }
    } catch (error) {
      console.error('Veri yükleme hatası:', error)
    } finally {
      setLoading(false)
    }
  }

  // Apply filters
  useEffect(() => {
    let filtered = employees

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(emp =>
        emp.firstLastName.toLowerCase().includes(query) ||
        emp.currAccCode.toLowerCase().includes(query) ||
        emp.positionName.toLowerCase().includes(query) ||
        emp.departmentName.toLowerCase().includes(query)
      )
    }

    // Company filter
    if (selectedCompanyIds.length > 0) {
      const companyNames = selectedCompanyIds
        .map(id => filters.companies.find(c => c.id === parseInt(String(id), 10))?.name)
        .filter(Boolean) as string[]
      filtered = filtered.filter(emp => {
        const empOrg = emp.organization?.toLowerCase()
        const empCompany = emp.companyName?.toLowerCase()
        return companyNames.some(cn => 
          cn.toLowerCase() === empOrg || 
          cn.toLowerCase() === empCompany
        )
      })
    }

    // Brand filter
    if (selectedBrandIds.length > 0) {
      const brandNames = selectedBrandIds
        .map(id => filters.brands.find(b => b.id === parseInt(String(id), 10))?.name)
        .filter(Boolean) as string[]
      filtered = filtered.filter(emp => {
        const empBrand = emp.brandName?.toLowerCase()
        return brandNames.some(bn => bn.toLowerCase() === empBrand)
      })
    }

    // Location filter
    if (selectedLocationIds.length > 0) {
      const locIds = selectedLocationIds.map(id => parseInt(String(id), 10))
      filtered = filtered.filter(emp => emp.locationId && locIds.includes(emp.locationId))
    }

    // Department filter
    if (selectedDepartmentIds.length > 0) {
      const deptIds = selectedDepartmentIds.map(id => parseInt(String(id), 10))
      filtered = filtered.filter(emp => emp.departmentId && deptIds.includes(emp.departmentId))
    }

    // Hide from chart filter - sadece gizli olanları göster
    if (showOnlyHidden) {
      filtered = filtered.filter(emp => emp.hideFromChart === true)
    }

    // Sorting
    filtered.sort((a, b) => {
      const aValue = a[sortField] || ''
      const bValue = b[sortField] || ''
      const comparison = String(aValue).localeCompare(String(bValue), 'tr', { numeric: true })
      return sortOrder === 'asc' ? comparison : -comparison
    })

    setFilteredEmployees(filtered)
    setCurrentPage(1) // Reset to first page when filters change
  }, [searchQuery, selectedCompanyIds, selectedBrandIds, selectedLocationIds, selectedDepartmentIds, showOnlyHidden, employees, filters, sortField, sortOrder])

  // Pagination
  const totalPages = Math.ceil(filteredEmployees.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentEmployees = filteredEmployees.slice(startIndex, endIndex)

  const handleSort = (field: keyof Employee) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('asc')
    }
  }

  const resetFilters = () => {
    setSearchQuery('')
    setSelectedCompanyIds([])
    setSelectedBrandIds([])
    setSelectedLocationIds([])
    setSelectedDepartmentIds([])
    setShowOnlyHidden(false)
  }

  const handleToggleHideFromChart = async (currAccCode: string, currentValue: boolean) => {
    try {
      const response = await fetch('/api/employee/toggle-hide-from-chart', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currAccCode,
          hideFromChart: !currentValue,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        // Update local state
        setEmployees(prev => prev.map(emp => 
          emp.currAccCode === currAccCode 
            ? { ...emp, hideFromChart: !currentValue }
            : emp
        ))
        setFilteredEmployees(prev => prev.map(emp => 
          emp.currAccCode === currAccCode 
            ? { ...emp, hideFromChart: !currentValue }
            : emp
        ))
        toast.success('Güncellendi')
      } else {
        console.error('API Error Response:', data)
        toast.error(data.message || 'Güncelleme başarısız')
      }
    } catch (error) {
      console.error('Error toggling hideFromChart:', error)
      toast.error('Bir hata oluştu')
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
        <title>Personel Listesi - Olka Group</title>
      </Head>

      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Personel Listesi</h1>
            <p className="text-gray-600">Tüm personel bilgilerini görüntüleyin ve filtreleyin</p>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Filtreler</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
              {/* Search */}
              <div className="lg:col-span-2">
                <label className="text-xs text-gray-600 mb-1 block">Arama</label>
                <div className="relative">
                  <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Personel adı, kodu veya pozisyon ara..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Company Filter */}
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

              {/* Brand Filter */}
              <div>
                <label className="text-xs text-gray-600 mb-1 block">Marka</label>
                <MultiSelect
                  options={filters.brands.map(b => ({ id: b.id, name: b.name }))}
                  selected={selectedBrandIds}
                  onSelectionChange={setSelectedBrandIds}
                  placeholder="Tüm Markalar"
                  allLabel="Tüm Markalar"
                />
              </div>

              {/* Location Filter */}
              <div>
                <label className="text-xs text-gray-600 mb-1 block">Lokasyon</label>
                <MultiSelect
                  options={filters.locations.map(loc => ({ id: loc.id, name: loc.name }))}
                  selected={selectedLocationIds}
                  onSelectionChange={setSelectedLocationIds}
                  placeholder="Tüm Lokasyonlar"
                  allLabel="Tüm Lokasyonlar"
                />
              </div>

              {/* Department Filter */}
              <div>
                <label className="text-xs text-gray-600 mb-1 block">Departman</label>
                <MultiSelect
                  options={filters.departments.map(dept => ({ id: dept.id, name: dept.name }))}
                  selected={selectedDepartmentIds}
                  onSelectionChange={setSelectedDepartmentIds}
                  placeholder="Tüm Departmanlar"
                  allLabel="Tüm Departmanlar"
                />
              </div>
            </div>

            {/* Hide from Chart Filter */}
            <div className="mt-4 pt-4 border-t">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="showOnlyHidden"
                  checked={showOnlyHidden}
                  onCheckedChange={(checked) => setShowOnlyHidden(checked === true)}
                />
                <label
                  htmlFor="showOnlyHidden"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  Sadece gizli olanları göster
                </label>
              </div>
            </div>

            {/* Filter Actions */}
            <div className="flex items-center justify-between mt-4 pt-4 border-t">
              <p className="text-sm text-gray-600">
                {filteredEmployees.length} personel gösteriliyor
              </p>
              <Button onClick={resetFilters} variant="outline" size="sm">
                Filtreleri Temizle
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('currAccCode')}
                    >
                      <div className="flex items-center gap-2">
                        Personel Kodu
                        {sortField === 'currAccCode' && (
                          <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>
                        )}
                      </div>
                    </th>
                    <th
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('firstLastName')}
                    >
                      <div className="flex items-center gap-2">
                        Personel Adı
                        {sortField === 'firstLastName' && (
                          <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>
                        )}
                      </div>
                    </th>
                    <th
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('organization')}
                    >
                      <div className="flex items-center gap-2">
                        Şirket
                        {sortField === 'organization' && (
                          <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>
                        )}
                      </div>
                    </th>
                    <th
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('brandName')}
                    >
                      <div className="flex items-center gap-2">
                        Marka
                        {sortField === 'brandName' && (
                          <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>
                        )}
                      </div>
                    </th>
                    <th
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('locationName')}
                    >
                      <div className="flex items-center gap-2">
                        Lokasyon
                        {sortField === 'locationName' && (
                          <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>
                        )}
                      </div>
                    </th>
                    <th
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('departmentName')}
                    >
                      <div className="flex items-center gap-2">
                        Departman
                        {sortField === 'departmentName' && (
                          <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>
                        )}
                      </div>
                    </th>
                    <th
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('positionName')}
                    >
                      <div className="flex items-center gap-2">
                        Title
                        {sortField === 'positionName' && (
                          <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>
                        )}
                      </div>
                    </th>
                    <th
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('managerName')}
                    >
                      <div className="flex items-center gap-2">
                        1. Yöneticisi
                        {sortField === 'managerName' && (
                          <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>
                        )}
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Şemada Gizle
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {currentEmployees.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-4 py-8 text-center text-gray-500">
                        Personel bulunamadı
                      </td>
                    </tr>
                  ) : (
                    currentEmployees.map((employee, index) => (
                      <tr key={employee.currAccCode} className="hover:bg-gray-50">
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                          {employee.currAccCode}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                          {employee.firstLastName}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                          {employee.organization || employee.companyName || '-'}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                          {employee.brandName || '-'}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                          {employee.locationName || '-'}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                          {employee.departmentName || '-'}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                          {employee.positionName || '-'}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                          {employee.managerName || '-'}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm">
                          <Checkbox
                            checked={employee.hideFromChart || false}
                            onCheckedChange={() => handleToggleHideFromChart(employee.currAccCode, employee.hideFromChart || false)}
                          />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-4 py-3 border-t flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Sayfa {currentPage} / {totalPages} (Toplam {filteredEmployees.length} personel)
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    Önceki
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Sonraki
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  )
}

