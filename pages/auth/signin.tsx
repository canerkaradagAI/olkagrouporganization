
import { useState, useEffect } from 'react'
import { signIn, getProviders, ClientSafeProvider } from 'next-auth/react'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useSession } from 'next-auth/react'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Alert, AlertDescription } from '../../components/ui/alert'
import { Checkbox } from '../../components/ui/checkbox'
import { EyeIcon, EyeOffIcon, Network } from 'lucide-react'
import dynamic from 'next/dynamic'

interface SignInProps {
  providers: Record<string, ClientSafeProvider>
}

function SignInPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [providers, setProviders] = useState<Record<string, ClientSafeProvider>>({})

  useEffect(() => {
    // If user is already logged in, redirect to home
    if (session) {
      router.push('/')
    }
  }, [session, router])

  useEffect(() => {
    // Load providers
    const loadProviders = async () => {
      const providers = await getProviders()
      setProviders(providers ?? {})
    }
    loadProviders()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!username || !password) {
      setError('E-posta adresi ve şifre alanları zorunludur.')
      return
    }

    setLoading(true)
    setError('')

    try {
      const result = await signIn('credentials', {
        email: username, // NextAuth expects email field
        password,
        redirect: true,
        callbackUrl: '/'
      })

      // Bu kod sadece redirect: false olduğunda çalışır
      // redirect: true olduğunda NextAuth otomatik yönlendirir
    } catch (err) {
      setError('Giriş yapılırken bir hata oluştu.')
      setLoading(false)
    }
  }

  return (
    <>
      <Head>
        <title>Giriş Yap - Olka Group</title>
      </Head>

      <div className="min-h-screen bg-white flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <Card className="shadow-xl border-2 border-gray-200 rounded-2xl">
            <CardContent className="p-8">
              {/* Logo */}
              <div className="flex justify-center mb-6">
                <div className="flex items-center">
                  <span className="text-6xl font-bold text-blue-600">olka</span>
                  <span className="text-6xl font-bold text-gray-900">group</span>
                </div>
              </div>
              
              {/* Title */}
              <h1 className="text-center text-2xl font-semibold text-gray-900 mb-2">
                Organizasyon Portalı
              </h1>
              
              {/* Network Icon */}
              <div className="flex justify-center mb-8">
                <div className="w-16 h-16 bg-blue-600 rounded-xl flex items-center justify-center">
                  <Network className="w-8 h-8 text-white" />
                </div>
              </div>
              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {/* Email Field */}
                <div>
                  <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                    E-posta Adresi
                  </label>
                  <Input
                    id="username"
                    name="username"
                    type="email"
                    autoComplete="email"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full rounded-xl border-gray-300 focus:border-blue-400"
                    placeholder="E-posta adresinizi girin"
                  />
                </div>

                {/* Password Field */}
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                    Şifre
                  </label>
                  <div className="relative">
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pr-10 rounded-xl border-gray-300 focus:border-blue-400"
                      placeholder="Şifrenizi girin"
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOffIcon className="h-4 w-4 text-gray-400" />
                      ) : (
                        <EyeIcon className="h-4 w-4 text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Remember Me and Forgot Password */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Checkbox
                      id="remember"
                      checked={rememberMe}
                      onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                    />
                    <label htmlFor="remember" className="ml-2 text-sm text-gray-700">
                      Beni Hatırla
                    </label>
                  </div>
                  <Link href="#" className="text-sm text-blue-600 hover:text-blue-500">
                    Şifremi Unuttum?
                  </Link>
                </div>

                {/* Login Button */}
                <div>
                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-xl"
                  >
                    {loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
                  </Button>
                </div>
              </form>

            </CardContent>
          </Card>
        </div>
      </div>
    </>
  )
}

export default dynamic(() => Promise.resolve(SignInPage), { ssr: false })
