
'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Badge } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'
import { Avatar, AvatarFallback } from '../../components/ui/avatar'
import { 
  User, 
  Building2, 
  MapPin, 
  Award, 
  Crown, 
  Calendar, 
  Mail, 
  Phone,
  Edit,
  Trash2,
  ArrowLeft,
  UserCheck,
  History
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
  email?: string
  phone?: string
  startDate?: string
  isBlocked?: boolean
}

interface Assignment {
  id: string
  positionName: string
  assignmentType: string
  startDate: string
  endDate?: string
  isActive: boolean
}

export default function EmployeeDetailPage() {
  const router = useRouter()
  const { id } = router.query
  const [employee, setEmployee] = useState<Employee | null>(null)
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (id) {
      fetchEmployeeDetail(id as string)
    }
  }, [id])

  const fetchEmployeeDetail = async (employeeId: string) => {
    try {
      setLoading(true)
      
      // Fetch all employees first and find the specific one
      const response = await fetch('/api/organization/list')
      const employees = await response.json()
      
      const targetEmployee = employees.find((emp: Employee) => emp.currAccCode === employeeId)
      
      if (targetEmployee) {
        setEmployee({
          ...targetEmployee,
          email: `${targetEmployee.firstLastName.toLowerCase().replace(' ', '.')}@olka.com`,
          phone: '+90 555 123 45 67',
          startDate: '2023-01-15',
          isBlocked: targetEmployee.currAccCode === 'EMP001'
        })
        
        // Mock assignments data
        setAssignments([
          {
            id: '1',
            positionName: targetEmployee.positionName,
            assignmentType: 'Asaleten',
            startDate: '2023-01-15',
            isActive: true
          },
          {
            id: '2',
            positionName: 'Geçici Proje Lideri',
            assignmentType: 'Vekaleten',
            startDate: '2024-06-01',
            endDate: '2024-12-31',
            isActive: true
          }
        ])
      } else {
        setError('Çalışan bulunamadı')
      }
    } catch (error) {
      console.error('Error fetching employee:', error)
      setError('Veri yüklenirken hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = () => {
    router.push(`/employee-edit/${id}`)
  }

  const handleDelete = () => {
    if (confirm('Bu çalışanı silmek istediğinizden emin misiniz?')) {
      // Delete logic here
      console.log('Delete employee:', id)
      router.push('/employees')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Yükleniyor...</span>
      </div>
    )
  }

  if (error || !employee) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-6 text-center">
            <p className="text-red-600 mb-4">{error || 'Çalışan bulunamadı'}</p>
            <Button onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Geri Dön
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Geri Dön
          </Button>
          <div className="flex gap-2">
            <Button onClick={handleEdit} className="flex items-center gap-2">
              <Edit className="h-4 w-4" />
              Düzenle
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              className="flex items-center gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Sil
            </Button>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Profile Card */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader className="text-center">
                {/* Avatar with initials */}
                <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-xl">
                  <span className="text-white font-bold text-2xl">
                    {employee.firstLastName.split(' ').map(n => n[0]).join('')}
                  </span>
                </div>
                
                {/* 3 lines of information */}
                <div className="space-y-2 mb-4">
                  {/* Department - Top */}
                  <div className="text-sm text-gray-800 font-bold">
                    {employee.departmentName}
                  </div>
                  
                  {/* Employee Name - Middle */}
                  <CardTitle className="text-xl">{employee.firstLastName}</CardTitle>
                  
                  {/* Position - Bottom */}
                  <p className="text-gray-600">{employee.positionName}</p>
                </div>
                
                <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                  {employee.currAccCode}
                </code>
                {employee.isManager && (
                  <Badge className="mt-2 bg-yellow-100 text-yellow-800">
                    <Crown className="h-3 w-3 mr-1" />
                    Yönetici
                  </Badge>
                )}
                {employee.isBlocked && (
                  <Badge variant="destructive" className="mt-2">
                    Hesap Blokeli
                  </Badge>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-gray-500" />
                  <span className="text-sm">{employee.email}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-gray-500" />
                  <span className="text-sm">{employee.phone}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <span className="text-sm">Başlama: {employee.startDate}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Details & Assignments */}
          <div className="lg:col-span-2 space-y-6">
            {/* Organization Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Organizasyonel Bilgiler
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Departman</label>
                    <p className="mt-1 font-medium">{employee.departmentName}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Lokasyon</label>
                    <p className="mt-1 font-medium flex items-center gap-1">
                      <MapPin className="h-4 w-4 text-gray-500" />
                      {employee.locationName}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Marka</label>
                    <p className="mt-1 font-medium flex items-center gap-1">
                      <Award className="h-4 w-4 text-gray-500" />
                      {employee.brandName}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Doğrudan Yönetici</label>
                    <p className="mt-1 font-medium">
                      {employee.managerName || 'Doğrudan yönetici yok'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Assignment History */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="h-5 w-5" />
                  Atama Geçmişi
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {assignments.map((assignment) => (
                    <div
                      key={assignment.id}
                      className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium">{assignment.positionName}</h4>
                          <p className="text-sm text-gray-600 mt-1">
                            {assignment.startDate}
                            {assignment.endDate && ` - ${assignment.endDate}`}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={assignment.assignmentType === 'Kalıcı' ? 'default' : 'secondary'}
                          >
                            {assignment.assignmentType}
                          </Badge>
                          {assignment.isActive && (
                            <Badge variant="outline" className="bg-green-50 text-green-700">
                              <UserCheck className="h-3 w-3 mr-1" />
                              Aktif
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Performance & Notes */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Notlar ve Değerlendirmeler
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Son Performans Notu</label>
                    <div className="mt-2 flex items-center gap-2">
                      <Badge className="bg-green-100 text-green-800">Mükemmel</Badge>
                      <span className="text-sm text-gray-600">2024 Yıl Sonu Değerlendirmesi</span>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Özel Notlar</label>
                    <p className="mt-1 text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                      {employee.isManager 
                        ? "Liderlik becerileri yüksek, ekip yönetiminde başarılı. Stratejik düşünme konusunda güçlü."
                        : "İşe bağlı, zamanında görev teslimi yapıyor. Takım çalışması konusunda olumlu."
                      }
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
