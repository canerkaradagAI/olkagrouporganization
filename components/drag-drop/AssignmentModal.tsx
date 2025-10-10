
'use client'

import React, { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { Card, CardContent } from '../ui/card'
import { CalendarIcon, UserIcon, BrainCircuit, Clock } from 'lucide-react'

interface Employee {
  currAccCode: string
  firstLastName: string
  positionName: string
  departmentName: string
  isManager: boolean
}

interface AssignmentModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (assignment: {
    positionId: string
    assignmentType: 'permanent' | 'temporary' | 'deputy' | 'project'
    startDate: string
    endDate?: string
  }) => void
  draggedEmployee: Employee | null
  targetEmployee: Employee | null
  selectedCount: number
}

const assignmentTypes = [
  {
    id: 'permanent' as const,
    name: 'Asaleten',
    description: 'Çalışan bu pozisyona asaleten atanır',
    color: 'bg-green-100 text-green-800 border-green-200',
    icon: UserIcon,
  },
  {
    id: 'deputy' as const,
    name: 'Vekaleten',
    description: 'Pozisyonun vekaleten yürütülmesi (geçici)',
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    icon: BrainCircuit,
  },
]

export default function AssignmentModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  draggedEmployee, 
  targetEmployee, 
  selectedCount 
}: AssignmentModalProps) {
  const [selectedType, setSelectedType] = useState<typeof assignmentTypes[0]['id'] | null>(null)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const handleConfirm = () => {
    if (!selectedType || !startDate) return

    onConfirm({
      positionId: targetEmployee?.currAccCode || 'unknown',
      assignmentType: selectedType,
      startDate,
      endDate: endDate || undefined,
    })

    // Reset form
    setSelectedType(null)
    setStartDate('')
    setEndDate('')
  }

  const isBulkAssignment = selectedCount > 0 && !draggedEmployee

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BrainCircuit className="h-5 w-5" />
            {isBulkAssignment ? 'Toplu Atama' : 'Pozisyon Ataması'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Assignment Summary */}
          <div className="bg-gray-50 p-4 rounded-lg space-y-3">
            <h3 className="font-medium text-sm">Atama Detayları</h3>
            
            {isBulkAssignment ? (
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{selectedCount} çalışan</Badge>
                <span className="text-sm text-gray-600">toplu olarak atanacak</span>
              </div>
            ) : draggedEmployee && (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-xs font-bold text-blue-700">
                    {draggedEmployee.firstLastName.split(' ').map(n => n[0]).join('')}
                  </span>
                </div>
                <div>
                  <p className="font-medium text-sm">{draggedEmployee.firstLastName}</p>
                  <p className="text-xs text-gray-600">{draggedEmployee.positionName}</p>
                </div>
              </div>
            )}

            {targetEmployee && (
              <div className="pt-2 border-t">
                <p className="text-sm text-gray-600">Hedef Pozisyon:</p>
                <p className="font-medium">{targetEmployee.positionName}</p>
                <p className="text-xs text-gray-500">{targetEmployee.departmentName}</p>
              </div>
            )}
          </div>

          {/* Assignment Type Selection */}
          <div className="space-y-3">
            <h3 className="font-medium text-sm">Atama Tipi Seçin</h3>
            <div className="grid gap-3 md:grid-cols-2">
              {assignmentTypes.map((type) => {
                const Icon = type.icon
                return (
                  <Card
                    key={type.id}
                    className={`cursor-pointer transition-all ${
                      selectedType === type.id
                        ? 'ring-2 ring-blue-500 bg-blue-50'
                        : 'hover:bg-gray-50'
                    }`}
                    onClick={() => setSelectedType(type.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg ${type.color}`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-sm">{type.name}</h4>
                          <p className="text-xs text-gray-600 mt-1">{type.description}</p>
                        </div>
                        <div className={`w-4 h-4 rounded-full border-2 ${
                          selectedType === type.id 
                            ? 'bg-blue-500 border-blue-500'
                            : 'border-gray-300'
                        }`}>
                          {selectedType === type.id && (
                            <div className="w-2 h-2 bg-white rounded-full m-0.5"></div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>

          {/* Date Selection */}
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium mb-2">
                Başlangıç Tarihi *
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                Bitiş Tarihi
                {(selectedType === 'deputy') && ' *'}
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required={selectedType === 'deputy'}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            İptal
          </Button>
          <Button 
            onClick={handleConfirm}
            disabled={!selectedType || !startDate || (selectedType === 'deputy' && !endDate)}
          >
            Atamayı Onayla
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
