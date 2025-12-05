export default function TestPage() {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          ✅ Proje Çalışıyor!
        </h1>
        <p className="text-gray-600 mb-4">
          Next.js sunucusu başarıyla çalışıyor.
        </p>
        <div className="space-y-2">
          <p className="text-sm text-gray-500">• Database: PostgreSQL (Prisma Accelerate)</p>
          <p className="text-sm text-gray-500">• Port: 3000</p>
          <p className="text-sm text-gray-500">• Status: Aktif</p>
        </div>
      </div>
    </div>
  )
}
