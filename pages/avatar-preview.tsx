import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'

export default function AvatarPreviewPage() {
  // Örnek çalışan verileri
  const sampleEmployees = [
    { name: 'Yasin Kavşak', position: 'CEO', department: 'Yönetim Kurulu' },
    { name: 'Ahmet Yılmaz', position: 'Genel Müdür', department: 'Yönetim' },
    { name: 'Ayşe Demir', position: 'İnsan Kaynakları Müdürü', department: 'İK' },
    { name: 'Mehmet Kaya', position: 'Finans Müdürü', department: 'Finans' },
    { name: 'Fatma Şahin', position: 'Pazarlama Müdürü', department: 'Pazarlama' },
  ]

  // Mevcut durum (baş harfler)
  const CurrentVersion = ({ employee }: { employee: typeof sampleEmployees[0] }) => (
    <div className="bg-white border-2 border-gray-200 rounded-lg p-4 min-w-[240px]">
      <div className="flex items-center gap-3">
        {/* Mevcut: Baş harfler */}
        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-md">
          <span className="text-white font-bold text-sm">
            {employee.name.split(' ').map(n => n[0]).join('')}
          </span>
        </div>
        <div className="flex-1">
          <div className="text-xs font-bold text-gray-700 mb-1">{employee.department}</div>
          <div className="font-semibold text-sm text-gray-900">{employee.name}</div>
          <div className="text-xs text-gray-600">{employee.position}</div>
        </div>
      </div>
    </div>
  )

  // Yeni durum (Avatar bileşeni)
  const NewVersion = ({ employee }: { employee: typeof sampleEmployees[0] }) => (
    <div className="bg-white border-2 border-blue-400 rounded-lg p-4 min-w-[240px]">
      <div className="flex items-center gap-3">
        {/* Yeni: Avatar bileşeni */}
        <Avatar className="w-12 h-12 shadow-md">
          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white font-bold text-sm">
            {employee.name.split(' ').map(n => n[0]).join('')}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <div className="text-xs font-bold text-gray-700 mb-1">{employee.department}</div>
          <div className="font-semibold text-sm text-gray-900">{employee.name}</div>
          <div className="text-xs text-gray-600">{employee.position}</div>
        </div>
      </div>
    </div>
  )

  // D3.js SVG versiyonu için örnek
  const SVGVersion = ({ employee }: { employee: typeof sampleEmployees[0] }) => (
    <div className="bg-white border-2 border-green-400 rounded-lg p-4 min-w-[240px]">
      <div className="flex items-center gap-3">
        {/* SVG Avatar (D3.js için) */}
        <svg width="48" height="48" className="flex-shrink-0">
          <defs>
            <linearGradient id={`gradient-${employee.name}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3b82f6" />
              <stop offset="100%" stopColor="#2563eb" />
            </linearGradient>
          </defs>
          <circle
            cx="24"
            cy="24"
            r="20"
            fill={`url(#gradient-${employee.name})`}
            stroke="#ffffff"
            strokeWidth="2"
            style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }}
          />
          <text
            x="24"
            y="28"
            textAnchor="middle"
            fontSize="11"
            fontWeight="700"
            fill="#ffffff"
          >
            {employee.name.split(' ').map(n => n[0]).join('')}
          </text>
        </svg>
        <div className="flex-1">
          <div className="text-xs font-bold text-gray-700 mb-1">{employee.department}</div>
          <div className="font-semibold text-sm text-gray-900">{employee.name}</div>
          <div className="text-xs text-gray-600">{employee.position}</div>
        </div>
      </div>
    </div>
  )

  return (
    <div className="container mx-auto p-6 space-y-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span>Avatar Önizleme</span>
            <Badge variant="secondary">Örnek Görünüm</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-8">
          {/* Mevcut Durum */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-gray-700">
              Mevcut Durum (Baş Harfler)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sampleEmployees.map((employee, index) => (
                <CurrentVersion key={index} employee={employee} />
              ))}
            </div>
          </div>

          {/* Yeni Durum - React Avatar */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-blue-600">
              Yeni Durum - React Avatar Bileşeni
              <Badge className="ml-2" variant="outline">Önerilen</Badge>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sampleEmployees.map((employee, index) => (
                <NewVersion key={index} employee={employee} />
              ))}
            </div>
            <p className="mt-4 text-sm text-gray-600">
              ✅ OrganizationChart.tsx ve management.tsx için kullanılacak
            </p>
          </div>

          {/* SVG Versiyonu - D3.js için */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-green-600">
              SVG Avatar (D3.js için)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sampleEmployees.map((employee, index) => (
                <SVGVersion key={index} employee={employee} />
              ))}
            </div>
            <p className="mt-4 text-sm text-gray-600">
              ✅ OrganizationTree.tsx (D3.js SVG) için kullanılacak
            </p>
          </div>

          {/* Karşılaştırma */}
          <div className="bg-gray-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold mb-4">Karşılaştırma</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium mb-2 text-gray-700">Mevcut (Baş Harfler)</h4>
                <CurrentVersion employee={sampleEmployees[0]} />
                <ul className="mt-2 text-sm text-gray-600 space-y-1">
                  <li>• Basit div + span</li>
                  <li>• Gradient background</li>
                  <li>• Statik görünüm</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2 text-blue-600">Yeni (Avatar Bileşeni)</h4>
                <NewVersion employee={sampleEmployees[0]} />
                <ul className="mt-2 text-sm text-gray-600 space-y-1">
                  <li>• Radix UI Avatar bileşeni</li>
                  <li>• Daha profesyonel görünüm</li>
                  <li>• Gelecekte resim eklenebilir</li>
                  <li>• Tutarlı tasarım</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Notlar */}
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h4 className="font-semibold text-blue-900 mb-2">📝 Notlar</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Avatar bileşeni mevcut projede zaten kullanılıyor (navbar.tsx)</li>
              <li>• OrganizationChart.tsx ve management.tsx için React Avatar kullanılacak</li>
              <li>• OrganizationTree.tsx (D3.js SVG) için SVG circle + text kullanılacak</li>
              <li>• Görsel olarak çok benzer, ancak daha tutarlı ve genişletilebilir</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

