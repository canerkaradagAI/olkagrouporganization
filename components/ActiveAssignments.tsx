
'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Calendar, Crown, UserIcon } from 'lucide-react'

interface Assignment {
  id: string
  employeeName: string
  positionName: string
  assignmentType: string
  startDate: string
  endDate?: string
  isActive: boolean
}

interface ActiveAssignmentsProps {
  assignments: Assignment[]
}

export default function ActiveAssignments({ assignments }: ActiveAssignmentsProps) {
  const activeAssignments = assignments.filter(assignment => assignment.isActive)

  const getAssignmentTypeColor = (type: string) => {
    const t = type.toLowerCase()
    if (t.includes('asa')) return 'bg-green-100 text-green-800'
    if (t.includes('veka')) return 'bg-blue-100 text-blue-800'
    return 'bg-gray-100 text-gray-800'
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Crown className="h-5 w-5" />
          Aktif Vekaletler ve Atamalar
          <Badge variant="secondary" className="ml-2">
            {activeAssignments.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {activeAssignments.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <UserIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p className="text-sm">Şu anda aktif vekalet bulunmamaktadır.</p>
          </div>
        ) : (
          <ScrollArea className="h-80">
            <div className="space-y-4">
              {activeAssignments.map((assignment) => (
                <div
                  key={assignment.id}
                  className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">{assignment.employeeName}</h4>
                      <p className="text-sm text-gray-600 mt-1">{assignment.positionName}</p>
                    </div>
                    <Badge 
                      className={`text-xs ${getAssignmentTypeColor(assignment.assignmentType)}`}
                    >
                      {assignment.assignmentType}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-4 text-xs text-gray-500 mt-3">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      <span>Başlangıç: {formatDate(assignment.startDate)}</span>
                    </div>
                    {assignment.endDate && (
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>Bitiş: {formatDate(assignment.endDate)}</span>
                      </div>
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
