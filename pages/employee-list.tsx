
'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Avatar, AvatarFallback } from '../components/ui/avatar'
import { 
  Users, 
  Search, 
  Plus, 
  Edit, 
  Eye, 
  Trash2,
  Filter,
  Crown,
  MapPin,
  Building,
  Award,
  Mail,
  Phone
} from 'lucide-react'

interface Employee {
  currAccCode: string
  firstLastName: string
  positionName: string
  departmentName: string
  managerName: string
  locationName: string
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

export default function EmployeeListPage() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([])
  const [filters, setFilters] = useState<FilterOptions>({ departments: [], locations: [], brands: [], companies: [] })
  const [loading, setLoading] = useState(true)
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all')
  const [selectedLocation, setSelectedLocation] = useState<string>('all')
  const [selectedBrand, setSelectedBrand] = useState<string>('all')

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
        
        setEmployees(employeesData)
        setFilteredEmployees(employeesData)
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
      filtered = filtered.filter(emp => 
        emp.firstLastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.currAccCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.positionName.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Department filter
    if (selectedDepartment !== 'all') {
      filtered = filtered.filter(emp => emp.departmentName === selectedDepartment)
    }

    // Location filter
    if (selectedLocation !== 'all') {
      filtered = filtered.filter(emp => emp.locationName === selectedLocation)
    }

    // Company filter (organization field)
    if (selectedBrand !== 'all') {
      filtered = filtered.filter(emp => emp.organization === selectedBrand)
    }

    setFilteredEmployees(filtered)
  }, [searchQuery, selectedDepartment, selectedLocation, selectedBrand, employees])

  const handleViewDetails = (employeeId: string) => {
    window.open(`/employee-detail/${employeeId}`, '_blank')
  }

  const handleEdit = (employeeId: string) => {
    window.open(`/employee-edit/${employeeId}`, '_blank')
  }

  const handleDelete = (employeeId: string) => {
    if (confirm('Bu çalışanı silmek istediğinizden emin misiniz?')) {
      console.log('Delete employee:', employeeId)
      // Delete API call would go here
    }
  }

  const resetFilters = () => {
    setSearchQuery('')
    setSelectedDepartment('all')
    setSelectedLocation('all')
    setSelectedBrand('all')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Yükleniyor...</span>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Users className="h-8 w-8 text-blue-600" />
              Çalışan Yönetimi
            </h1>
            <p className="text-gray-600 mt-2">
              Tüm çalışanları görüntüleyin ve yönetin
            </p>
          </div>
          <Button className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Yeni Çalışan
          </Button>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Filter className="h-4 w-4" />
              Filtreler
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {/* Search */}
              <div className="lg:col-span-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Ad, kod veya pozisyon ara..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Company Filter */}
              <div>
                <select 
                  value={selectedBrand} 
                  onChange={(e) => setSelectedBrand(e.target.value)}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="all">Tüm Şirketleri</option>
                  {filters.companies.map((company) => (
                    <option key={company.id} value={company.name}>
                      {company.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Location Filter */}
              <div>
                <select 
                  value={selectedLocation} 
                  onChange={(e) => setSelectedLocation(e.target.value)}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="all">Tüm Lokasyonlar</option>
                  {filters.locations.map((loc) => (
                    <option key={loc.id} value={loc.name}>
                      {loc.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Department Filter */}
              <div>
                <select 
                  value={selectedDepartment} 
                  onChange={(e) => setSelectedDepartment(e.target.value)}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="all">Tüm Departmanlar</option>
                  {filters.departments.map((dept) => (
                    <option key={dept.id} value={dept.name}>
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

        {/* Employee Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredEmployees.map((employee) => (
            <Card key={employee.currAccCode} className="hover:shadow-lg transition-shadow duration-200">
              <CardContent className="p-6">
                <div className="flex flex-col items-center text-center space-y-4">
                  {/* Avatar with initials */}
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg">
                    <span className="text-white font-bold text-lg">
                      {employee.firstLastName.split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>
                  
                  {/* 3 lines of information */}
                  <div className="space-y-2 w-full">
                    {/* Department - Top */}
                    <div className="text-sm text-gray-800 font-bold">
                      {employee.departmentName}
                    </div>
                    
                    {/* Employee Name - Middle */}
                    <div className="text-lg font-semibold text-gray-900">
                      {employee.firstLastName}
                    </div>
                    
                    {/* Position - Bottom */}
                    <div className="text-sm text-gray-500">
                      {employee.positionName}
                    </div>
                  </div>

                  {/* Manager badge if applicable */}
                  {employee.isManager && (
                    <Badge className="bg-yellow-100 text-yellow-800">
                      <Crown className="h-3 w-3 mr-1" />
                      Yönetici
                    </Badge>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-3 border-t">
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleViewDetails(employee.currAccCode)}
                    className="flex items-center gap-1 flex-1"
                  >
                    <Eye className="h-3 w-3" />
                    Görüntüle
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleEdit(employee.currAccCode)}
                    className="flex items-center gap-1 flex-1"
                  >
                    <Edit className="h-3 w-3" />
                    Düzenle
                  </Button>
                  <Button 
                    size="sm" 
                    variant="destructive"
                    onClick={() => handleDelete(employee.currAccCode)}
                    className="flex items-center gap-1"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Empty State */}
        {filteredEmployees.length === 0 && !loading && (
          <Card className="text-center py-12">
            <CardContent>
              <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Çalışan bulunamadı
              </h3>
              <p className="text-gray-600 mb-6">
                Arama kriterlerinize uygun çalışan bulunmamaktadır.
              </p>
              <Button onClick={resetFilters} variant="outline">
                Filtreleri Temizle
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
