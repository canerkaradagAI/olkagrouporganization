import { NextPageContext } from 'next'
import { useEffect } from 'react'
import { useRouter } from 'next/router'

interface ErrorProps {
  statusCode?: number
  hasGetInitialPropsRun?: boolean
  err?: Error
}

function Error({ statusCode, hasGetInitialPropsRun, err }: ErrorProps) {
  const router = useRouter()

  useEffect(() => {
    if (!hasGetInitialPropsRun && err) {
      // getInitialProps is not called in case of
      // https://github.com/vercel/next.js/issues/8592. As a workaround, we
      // pass the err prop to the component
    }
  }, [hasGetInitialPropsRun, err])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="mb-4">
          <h1 className="text-6xl font-bold text-gray-800">{statusCode || 'Error'}</h1>
        </div>
        <h2 className="text-2xl font-semibold text-gray-700 mb-4">
          {statusCode === 404
            ? 'Sayfa Bulunamadı'
            : statusCode === 500
            ? 'Sunucu Hatası'
            : 'Bir Hata Oluştu'}
        </h2>
        <p className="text-gray-600 mb-6">
          {statusCode === 404
            ? 'Aradığınız sayfa bulunamadı.'
            : 'Üzgünüz, bir şeyler ters gitti.'}
        </p>
        <div className="space-y-2">
          <button
            onClick={() => router.push('/')}
            className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            Ana Sayfaya Dön
          </button>
          <button
            onClick={() => router.back()}
            className="w-full bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300 transition-colors"
          >
            Geri Git
          </button>
        </div>
      </div>
    </div>
  )
}

Error.getInitialProps = ({ res, err, asPath }: NextPageContext) => {
  const statusCode = res ? res.statusCode : err ? (err as any).statusCode : 404
  return { statusCode, hasGetInitialPropsRun: true, err }
}

export default Error

