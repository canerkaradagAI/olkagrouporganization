
'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Badge } from '../../components/ui/badge'
import { Avatar, AvatarFallback } from '../../components/ui/avatar'
import { Switch } from '../../components/ui/switch'
import { ArrowLeft, Save, User, Building2 } from 'lucide-react'

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

export default function EmployeeEditPage() {
  const router = useRouter()
  const { id } = router.query
  const [employee, setEmployee] = useState<Employee | null>(null)
  const [formData, setFormData] = useState<Partial<Employee>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (id) {
      fetchEmployeeDetail(id as string)
    }
  }, [id])

  const fetchEmployeeDetail = async (employeeId: string) => {
    try {
      setLoading(true)
      
      const response = await fetch('/api/organization/list')
      const employees = await response.json()
      
      const targetEmployee = employees.find((emp: Employee) => emp.currAccCode === employeeId)
      
      if (targetEmployee) {
        const employeeData = {
          ...targetEmployee,
          email: `${targetEmployee.firstLastName.toLowerCase().replace(' ', '.')}@olka.com`,
          phone: '+90 555 123 45 67',
          startDate: '2023-01-15',
          isBlocked: targetEmployee.currAccCode === 'EMP001'
        }
        
        setEmployee(employeeData)
        setFormData(employeeData)
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

  const handleInputChange = (field: keyof Employee, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      console.log('Saving employee data:', formData)
      
      // Success feedback
      alert('Çalışan bilgileri başarıyla güncellendi!')
      router.push(`/employee-detail/${id}`)
      
    } catch (error) {
      console.error('Error saving employee:', error)
      alert('Kaydetme sırasında hata oluştu')
    } finally {
      setSaving(false)
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
            Vazgeç
          </Button>
          <div className="flex gap-2">
            <Button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              {saving ? 'Kaydediliyor...' : 'Kaydet'}
            </Button>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Profile Preview */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader className="text-center">
                <Avatar className="h-24 w-24 mx-auto mb-4">
                  <AvatarFallback className="text-2xl bg-blue-100 text-blue-700">
                    {(formData.firstLastName || employee.firstLastName).split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <CardTitle className="text-xl">
                  {formData.firstLastName || employee.firstLastName}
                </CardTitle>
                <p className="text-gray-600">
                  {formData.positionName || employee.positionName}
                </p>
                <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                  {formData.currAccCode || employee.currAccCode}
                </code>
                <div className="mt-4 space-y-2">
                  {formData.isManager && (
                    <Badge className="bg-yellow-100 text-yellow-800">
                      Yönetici
                    </Badge>
                  )}
                  {formData.isBlocked && (
                    <Badge variant="destructive">
                      Hesap Blokeli
                    </Badge>
                  )}
                </div>
              </CardHeader>
            </Card>
          </div>

          {/* Edit Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Personal Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Kişisel Bilgiler
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="text-sm font-medium">Ad Soyad *</label>
                    <Input
                      value={formData.firstLastName || ''}
                      onChange={(e) => handleInputChange('firstLastName', e.target.value)}
                      placeholder="Ad Soyad"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Çalışan Kodu</label>
                    <Input
                      value={formData.currAccCode || ''}
                      onChange={(e) => handleInputChange('currAccCode', e.target.value)}
                      placeholder="EMP001"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">E-posta</label>
                    <Input
                      type="email"
                      value={formData.email || ''}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      placeholder="email@olka.com"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Telefon</label>
                    <Input
                      value={formData.phone || ''}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      placeholder="+90 555 123 45 67"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">İşe Başlama Tarihi</label>
                    <Input
                      type="date"
                      value={formData.startDate || ''}
                      onChange={(e) => handleInputChange('startDate', e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Organization Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Organizasyonel Bilgiler
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="text-sm font-medium">Pozisyon *</label>
                    <select
                      value={formData.positionName || ''}
                      onChange={(e) => handleInputChange('positionName', e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md"
                    >
                      <option value="">Seçiniz...</option>
                      <option value="CEO">CEO</option>
                      <option value="Satış Müdürü">Satış Müdürü</option>
                      <option value="BT Müdürü">BT Müdürü</option>
                      <option value="İK Müdürü">İK Müdürü</option>
                      <option value="Mali İşler Müdürü">Mali İşler Müdürü</option>
                      <option value="Operasyon Müdürü">Operasyon Müdürü</option>
                      <option value="Yazılım Geliştirici">Yazılım Geliştirici</option>
                      <option value="Satış Temsilcisi">Satış Temsilcisi</option>
                      <option value="İK Uzmanı">İK Uzmanı</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Departman *</label>
                    <select
                      value={formData.departmentName || ''}
                      onChange={(e) => handleInputChange('departmentName', e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md"
                    >
                      <option value="">Seçiniz...</option>
                      <option value="Bilgi İşlem">Bilgi İşlem</option>
                      <option value="İnsan Kaynakları">İnsan Kaynakları</option>
                      <option value="Satış ve Pazarlama">Satış ve Pazarlama</option>
                      <option value="Muhasebe ve Finans">Muhasebe ve Finans</option>
                      <option value="Operasyon">Operasyon</option>
                      <option value="Ar-Ge">Ar-Ge</option>
                      <option value="Kalite Kontrol">Kalite Kontrol</option>
                      <option value="Lojistik">Lojistik</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Lokasyon</label>
                    <select
                      value={formData.locationName || ''}
                      onChange={(e) => handleInputChange('locationName', e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md"
                    >
                      <option value="">Seçiniz...</option>
                      <option value="İstanbul Merkez">İstanbul Merkez</option>
                      <option value="Ankara Şubesi">Ankara Şubesi</option>
                      <option value="İzmir Şubesi">İzmir Şubesi</option>
                      <option value="Bursa Fabrikası">Bursa Fabrikası</option>
                      <option value="Antalya Mağaza">Antalya Mağaza</option>
                      <option value="Adana Depo">Adana Depo</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Marka</label>
                    <select
                      value={formData.brandName || ''}
                      onChange={(e) => handleInputChange('brandName', e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md"
                    >
                      <option value="">Seçiniz...</option>
                      <option value="Olka Tekstil">Olka Tekstil</option>
                      <option value="Olka Kids">Olka Kids</option>
                      <option value="Olka Fashion">Olka Fashion</option>
                      <option value="Olka Home">Olka Home</option>
                      <option value="Olka Premium">Olka Premium</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium">Yönetici</label>
                  <select
                    value={formData.managerName || ''}
                    onChange={(e) => handleInputChange('managerName', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  >
                    <option value="">Yönetici Seçiniz...</option>
                    <option value="Ahmet Yılmaz">Ahmet Yılmaz - CEO</option>
                    <option value="Ayşe Özkan">Ayşe Özkan - Satış Müdürü</option>
                    <option value="Mehmet Demir">Mehmet Demir - BT Müdürü</option>
                    <option value="Fatma Kaya">Fatma Kaya - İK Müdürü</option>
                  </select>
                </div>
              </CardContent>
            </Card>

            {/* Status Settings */}
            <Card>
              <CardHeader>
                <CardTitle>Durum Ayarları</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Yönetici Yetkisi</p>
                    <p className="text-sm text-gray-600">
                      Bu çalışanın yönetici olarak atanması
                    </p>
                  </div>
                  <Switch
                    checked={formData.isManager || false}
                    onCheckedChange={(checked) => handleInputChange('isManager', checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Hesap Durumu</p>
                    <p className="text-sm text-gray-600">
                      Hesabın bloke edilme durumu
                    </p>
                  </div>
                  <Switch
                    checked={formData.isBlocked || false}
                    onCheckedChange={(checked) => handleInputChange('isBlocked', checked)}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
