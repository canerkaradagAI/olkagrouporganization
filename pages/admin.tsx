
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import { useEffect } from 'react'
import Head from 'next/head'
import Layout from '../components/Layout'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Settings, Users, Shield, Database, Server, Key } from 'lucide-react'

export default function AdminPage() {
  const sessionResult = useSession()
  const { data: session, status } = sessionResult || {}
  const router = useRouter()

  useEffect(() => {
    if (status === 'loading') return
    if (!session) {
      router.push('/auth/signin')
      return
    }
  }, [session, status, router])

  if (status === 'loading') {
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
        <title>Sistem Yönetimi - Olka Group</title>
      </Head>

      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Sistem Yönetimi</h1>
            <p className="text-gray-600">Kullanıcılar, roller ve sistem ayarları</p>
          </div>
        </div>

        {/* Admin Modules */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="cursor-pointer hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 rounded-lg bg-blue-500">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Kullanıcı Yönetimi</h3>
                  <p className="text-sm text-gray-600">Sistem kullanıcılarını yönetin</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 rounded-lg bg-green-500">
                  <Shield className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Rol ve Yetkiler</h3>
                  <p className="text-sm text-gray-600">Rol tabanlı erişim kontrolü</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 rounded-lg bg-purple-500">
                  <Database className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Veritabanı</h3>
                  <p className="text-sm text-gray-600">Veri yönetimi ve bakım</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 rounded-lg bg-orange-500">
                  <Settings className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Sistem Ayarları</h3>
                  <p className="text-sm text-gray-600">Genel sistem konfigürasyonu</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 rounded-lg bg-red-500">
                  <Server className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Sistem Durumu</h3>
                  <p className="text-sm text-gray-600">Sunucu ve servis durumu</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 rounded-lg bg-indigo-500">
                  <Key className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">API Yönetimi</h3>
                  <p className="text-sm text-gray-600">API anahtarları ve entegrasyonlar</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* System Status */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Sistem Durumu</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-green-50 rounded">
                <span className="font-medium">Veritabanı</span>
                <span className="text-sm text-green-600 font-medium">Çalışıyor</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-green-50 rounded">
                <span className="font-medium">Web Sunucusu</span>
                <span className="text-sm text-green-600 font-medium">Çalışıyor</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-green-50 rounded">
                <span className="font-medium">API Servisleri</span>
                <span className="text-sm text-green-600 font-medium">Çalışıyor</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-yellow-50 rounded">
                <span className="font-medium">Backup Servisi</span>
                <span className="text-sm text-yellow-600 font-medium">Beklemede</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Son Aktiviteler</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                <div>
                  <p className="text-sm font-medium">Yeni kullanıcı oluşturuldu</p>
                  <p className="text-xs text-gray-500">5 dakika önce</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                <div>
                  <p className="text-sm font-medium">Sistem güncellemesi tamamlandı</p>
                  <p className="text-xs text-gray-500">2 saat önce</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
                <div>
                  <p className="text-sm font-medium">Database backup alındı</p>
                  <p className="text-xs text-gray-500">4 saat önce</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Hızlı İşlemler</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline">Kullanıcı Ekle</Button>
              <Button variant="outline">Rol Oluştur</Button>
              <Button variant="outline">Sistem Logları</Button>
              <Button variant="outline">Backup Al</Button>
              <Button variant="outline">Sistem Ayarları</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  )
}
