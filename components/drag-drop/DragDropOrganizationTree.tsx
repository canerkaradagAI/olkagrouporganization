
'use client'

import React, { useState } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import DraggableEmployee from './DraggableEmployee'
import AssignmentModal from './AssignmentModal'
import ManagerTransferModal from './ManagerTransferModal'
import { UserCheck, Users, ArrowRightLeft, Crown } from 'lucide-react'

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

interface Assignment {
  employeeId: string
  positionId: string
  assignmentType: 'permanent' | 'deputy'
  startDate: string
  endDate?: string
}

interface DragDropOrganizationTreeProps {
  employees: Employee[]
  onAssignmentChange: (assignments: Assignment[]) => void
}

export default function DragDropOrganizationTree({ employees, onAssignmentChange }: DragDropOrganizationTreeProps) {
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([])
  const [draggedEmployee, setDraggedEmployee] = useState<Employee | null>(null)
  const [dropTarget, setDropTarget] = useState<Employee | null>(null)
  const [showAssignmentModal, setShowAssignmentModal] = useState(false)
  const [showManagerModal, setShowManagerModal] = useState(false)
  const [assignments, setAssignments] = useState<Assignment[]>([])

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragStart = (event: DragStartEvent) => {
    const employee = employees.find(emp => emp.currAccCode === event.active.id)
    if (employee) {
      setDraggedEmployee(employee)
    }
  }

  const handleDragOver = (event: DragOverEvent) => {
    const { over } = event
    if (over) {
      const targetEmployee = employees.find(emp => emp.currAccCode === over.id)
      if (targetEmployee && targetEmployee !== draggedEmployee) {
        setDropTarget(targetEmployee)
      }
    }
  }

  const handleDragEnter = (event: React.DragEvent) => {
    event.preventDefault()
    const targetId = event.currentTarget.getAttribute('data-employee-id')
    if (targetId) {
      const targetEmployee = employees.find(emp => emp.currAccCode === targetId)
      if (targetEmployee && targetEmployee !== draggedEmployee) {
        setDropTarget(targetEmployee)
      }
    }
  }

  const handleDragLeave = (event: React.DragEvent) => {
    // Only clear if we're leaving the component entirely
    if (!event.currentTarget.contains(event.relatedTarget as Node)) {
      setDropTarget(null)
    }
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    
    if (over && active.id !== over.id) {
      const sourceEmployee = employees.find(emp => emp.currAccCode === active.id)
      const targetEmployee = employees.find(emp => emp.currAccCode === over.id)
      
      if (sourceEmployee && targetEmployee) {
        setDraggedEmployee(sourceEmployee)
        setDropTarget(targetEmployee)
        
        // If dragging a manager, show special modal
        if (sourceEmployee.isManager) {
          setShowManagerModal(true)
        } else {
          setShowAssignmentModal(true)
        }
      }
    }
    
    setDropTarget(null)
  }

  const handleEmployeeSelect = (employeeId: string, isSelected: boolean) => {
    if (isSelected) {
      setSelectedEmployees([...selectedEmployees, employeeId])
    } else {
      setSelectedEmployees(selectedEmployees.filter(id => id !== employeeId))
    }
  }

  const handleBulkAssignment = () => {
    if (selectedEmployees.length > 0) {
      setShowAssignmentModal(true)
    }
  }

  const handleAssignmentConfirm = (assignment: Omit<Assignment, 'employeeId'>) => {
    const employeesToAssign = draggedEmployee 
      ? [draggedEmployee.currAccCode]
      : selectedEmployees

    const newAssignments = employeesToAssign.map(employeeId => ({
      employeeId,
      ...assignment
    }))

    setAssignments([...assignments, ...newAssignments])
    onAssignmentChange([...assignments, ...newAssignments])
    
    setShowAssignmentModal(false)
    setSelectedEmployees([])
    setDraggedEmployee(null)
    setDropTarget(null)
  }

  const handleManagerTransferConfirm = (data: any) => {
    // Handle manager transfer logic
    console.log('Manager transfer:', data)
    setShowManagerModal(false)
    setDraggedEmployee(null)
    setDropTarget(null)
  }

  // Group employees by department
  const employeesByDepartment = employees.reduce((acc, employee) => {
    const dept = employee.departmentName || 'Diğer'
    if (!acc[dept]) acc[dept] = []
    acc[dept].push(employee)
    return acc
  }, {} as Record<string, Employee[]>)

  return (
    <div className="space-y-6">
      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowRightLeft className="h-5 w-5" />
            Sürükle-Bırak ile Atama Yönetimi
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Button
              onClick={handleBulkAssignment}
              disabled={selectedEmployees.length === 0}
              className="flex items-center gap-2"
            >
              <UserCheck className="h-4 w-4" />
              Seçili Çalışanları Ata ({selectedEmployees.length})
            </Button>
            <Button
              onClick={() => setSelectedEmployees([])}
              variant="outline"
              disabled={selectedEmployees.length === 0}
            >
              Seçimi Temizle
            </Button>
            <Badge variant="secondary" className="ml-auto">
              {assignments.length} aktif atama
            </Badge>
          </div>
          <div className="mt-4 text-sm text-gray-600">
            <p>• Çalışanları sürükleyip pozisyonlara atayabilirsiniz</p>
            <p>• Çoklu seçim için checkbox'ları kullanın</p>
            <p>• Yöneticileri taşırken ekip yönetimi seçenekleri gösterilir</p>
          </div>
        </CardContent>
      </Card>

      {/* Drag and Drop Context */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="grid gap-6">
          {Object.entries(employeesByDepartment).map(([department, deptEmployees]) => (
            <Card key={department} className="overflow-hidden">
              <CardHeader className="bg-gray-50">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Users className="h-5 w-5" />
                  {department}
                  <Badge variant="outline" className="ml-2">
                    {deptEmployees.length} kişi
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <SortableContext items={deptEmployees.map(emp => emp.currAccCode)} strategy={verticalListSortingStrategy}>
                  <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                    {deptEmployees.map((employee) => (
                      <DraggableEmployee
                        key={employee.currAccCode}
                        employee={employee}
                        isSelected={selectedEmployees.includes(employee.currAccCode)}
                        onSelect={handleEmployeeSelect}
                        isDragOver={dropTarget?.currAccCode === employee.currAccCode}
                        onDragEnter={handleDragEnter}
                        onDragLeave={handleDragLeave}
                      />
                    ))}
                  </div>
                </SortableContext>
              </CardContent>
            </Card>
          ))}
        </div>
      </DndContext>

      {/* Modals */}
      <AssignmentModal
        isOpen={showAssignmentModal}
        onClose={() => setShowAssignmentModal(false)}
        onConfirm={handleAssignmentConfirm}
        draggedEmployee={draggedEmployee}
        targetEmployee={dropTarget}
        selectedCount={selectedEmployees.length}
      />

      <ManagerTransferModal
        isOpen={showManagerModal}
        onClose={() => setShowManagerModal(false)}
        onConfirm={handleManagerTransferConfirm}
        manager={draggedEmployee}
        targetPosition={dropTarget}
      />
    </div>
  )
}
