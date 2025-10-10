
'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ScrollArea } from '@/components/ui/scroll-area'
import { AlertTriangle, MapPin, Building, Award, Clock } from 'lucide-react'

interface Position {
  positionId: string
  positionName: string
  departmentName: string
  locationName: string
  brandName: string
  isVacant: boolean
  priorityLevel: 'high' | 'medium' | 'low'
  daysVacant: number
}

interface PositionVacanciesProps {
  positions: Position[]
}

export default function PositionVacancies({ positions }: PositionVacanciesProps) {
  const vacantPositions = positions.filter(pos => pos.isVacant)
  
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'border-red-200 bg-red-50'
      case 'medium':
        return 'border-yellow-200 bg-yellow-50'
      case 'low':
        return 'border-green-200 bg-green-50'
      default:
        return 'border-gray-200 bg-gray-50'
    }
  }

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return <Badge variant="destructive" className="text-xs">Yüksek</Badge>
      case 'medium':
        return <Badge variant="secondary" className="text-xs bg-yellow-100 text-yellow-800">Orta</Badge>
      case 'low':
        return <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">Düşük</Badge>
      default:
        return <Badge variant="outline" className="text-xs">Bilinmiyor</Badge>
    }
  }

  const highPriorityCount = vacantPositions.filter(pos => pos.priorityLevel === 'high').length

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          Pozisyon Boşlukları
          <Badge variant={highPriorityCount > 0 ? "destructive" : "secondary"} className="ml-2">
            {vacantPositions.length}
          </Badge>
        </CardTitle>
        {highPriorityCount > 0 && (
          <Alert className="border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              {highPriorityCount} adet yüksek öncelikli pozisyon boşluğu bulunmaktadır!
            </AlertDescription>
          </Alert>
        )}
      </CardHeader>
      <CardContent>
        {vacantPositions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Building className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p className="text-sm">Şu anda boş pozisyon bulunmamaktadır.</p>
          </div>
        ) : (
          <ScrollArea className="h-80">
            <div className="space-y-4">
              {vacantPositions
                .sort((a, b) => {
                  // Sort by priority: high -> medium -> low
                  const priorityOrder = { high: 3, medium: 2, low: 1 }
                  return priorityOrder[b.priorityLevel] - priorityOrder[a.priorityLevel]
                })
                .map((position) => (
                  <div
                    key={position.positionId}
                    className={`border rounded-lg p-4 ${getPriorityColor(position.priorityLevel)}`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h4 className="font-medium text-sm">{position.positionName}</h4>
                        <div className="flex items-center gap-3 mt-2 text-xs text-gray-600">
                          <div className="flex items-center gap-1">
                            <Building className="h-3 w-3" />
                            <span>{position.departmentName}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            <span>{position.locationName}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Award className="h-3 w-3" />
                            <span>{position.brandName}</span>
                          </div>
                        </div>
                      </div>
                      {getPriorityBadge(position.priorityLevel)}
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Clock className="h-3 w-3" />
                        <span>{position.daysVacant} gündür boş</span>
                      </div>
                      {position.priorityLevel === 'high' && (
                        <Badge variant="outline" className="text-xs border-red-300 text-red-700">
                          Acil
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  )
}
