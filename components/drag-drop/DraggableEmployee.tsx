
'use client'

import React from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Card, CardContent } from '../ui/card'
import { Badge } from '../ui/badge'
import { Checkbox } from '../ui/checkbox'
import { GripVertical, Crown, MapPin, Building, Award, Plus, Users } from 'lucide-react'

interface Employee {
  currAccCode: string
  firstLastName: string
  positionName: string
  departmentName: string
  managerName: string
  locationName: string
  brandName: string
  isManager: boolean
}

interface DraggableEmployeeProps {
  employee: Employee
  isSelected: boolean
  onSelect: (employeeId: string, isSelected: boolean) => void
  isDragOver: boolean
  onDragEnter?: (event: React.DragEvent) => void
  onDragLeave?: (event: React.DragEvent) => void
}

export default function DraggableEmployee({ employee, isSelected, onSelect, isDragOver, onDragEnter, onDragLeave }: DraggableEmployeeProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: employee.currAccCode })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div ref={setNodeRef} style={style}>
      <Card 
        className={`
          transition-all duration-300 cursor-grab relative group
          ${isDragging ? 'opacity-80 shadow-2xl scale-110 bg-yellow-100 ring-4 ring-yellow-400' : ''}
          ${isDragOver ? 'ring-4 ring-green-500 bg-green-100 scale-110 shadow-xl' : ''}
          ${isSelected ? 'ring-4 ring-green-500 bg-green-100' : ''}
          hover:shadow-xl hover:ring-4 hover:ring-blue-400 hover:scale-105 hover:bg-blue-50 hover:border-blue-300 hover:border-2 hover:-translate-y-1
        `}
        data-employee-id={employee.currAccCode}
        onDragEnter={onDragEnter}
        onDragLeave={onDragLeave}
        {...attributes}
        {...listeners}
      >
        {/* Hover indicator for drop zone */}
        {isDragOver && (
          <div className="absolute inset-0 border-4 border-dashed border-green-500 bg-green-100/80 rounded-lg flex items-center justify-center z-10 animate-pulse">
            <div className="text-green-700 text-lg font-bold bg-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2">
              Altına Ekle
            </div>
          </div>
        )}
        
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            {/* Drag Handle & Checkbox */}
            <div className="flex flex-col items-center gap-2">
              <GripVertical className="h-4 w-4 text-gray-400 group-hover:text-blue-500 group-hover:scale-125 transition-all duration-300" />
              <Checkbox
                checked={isSelected}
                onCheckedChange={(checked) => onSelect(employee.currAccCode, !!checked)}
                onClick={(e) => e.stopPropagation()}
              />
            </div>

            {/* Employee Info */}
            <div className="flex-1 min-w-0">
              {/* Icon and 3 lines of information */}
              <div className="flex items-center gap-3 mb-2">
                {/* Avatar with initials */}
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-all duration-300 shadow-md">
                  <span className="text-white font-bold text-xs">
                    {employee.firstLastName.split(' ').map(n => n[0]).join('')}
                  </span>
                </div>
                
                {/* 3 lines of information */}
                <div className="flex-1 min-w-0 space-y-1">
                  {/* Department - Top */}
                  <div className="text-xs text-gray-800 font-bold truncate group-hover:text-blue-700 transition-colors duration-300">
                    {employee.departmentName}
                  </div>
                  
                  {/* Employee Name - Middle */}
                  <div className="font-medium text-sm truncate group-hover:text-blue-700 group-hover:font-semibold transition-all duration-300">
                    {employee.firstLastName}
                  </div>
                  
                  {/* Position - Bottom */}
                  <div className="text-xs text-gray-500 truncate group-hover:text-blue-500 transition-colors duration-300">
                    {employee.positionName}
                  </div>
                </div>
                
                {/* Manager icon */}
                {employee.isManager && (
                  <Crown className="h-4 w-4 text-yellow-500 flex-shrink-0 group-hover:text-yellow-600 group-hover:scale-125 transition-all duration-300" />
                )}
              </div>

              {/* Additional details */}
              <div className="space-y-1 text-xs text-gray-600 group-hover:text-blue-600 transition-colors duration-300">
                <div className="flex items-center gap-1">
                  <MapPin className="h-3 w-3 flex-shrink-0 group-hover:text-blue-500 transition-colors duration-300" />
                  <span className="truncate">{employee.locationName}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Award className="h-3 w-3 flex-shrink-0 group-hover:text-blue-500 transition-colors duration-300" />
                  <span className="truncate">{employee.brandName}</span>
                </div>
                {employee.managerName && (
                  <div className="text-xs text-gray-500 group-hover:text-blue-500 transition-colors duration-300">
                    Yönetici: {employee.managerName}
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
