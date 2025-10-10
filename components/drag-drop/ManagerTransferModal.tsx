
'use client'

import React, { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { Card, CardContent } from '../ui/card'
import { Alert, AlertDescription } from '../ui/alert'
import { Crown, Users, AlertTriangle, ArrowRight, UserCheck } from 'lucide-react'

interface Employee {
  currAccCode: string
  firstLastName: string
  positionName: string
  departmentName: string
  isManager: boolean
}

interface ManagerTransferModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (data: {
    managerTransferType: 'replace' | 'deputy' | 'merge'
    teamAction: 'transfer' | 'redistribute' | 'assign_deputy'
    deputyManager?: string
    startDate: string
    endDate?: string
  }) => void
  manager: Employee | null
  targetPosition: Employee | null
}

const transferTypes = [
  {
    id: 'replace' as const,
    name: 'Tam Değiştirme',
    description: 'Mevcut yöneticinin yerine geç',
    icon: ArrowRight,
    color: 'bg-red-100 text-red-800 border-red-200',
  },
  {
    id: 'deputy' as const,
    name: 'Vekaleten Yönetim',
    description: 'Geçici olarak vekalet et',
    icon: UserCheck,
    color: 'bg-blue-100 text-blue-800 border-blue-200',
  },
  {
    id: 'merge' as const,
    name: 'Ekip Birleştirme',
    description: 'Her iki ekibi birden yönet',
    icon: Users,
    color: 'bg-purple-100 text-purple-800 border-purple-200',
  },
]

const teamActions = [
  {
    id: 'transfer' as const,
    name: 'Ekibi Transfer Et',
    description: 'Tüm ekibi yeni pozisyona taşı',
  },
  {
    id: 'redistribute' as const,
    name: 'Ekibi Dağıt',
    description: 'Ekip üyelerini farklı yöneticilere ata',
  },
  {
    id: 'assign_deputy' as const,
    name: 'Vekil Ata',
    description: 'Geçici bir vekil yönetici belirle',
  },
]

export default function ManagerTransferModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  manager, 
  targetPosition 
}: ManagerTransferModalProps) {
  const [selectedTransferType, setSelectedTransferType] = useState<typeof transferTypes[0]['id'] | null>(null)
  const [selectedTeamAction, setSelectedTeamAction] = useState<typeof teamActions[0]['id'] | null>(null)
  const [deputyManager, setDeputyManager] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const handleConfirm = () => {
    if (!selectedTransferType || !selectedTeamAction || !startDate) return

    onConfirm({
      managerTransferType: selectedTransferType,
      teamAction: selectedTeamAction,
      deputyManager: deputyManager || undefined,
      startDate,
      endDate: endDate || undefined,
    })

    // Reset form
    setSelectedTransferType(null)
    setSelectedTeamAction(null)
    setDeputyManager('')
    setStartDate('')
    setEndDate('')
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-yellow-500" />
            Yönetici Transferi
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Warning Alert */}
          <Alert className="border-yellow-200 bg-yellow-50">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800">
              Bir yöneticiyi taşırken mevcut ekibinin de yönetimi planlanmalıdır. Bu işlem organizasyon yapısını etkileyebilir.
            </AlertDescription>
          </Alert>

          {/* Manager Info */}
          {manager && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium text-sm mb-3">Taşınacak Yönetici</h3>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-sm font-bold text-blue-700">
                    {manager.firstLastName.split(' ').map(n => n[0]).join('')}
                  </span>
                </div>
                <div>
                  <p className="font-medium">{manager.firstLastName}</p>
                  <p className="text-sm text-gray-600">{manager.positionName}</p>
                  <Badge variant="secondary" className="text-xs mt-1">
                    {manager.departmentName}
                  </Badge>
                </div>
              </div>
              
              {targetPosition && (
                <div className="mt-4 pt-3 border-t">
                  <p className="text-sm text-gray-600">Hedef Pozisyon:</p>
                  <p className="font-medium">{targetPosition.positionName}</p>
                </div>
              )}
            </div>
          )}

          {/* Transfer Type Selection */}
          <div className="space-y-3">
            <h3 className="font-medium text-sm">Transfer Tipi</h3>
            <div className="grid gap-3">
              {transferTypes.map((type) => {
                const Icon = type.icon
                return (
                  <Card
                    key={type.id}
                    className={`cursor-pointer transition-all ${
                      selectedTransferType === type.id
                        ? 'ring-2 ring-blue-500 bg-blue-50'
                        : 'hover:bg-gray-50'
                    }`}
                    onClick={() => setSelectedTransferType(type.id)}
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
                          selectedTransferType === type.id 
                            ? 'bg-blue-500 border-blue-500'
                            : 'border-gray-300'
                        }`}>
                          {selectedTransferType === type.id && (
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

          {/* Team Management */}
          <div className="space-y-3">
            <h3 className="font-medium text-sm">Mevcut Ekip Yönetimi</h3>
            <div className="space-y-2">
              {teamActions.map((action) => (
                <Card
                  key={action.id}
                  className={`cursor-pointer transition-all ${
                    selectedTeamAction === action.id
                      ? 'ring-2 ring-green-500 bg-green-50'
                      : 'hover:bg-gray-50'
                  }`}
                  onClick={() => setSelectedTeamAction(action.id)}
                >
                  <CardContent className="p-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-4 h-4 rounded-full border-2 ${
                        selectedTeamAction === action.id 
                          ? 'bg-green-500 border-green-500'
                          : 'border-gray-300'
                      }`}>
                        {selectedTeamAction === action.id && (
                          <div className="w-2 h-2 bg-white rounded-full m-0.5"></div>
                        )}
                      </div>
                      <div>
                        <h4 className="font-medium text-sm">{action.name}</h4>
                        <p className="text-xs text-gray-600">{action.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Deputy Manager Selection */}
          {selectedTeamAction === 'assign_deputy' && (
            <div>
              <label className="block text-sm font-medium mb-2">
                Vekil Yönetici Seç
              </label>
              <select
                value={deputyManager}
                onChange={(e) => setDeputyManager(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Seçiniz...</option>
                <option value="deputy1">Ayşe Özkan - Satış Müdürü</option>
                <option value="deputy2">Mehmet Demir - BT Müdürü</option>
                <option value="deputy3">Fatma Kaya - İK Müdürü</option>
              </select>
            </div>
          )}

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
                {selectedTransferType === 'deputy' && ' *'}
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required={selectedTransferType === 'deputy'}
              />
            </div>
          </div>

          {/* Summary */}
          {selectedTransferType && selectedTeamAction && (
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h3 className="font-medium text-sm text-blue-800 mb-2">İşlem Özeti</h3>
              <div className="space-y-1 text-sm text-blue-700">
                <p>• Transfer tipi: {transferTypes.find(t => t.id === selectedTransferType)?.name}</p>
                <p>• Ekip aksiyonu: {teamActions.find(a => a.id === selectedTeamAction)?.name}</p>
                {deputyManager && <p>• Vekil yönetici atanacak</p>}
                <p>• Bu işlem organizasyon şemasını güncelleyecektir</p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            İptal
          </Button>
          <Button 
            onClick={handleConfirm}
            disabled={!selectedTransferType || !selectedTeamAction || !startDate ||
              (selectedTransferType === 'deputy' && !endDate) ||
              (selectedTeamAction === 'assign_deputy' && !deputyManager)
            }
            className="bg-yellow-600 hover:bg-yellow-700"
          >
            Transferi Onayla
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
