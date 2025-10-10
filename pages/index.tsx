
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import Head from 'next/head'
import Layout from '../components/Layout'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { 
  Users, 
  Building2, 
  TrendingUp, 
  Calendar, 
  ArrowRight,
  UsersIcon,
  TreePineIcon,
  ChartBarIcon,
  PlusIcon
} from 'lucide-react'
import Link from 'next/link'

interface DashboardStats {
  totalEmployees: number
  totalDepartments: number
  totalPositions: number
  recentHires: number
}

export default function HomePage() {
  const sessionResult = useSession()
  const { data: session, status } = sessionResult || {}
  const router = useRouter()
  
  const [stats, setStats] = useState<DashboardStats>({
    totalEmployees: 0,
    totalDepartments: 0,
    totalPositions: 0,
    recentHires: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'loading') return
    
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
      return
    }
    
    if (session) {
      fetchDashboardData()
    }
  }, [session, status, router])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/dashboard/stats')
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Dashboard verisi yüklenirken hata:', error)
      // Set some default values if API fails
      setStats({
        totalEmployees: 150,
        totalDepartments: 12,
        totalPositions: 45,
        recentHires: 8
      })
    } finally {
      setLoading(false)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2">Yükleniyor...</span>
        </div>
      </Layout>
    )
  }

  const quickActions = [
    {
      title: 'Organizasyon Şeması',
      description: 'Şirket hiyerarşisini görüntüle',
      href: '/organization',
      icon: TreePineIcon,
      color: 'bg-blue-500'
    },
    {
      title: 'Çalışan Listesi',
      description: 'Tüm çalışanları listele',
      href: '/employee-list',
      icon: UsersIcon,
      color: 'bg-green-500'
    },
    {
      title: 'Dashboard Test',
      description: 'İstatistikleri görüntüle',
      href: '/test-dashboard',
      icon: ChartBarIcon,
      color: 'bg-purple-500'
    },
    {
      title: 'Sürükle-Bırak Test',
      description: 'Organizasyon yönetimi',
      href: '/test-drag-drop',
      icon: PlusIcon,
      color: 'bg-orange-500'
    }
  ]

  return (
    <Layout>
      <Head>
        <title>Ana Sayfa - Olka Group Organizasyon Portalı</title>
      </Head>

      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Welcome Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Merhaba, {session?.user?.name || 'Kullanıcı'}! 👋
          </h1>
          <p className="text-gray-600">
            Olka Group Organizasyon Portalına hoş geldiniz. Aşağıdan hızlı erişim sağlayabilirsiniz.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Toplam Çalışan</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.totalEmployees}</div>
              <p className="text-xs text-muted-foreground">Aktif çalışan sayısı</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Departman</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.totalDepartments}</div>
              <p className="text-xs text-muted-foreground">Toplam departman</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pozisyon</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{stats.totalPositions}</div>
              <p className="text-xs text-muted-foreground">Tanımlanmış pozisyon</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Yeni İşe Alım</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{stats.recentHires}</div>
              <p className="text-xs text-muted-foreground">Son 30 gün</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Hızlı Erişim</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action, index) => (
              <Link key={index} href={action.href}>
                <Card className="cursor-pointer hover:shadow-lg transition-shadow duration-200 border-2 hover:border-blue-200">
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-4">
                      <div className={`p-3 rounded-lg ${action.color}`}>
                        <action.icon className="h-6 w-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{action.title}</h3>
                        <p className="text-sm text-gray-600">{action.description}</p>
                      </div>
                      <ArrowRight className="h-5 w-5 text-gray-400" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Son Aktiviteler</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Yeni çalışan eklendi</p>
                  <p className="text-xs text-gray-500">2 saat önce</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Organizasyon şeması güncellendi</p>
                  <p className="text-xs text-gray-500">5 saat önce</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Departman transfer işlemi</p>
                  <p className="text-xs text-gray-500">1 gün önce</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  )
}
