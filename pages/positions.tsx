
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import { useEffect } from 'react'
import Head from 'next/head'
import Layout from '../components/Layout'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { BuildingIcon, Plus, Users, TrendingUp } from 'lucide-react'

export default function PositionsPage() {
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
        <title>Pozisyonlar - Olka Group</title>
      </Head>

      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Pozisyon Yönetimi</h1>
            <p className="text-gray-600">Pozisyon tanımlarını görüntüleyin ve yönetin</p>
          </div>
          
          <Button className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Yeni Pozisyon
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 rounded-lg bg-blue-500">
                  <BuildingIcon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-blue-600">52</h3>
                  <p className="text-sm text-gray-600">Toplam Pozisyon</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 rounded-lg bg-green-500">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-green-600">38</h3>
                  <p className="text-sm text-gray-600">Dolu Pozisyon</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 rounded-lg bg-orange-500">
                  <TrendingUp className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-orange-600">14</h3>
                  <p className="text-sm text-gray-600">Açık Pozisyon</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 rounded-lg bg-purple-500">
                  <Plus className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-purple-600">6</h3>
                  <p className="text-sm text-gray-600">Bu Ay Eklenen</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Position Categories */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Departman Bazında Pozisyonlar</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                <span className="font-medium">Bilgi Teknolojileri</span>
                <span className="text-sm text-gray-600">12 pozisyon</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                <span className="font-medium">İnsan Kaynakları</span>
                <span className="text-sm text-gray-600">8 pozisyon</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                <span className="font-medium">Pazarlama</span>
                <span className="text-sm text-gray-600">10 pozisyon</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                <span className="font-medium">Finans</span>
                <span className="text-sm text-gray-600">6 pozisyon</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Pozisyon Seviyeleri</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                <span className="font-medium">Yönetici</span>
                <span className="text-sm text-gray-600">8 pozisyon</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                <span className="font-medium">Uzman</span>
                <span className="text-sm text-gray-600">24 pozisyon</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                <span className="font-medium">Specialist</span>
                <span className="text-sm text-gray-600">15 pozisyon</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                <span className="font-medium">Junior</span>
                <span className="text-sm text-gray-600">5 pozisyon</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Hızlı İşlemler</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline">Pozisyon Raporu</Button>
              <Button variant="outline">Açık Pozisyonlar</Button>
              <Button variant="outline">Pozisyon Tanımları</Button>
              <Button variant="outline">Hiyerarşi Görünümü</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  )
}
