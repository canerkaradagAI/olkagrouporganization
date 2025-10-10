
import React, { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { 
  UserIcon, 
  ChevronUpIcon, 
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CrownIcon,
  FilterIcon,
  XIcon
} from 'lucide-react'

interface Employee {
  currAccCode: string
  firstLastName: string
  positionName: string
  departmentName: string
  managerName: string
  locationName: string
  brandName: string
  isManager: boolean
}

interface OrganizationListProps {
  employees: Employee[]
}

type SortField = 'currAccCode' | 'firstLastName' | 'positionName' | 'departmentName' | 'managerName' | 'locationName' | 'brandName'
type SortOrder = 'asc' | 'desc'

export default function OrganizationList({ employees }: OrganizationListProps) {
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(25)
  const [sortField, setSortField] = useState<SortField>('firstLastName')
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc')
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('grid')
  
  // Filtreleme state'leri
  const [filters, setFilters] = useState({
    currAccCode: '',
    firstLastName: '',
    positionName: '',
    departmentName: '',
    managerName: '',
    locationName: '',
    brandName: ''
  })

  // Filtreleme mantığı
  const filteredEmployees = useMemo(() => {
    return employees.filter(employee => {
      return Object.entries(filters).every(([key, value]) => {
        if (!value || value === 'all') return true
        const employeeValue = employee[key as keyof Employee] || ''
        return employeeValue.toString().toLowerCase().includes(value.toLowerCase())
      })
    })
  }, [employees, filters])

  // Sorting logic
  const sortedEmployees = [...filteredEmployees].sort((a, b) => {
    const aValue = a[sortField] || ''
    const bValue = b[sortField] || ''
    
    const comparison = aValue.localeCompare(bValue, 'tr', { numeric: true })
    return sortOrder === 'asc' ? comparison : -comparison
  })

  // Benzersiz değerleri çıkar (filtreleme için)
  const uniqueValues = useMemo(() => {
    return {
      positionName: [...new Set(employees.map(e => e.positionName).filter(Boolean))].sort(),
      departmentName: [...new Set(employees.map(e => e.departmentName).filter(Boolean))].sort(),
      managerName: [...new Set(employees.map(e => e.managerName).filter(Boolean))].sort(),
      locationName: [...new Set(employees.map(e => e.locationName).filter(Boolean))].sort(),
      brandName: [...new Set(employees.map(e => e.brandName).filter(Boolean))].sort()
    }
  }, [employees])

  // Pagination logic
  const totalPages = Math.ceil(sortedEmployees.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedEmployees = sortedEmployees.slice(startIndex, startIndex + itemsPerPage)

  const handleSort = (field: SortField) => {
    if (field === sortField) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('asc')
    }
    setCurrentPage(1) // Reset to first page when sorting
  }

  const updateFilter = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
    setCurrentPage(1)
  }

  const clearAllFilters = () => {
    setFilters({
      currAccCode: '',
      firstLastName: '',
      positionName: '',
      departmentName: '',
      managerName: '',
      locationName: '',
      brandName: ''
    })
    setCurrentPage(1)
  }

  const hasActiveFilters = Object.values(filters).some(value => value !== '')

  const SortButton = ({ field, children }: { field: SortField, children: React.ReactNode }) => (
    <button
      onClick={() => handleSort(field)}
      className="flex items-center gap-1 hover:bg-gray-50 px-2 py-1 rounded text-left w-full font-medium"
    >
      {children}
      {sortField === field && (
        sortOrder === 'asc' ? 
          <ChevronUpIcon className="h-4 w-4" /> : 
          <ChevronDownIcon className="h-4 w-4" />
      )}
    </button>
  )

  if (!employees.length) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <UserIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600">Gösterilecek çalışan bulunamadı</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
          <span>Çalışan Listesi</span>
            <Badge variant="secondary">{filteredEmployees.length} çalışan</Badge>
            {hasActiveFilters && (
              <Badge variant="destructive" className="flex items-center gap-1">
                <FilterIcon className="h-3 w-3" />
                Filtrelenmiş
              </Badge>
            )}
        </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => setViewMode(viewMode === 'table' ? 'grid' : 'table')}
              variant="outline"
              size="sm"
            >
              {viewMode === 'table' ? 'Grid Görünümü' : 'Tablo Görünümü'}
            </Button>
            {hasActiveFilters && (
              <Button onClick={clearAllFilters} variant="outline" size="sm">
                <XIcon className="h-4 w-4 mr-1" />
                Filtreleri Temizle
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {/* Filtreleme Başlıkları */}
        <div className="bg-gray-50 border-b p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Çalışan Kodu</label>
              <Input
                placeholder="Kod ara..."
                value={filters.currAccCode}
                onChange={(e) => updateFilter('currAccCode', e.target.value)}
                className="text-sm"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Ad Soyad</label>
              <Input
                placeholder="İsim ara..."
                value={filters.firstLastName}
                onChange={(e) => updateFilter('firstLastName', e.target.value)}
                className="text-sm"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Pozisyon</label>
              <Select value={filters.positionName || undefined} onValueChange={(value) => updateFilter('positionName', value)}>
                <SelectTrigger className="text-sm">
                  <SelectValue placeholder="Pozisyon seç..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tümü</SelectItem>
                  {uniqueValues.positionName.map(pos => (
                    <SelectItem key={pos} value={pos}>{pos}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Departman</label>
              <Select value={filters.departmentName || undefined} onValueChange={(value) => updateFilter('departmentName', value)}>
                <SelectTrigger className="text-sm">
                  <SelectValue placeholder="Departman seç..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tümü</SelectItem>
                  {uniqueValues.departmentName.map(dept => (
                    <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Yönetici</label>
              <Select value={filters.managerName || undefined} onValueChange={(value) => updateFilter('managerName', value)}>
                <SelectTrigger className="text-sm">
                  <SelectValue placeholder="Yönetici seç..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tümü</SelectItem>
                  {uniqueValues.managerName.map(manager => (
                    <SelectItem key={manager} value={manager}>{manager}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Lokasyon</label>
              <Select value={filters.locationName || undefined} onValueChange={(value) => updateFilter('locationName', value)}>
                <SelectTrigger className="text-sm">
                  <SelectValue placeholder="Lokasyon seç..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tümü</SelectItem>
                  {uniqueValues.locationName.map(location => (
                    <SelectItem key={location} value={location}>{location}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Marka</label>
              <Select value={filters.brandName || undefined} onValueChange={(value) => updateFilter('brandName', value)}>
                <SelectTrigger className="text-sm">
                  <SelectValue placeholder="Marka seç..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tümü</SelectItem>
                  {uniqueValues.brandName.map(brand => (
                    <SelectItem key={brand} value={brand}>{brand}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Grid Görünümü */}
        {viewMode === 'grid' ? (
          <div className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {paginatedEmployees.map((employee) => (
                <Card key={employee.currAccCode} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <UserIcon className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{employee.firstLastName}</h3>
                          <code className="text-xs text-gray-500">{employee.currAccCode}</code>
                        </div>
                      </div>
                      {employee.isManager && (
                        <CrownIcon className="h-5 w-5 text-yellow-500" title="Yönetici" />
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <div>
                        <Badge variant="outline" className="text-xs">{employee.positionName}</Badge>
                      </div>
                      <div className="text-sm text-gray-600">
                        <div><strong>Departman:</strong> {employee.departmentName}</div>
                        <div><strong>Lokasyon:</strong> {employee.locationName}</div>
                        <div><strong>Marka:</strong> {employee.brandName}</div>
                        {employee.managerName && (
                          <div><strong>Yönetici:</strong> {employee.managerName}</div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ) : (
          /* Tablo Görünümü */
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left p-3 font-medium text-gray-900">
                  <SortButton field="currAccCode">Çalışan Kodu</SortButton>
                </th>
                <th className="text-left p-3 font-medium text-gray-900">
                  <SortButton field="firstLastName">Ad Soyad</SortButton>
                </th>
                <th className="text-left p-3 font-medium text-gray-900">
                  <SortButton field="positionName">Pozisyon</SortButton>
                </th>
                <th className="text-left p-3 font-medium text-gray-900">
                  <SortButton field="departmentName">Departman</SortButton>
                </th>
                <th className="text-left p-3 font-medium text-gray-900">
                  <SortButton field="managerName">Yönetici</SortButton>
                </th>
                <th className="text-left p-3 font-medium text-gray-900">
                  <SortButton field="locationName">Lokasyon</SortButton>
                </th>
                <th className="text-left p-3 font-medium text-gray-900">
                  <SortButton field="brandName">Marka</SortButton>
                </th>
              </tr>
            </thead>
            <tbody>
              {paginatedEmployees.map((employee, index) => (
                <tr 
                  key={employee.currAccCode}
                  className={`border-b hover:bg-gray-50 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-25'}`}
                >
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <code className="bg-gray-100 px-2 py-1 rounded text-sm">
                        {employee.currAccCode}
                      </code>
                      {employee.isManager && (
                        <span title="Yönetici">
                          <CrownIcon className="h-4 w-4 text-yellow-500" />
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <UserIcon className="h-4 w-4 text-blue-600" />
                      </div>
                      <span className="font-medium">{employee.firstLastName}</span>
                    </div>
                  </td>
                  <td className="p-3">
                    <Badge variant="outline">{employee.positionName}</Badge>
                  </td>
                  <td className="p-3 text-gray-700">{employee.departmentName}</td>
                  <td className="p-3 text-gray-700">
                    {employee.managerName || (
                      <span className="text-gray-400 italic">Yönetici yok</span>
                    )}
                  </td>
                  <td className="p-3 text-gray-700">{employee.locationName}</td>
                  <td className="p-3">
                    <Badge variant="secondary">{employee.brandName}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span>Sayfa başına:</span>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value))
                  setCurrentPage(1)
                }}
                className="border rounded px-2 py-1"
              >
                <option value={12}>12</option>
                <option value={24}>24</option>
                <option value={48}>48</option>
                <option value={96}>96</option>
              </select>
              <span>
                {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredEmployees.length)} / {filteredEmployees.length} kayıt
              </span>
            </div>

            <div className="flex items-center gap-1">
              <Button
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                variant="outline"
                size="sm"
              >
                İlk
              </Button>
              <Button
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
                variant="outline"
                size="sm"
              >
                <ChevronLeftIcon className="h-4 w-4" />
              </Button>
              
              <div className="flex items-center gap-1 mx-2">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum: number
                  if (totalPages <= 5) {
                    pageNum = i + 1
                  } else if (currentPage <= 3) {
                    pageNum = i + 1
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i
                  } else {
                    pageNum = currentPage - 2 + i
                  }

                  return (
                    <Button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      variant={currentPage === pageNum ? "default" : "outline"}
                      size="sm"
                      className="w-8 h-8 p-0"
                    >
                      {pageNum}
                    </Button>
                  )
                })}
              </div>

              <Button
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                variant="outline"
                size="sm"
              >
                <ChevronRightIcon className="h-4 w-4" />
              </Button>
              <Button
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                variant="outline"
                size="sm"
              >
                Son
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
