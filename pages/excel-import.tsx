import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import Layout from '../components/Layout'
import dynamic from 'next/dynamic'

function ExcelImport() {
  const { data: session, status } = useSession() || {}
  const router = useRouter()
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState('')
  const [selectedTable, setSelectedTable] = useState<string>('employee')

  if (status === 'loading') return <div>Yükleniyor...</div>
  if (!session) {
    router.push('/auth/signin')
    return null
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      setMessage('')
    }
  }

  const handleUpload = async () => {
    if (!file) {
      setMessage('Lütfen bir dosya seçin')
      return
    }

    setUploading(true)
    setMessage('')

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('table', selectedTable)

      const response = await fetch('/api/excel/import', {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()

      if (response.ok) {
        setMessage(`✅ Başarılı! ${result.message}`)
      } else {
        setMessage(`❌ Hata: ${result.message}`)
      }
    } catch (error) {
      setMessage(`❌ Hata: ${error instanceof Error ? error.message : String(error)}`)
    } finally {
      setUploading(false)
    }
  }

  const tableOptions = [
    { value: 'company', label: 'Company (Şirketler)', description: 'Sadece Company tablosunu doldurur' },
    { value: 'employee', label: 'Employee (Çalışanlar)', description: 'Tüm tabloları doldurur' },
    { value: 'brand', label: 'Brand (Markalar)', description: 'Sadece Brand tablosunu doldurur' },
    { value: 'location', label: 'Location (Lokasyonlar)', description: 'Sadece Location tablosunu doldurur' },
    { value: 'department', label: 'Department (Departmanlar)', description: 'Sadece Department tablosunu doldurur' },
    { value: 'position', label: 'Position (Pozisyonlar)', description: 'Sadece Position tablosunu doldurur' },
    { value: 'jobtitlelevel', label: 'JobTitleLevel (Seviyeler)', description: 'Sadece JobTitleLevel tablosunu doldurur' }
  ]

  const getTableFormat = (table: string) => {
    switch (table) {
      case 'company':
        return [
          'CompanyName - Şirket adı'
        ]
      case 'employee':
        return [
          'CurrAccCode - Çalışan kodu',
          'NameSurname - Ad Soyad',
          'BrandName - Marka adı',
          'LocationName - Lokasyon adı',
          'DepartmentName - Departman adı',
          'PositionName - Pozisyon adı',
          'ManagerId - Yönetici ID',
          'LevelName - Seviye adı',
          'IsManager - Yönetici mi (true/false)'
        ]
      case 'brand':
        return [
          'BrandName - Marka adı',
          'CompanyName - Şirket adı (opsiyonel)'
        ]
      case 'location':
        return [
          'LocationName - Lokasyon adı'
        ]
      case 'department':
        return [
          'DepartmentName - Departman adı'
        ]
              case 'position':
                return [
                  'PositionName - Pozisyon adı'
                ]
      case 'jobtitlelevel':
        return [
          'LevelName - Seviye adı',
          'LevelOrder - Seviye sırası (opsiyonel)',
          'Description - Açıklama (opsiyonel)'
        ]
      default:
        return []
    }
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Excel Import</h1>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Hangi Tablo İçin Import Yapmak İstiyorsunuz?
            </label>
            <select
              value={selectedTable}
              onChange={(e) => setSelectedTable(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {tableOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label} - {option.description}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Excel Dosyası Seçin
            </label>
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
          </div>

          {file && (
            <div className="mb-4 p-3 bg-gray-50 rounded">
              <p className="text-sm text-gray-600">
                Seçilen dosya: <strong>{file.name}</strong>
              </p>
              <p className="text-xs text-gray-500">
                Boyut: {(file.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
          )}

          <button
            onClick={handleUpload}
            disabled={!file || uploading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {uploading ? 'Yükleniyor...' : 'Excel Dosyasını İçe Aktar'}
          </button>

          {message && (
            <div className={`mt-4 p-3 rounded ${
              message.includes('✅') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
            }`}>
              {message}
            </div>
          )}
        </div>

        <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-yellow-800 mb-2">📋 Excel Formatı</h3>
          <p className="text-sm text-yellow-700 mb-2">
            <strong>{tableOptions.find(t => t.value === selectedTable)?.label}</strong> için Excel dosyanızda şu sütunlar olmalı:
          </p>
          <ul className="text-sm text-yellow-700 list-disc list-inside space-y-1">
            {getTableFormat(selectedTable).map((format, index) => (
              <li key={index}>{format}</li>
            ))}
          </ul>
          <div className="mt-4 p-3 bg-blue-50 rounded">
            <p className="text-sm text-blue-700">
              <strong>✅ Doldurulacak Tablo:</strong> {tableOptions.find(t => t.value === selectedTable)?.label}
            </p>
          </div>
        </div>
      </div>
    </Layout>
  )
}

export default dynamic(() => Promise.resolve(ExcelImport), { ssr: false })
