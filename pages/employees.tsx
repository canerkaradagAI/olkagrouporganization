
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import { useEffect } from 'react'
import Head from 'next/head'
import Layout from '../components/Layout'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Users, Plus, Search, Filter } from 'lucide-react'
import Link from 'next/link'

export default function EmployeesPage() {
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
        <title>Çalışanlar - Olka Group</title>
      </Head>

      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Çalışan Yönetimi</h1>
            <p className="text-gray-600">Çalışan bilgilerini görüntüleyin ve yönetin</p>
          </div>
          
          <div className="flex gap-2">
            <Link href="/employee-list">
              <Button variant="outline" className="flex items-center gap-2">
                <Search className="h-4 w-4" />
                Çalışan Listesi
              </Button>
            </Link>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Yeni Çalışan
            </Button>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link href="/employee-list">
            <Card className="cursor-pointer hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="p-3 rounded-lg bg-blue-500">
                    <Users className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Çalışan Listesi</h3>
                    <p className="text-sm text-gray-600">Tüm çalışanları görüntüle</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Card className="cursor-pointer hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 rounded-lg bg-green-500">
                  <Plus className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Yeni Çalışan</h3>
                  <p className="text-sm text-gray-600">Çalışan ekle</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 rounded-lg bg-purple-500">
                  <Search className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Gelişmiş Arama</h3>
                  <p className="text-sm text-gray-600">Detaylı arama yap</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 rounded-lg bg-orange-500">
                  <Filter className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Filtreler</h3>
                  <p className="text-sm text-gray-600">Özel filtreler</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Info Section */}
        <Card>
          <CardHeader>
            <CardTitle>Çalışan Yönetimi Hakkında</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              Bu bölümde çalışan bilgilerini görüntüleyebilir, yeni çalışan ekleyebilir, 
              mevcut çalışan bilgilerini düzenleyebilir ve organizasyon yapısı içerisinde 
              çalışanları yönetebilirsiniz.
            </p>
            <div className="flex flex-wrap gap-2">
              <Link href="/employee-list">
                <Button variant="outline" size="sm">Çalışan Listesi</Button>
              </Link>
              <Link href="/organization">
                <Button variant="outline" size="sm">Organizasyon Şeması</Button>
              </Link>
              <Link href="/test-drag-drop">
                <Button variant="outline" size="sm">Drag & Drop Test</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  )
}
