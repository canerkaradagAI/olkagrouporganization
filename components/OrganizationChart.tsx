import React, { useState, useRef, useCallback, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { UserIcon, Building2Icon, UsersIcon, BriefcaseIcon, ZoomInIcon, ZoomOutIcon, RotateCcwIcon, InfoIcon } from 'lucide-react'

interface Position {
  id: string
  title: string
  level: number
  color: string
  icon: React.ReactNode
  children?: Position[]
}

interface DragState {
  isDragging: boolean
  draggedId: string | null
  dragOverId: string | null
}

interface ComponentInfo {
  id: string
  title: string
  width: number
  height: number
  x: number
  y: number
  level: number
  parentId?: string
}

export default function OrganizationChart() {
  const [zoomLevel, setZoomLevel] = useState(1)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    draggedId: null,
    dragOverId: null
  })
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [showDebugInfo, setShowDebugInfo] = useState(false)
  const [componentInfos, setComponentInfos] = useState<ComponentInfo[]>([])
  const chartRef = useRef<HTMLDivElement>(null)

  // CSS değişkenleri için style tanımlaması
  const cssVariables = {
    '--hover-color': '#3b82f6',
    '--hover-bg': '#dbeafe',
    '--hover-border': '#3b82f6',
    '--dropzone-color': '#22c55e',
    '--dropzone-bg': '#dcfce7',
    '--dropzone-border': '#22c55e'
  } as React.CSSProperties

  // Component bilgilerini topla
  const collectComponentInfo = useCallback(() => {
    if (!chartRef.current) return

    const elements = chartRef.current.querySelectorAll('[data-position-id]')
    const infos: ComponentInfo[] = []

    elements.forEach((element) => {
      const rect = element.getBoundingClientRect()
      const chartRect = chartRef.current!.getBoundingClientRect()
      const positionId = element.getAttribute('data-position-id')
      const title = element.getAttribute('data-position-title') || ''
      const level = parseInt(element.getAttribute('data-position-level') || '0')
      const parentId = element.getAttribute('data-parent-id')

      if (positionId) {
        infos.push({
          id: positionId,
          title,
          width: rect.width,
          height: rect.height,
          x: rect.left - chartRect.left,
          y: rect.top - chartRect.top,
          level,
          parentId: parentId || undefined
        })
      }
    })

    setComponentInfos(infos)
  }, [])

  // Component bilgilerini güncelle
  useEffect(() => {
    if (showDebugInfo) {
      const timer = setTimeout(collectComponentInfo, 100)
      return () => clearTimeout(timer)
    }
  }, [showDebugInfo, collectComponentInfo])

  // Resize ve scroll olaylarını dinle
  useEffect(() => {
    if (!showDebugInfo) return

    const handleUpdate = () => {
      collectComponentInfo()
    }

    window.addEventListener('resize', handleUpdate)
    window.addEventListener('scroll', handleUpdate)

    return () => {
      window.removeEventListener('resize', handleUpdate)
      window.removeEventListener('scroll', handleUpdate)
    }
  }, [showDebugInfo, collectComponentInfo])

  // 50 kişilik organizasyon yapısı
  const organizationData: Position = {
    id: 'chairman',
    title: 'Chairman',
    level: 1,
    color: 'bg-gray-500',
    icon: <Building2Icon className="h-5 w-5" />,
    children: [
      {
        id: 'ceo',
        title: 'CEO',
        level: 2,
        color: 'bg-purple-500',
        icon: <UserIcon className="h-5 w-5" />,
        children: [
          {
            id: 'general-manager',
            title: 'General Manager',
            level: 3,
            color: 'bg-yellow-500',
            icon: <BriefcaseIcon className="h-5 w-5" />,
            children: [
              {
                id: 'finance-manager',
                title: 'Finance Manager',
                level: 4,
                color: 'bg-blue-300',
                icon: <UsersIcon className="h-4 w-4" />,
                children: [
                  { id: 'asst-finance', title: 'Assistant Manager Finance', level: 5, color: 'bg-blue-200', icon: <UsersIcon className="h-4 w-4" /> },
                  { id: 'senior-accountant', title: 'Senior Accountant', level: 5, color: 'bg-blue-200', icon: <UsersIcon className="h-4 w-4" /> },
                  { id: 'accountant-1', title: 'Accountant', level: 5, color: 'bg-blue-200', icon: <UsersIcon className="h-4 w-4" /> },
                  { id: 'accountant-2', title: 'Accountant', level: 5, color: 'bg-blue-200', icon: <UsersIcon className="h-4 w-4" /> },
                  { id: 'cashier-1', title: 'Cashier', level: 5, color: 'bg-blue-200', icon: <UsersIcon className="h-4 w-4" /> },
                  { id: 'cashier-2', title: 'Cashier', level: 5, color: 'bg-blue-200', icon: <UsersIcon className="h-4 w-4" /> },
                  { id: 'financial-analyst', title: 'Financial Analyst', level: 5, color: 'bg-blue-200', icon: <UsersIcon className="h-4 w-4" /> }
                ]
              },
              {
                id: 'marketing-manager',
                title: 'Marketing Manager',
                level: 4,
                color: 'bg-blue-300',
                icon: <UsersIcon className="h-4 w-4" />,
                children: [
                  { id: 'asst-marketing', title: 'Assistant Manager Marketing', level: 5, color: 'bg-blue-200', icon: <UsersIcon className="h-4 w-4" /> },
                  { id: 'marketing-officer-1', title: 'Marketing Officer', level: 5, color: 'bg-blue-200', icon: <UsersIcon className="h-4 w-4" /> },
                  { id: 'marketing-officer-2', title: 'Marketing Officer', level: 5, color: 'bg-blue-200', icon: <UsersIcon className="h-4 w-4" /> },
                  { id: 'marketing-staff-1', title: 'Marketing Staff', level: 5, color: 'bg-blue-200', icon: <UsersIcon className="h-4 w-4" /> },
                  { id: 'marketing-staff-2', title: 'Marketing Staff', level: 5, color: 'bg-blue-200', icon: <UsersIcon className="h-4 w-4" /> },
                  { id: 'marketing-staff-3', title: 'Marketing Staff', level: 5, color: 'bg-blue-200', icon: <UsersIcon className="h-4 w-4" /> },
                  { id: 'digital-marketing-specialist', title: 'Digital Marketing Specialist', level: 5, color: 'bg-blue-200', icon: <UsersIcon className="h-4 w-4" /> }
                ]
              },
              {
                id: 'sales-manager',
                title: 'Sales Manager',
                level: 4,
                color: 'bg-blue-300',
                icon: <UsersIcon className="h-4 w-4" />,
                children: [
                  { id: 'asst-sales', title: 'Assistant Manager Sales', level: 5, color: 'bg-blue-200', icon: <UsersIcon className="h-4 w-4" /> },
                  { id: 'account-manager-1', title: 'Account Manager', level: 5, color: 'bg-blue-200', icon: <UsersIcon className="h-4 w-4" /> },
                  { id: 'account-manager-2', title: 'Account Manager', level: 5, color: 'bg-blue-200', icon: <UsersIcon className="h-4 w-4" /> },
                  { id: 'sales-officer-1', title: 'Sales Officer', level: 5, color: 'bg-blue-200', icon: <UsersIcon className="h-4 w-4" /> },
                  { id: 'sales-officer-2', title: 'Sales Officer', level: 5, color: 'bg-blue-200', icon: <UsersIcon className="h-4 w-4" /> },
                  { id: 'sales-officer-3', title: 'Sales Officer', level: 5, color: 'bg-blue-200', icon: <UsersIcon className="h-4 w-4" /> },
                  { id: 'sales-staff-1', title: 'Sales Staff', level: 5, color: 'bg-blue-200', icon: <UsersIcon className="h-4 w-4" /> },
                  { id: 'sales-staff-2', title: 'Sales Staff', level: 5, color: 'bg-blue-200', icon: <UsersIcon className="h-4 w-4" /> },
                  { id: 'sales-staff-3', title: 'Sales Staff', level: 5, color: 'bg-blue-200', icon: <UsersIcon className="h-4 w-4" /> }
                ]
              },
              {
                id: 'customer-service-manager',
                title: 'Customer Service Manager',
                level: 4,
                color: 'bg-blue-300',
                icon: <UsersIcon className="h-4 w-4" />,
                children: [
                  { id: 'asst-customer-service', title: 'Assistant Manager Customer Service', level: 5, color: 'bg-blue-200', icon: <UsersIcon className="h-4 w-4" /> },
                  { id: 'team-lead-1', title: 'Team Lead', level: 5, color: 'bg-blue-200', icon: <UsersIcon className="h-4 w-4" /> },
                  { id: 'team-lead-2', title: 'Team Lead', level: 5, color: 'bg-blue-200', icon: <UsersIcon className="h-4 w-4" /> },
                  { id: 'customer-service-staff-1', title: 'Customer Service Staff', level: 5, color: 'bg-blue-200', icon: <UsersIcon className="h-4 w-4" /> },
                  { id: 'customer-service-staff-2', title: 'Customer Service Staff', level: 5, color: 'bg-blue-200', icon: <UsersIcon className="h-4 w-4" /> },
                  { id: 'customer-service-staff-3', title: 'Customer Service Staff', level: 5, color: 'bg-blue-200', icon: <UsersIcon className="h-4 w-4" /> },
                  { id: 'customer-service-staff-4', title: 'Customer Service Staff', level: 5, color: 'bg-blue-200', icon: <UsersIcon className="h-4 w-4" /> },
                  { id: 'customer-service-staff-5', title: 'Customer Service Staff', level: 5, color: 'bg-blue-200', icon: <UsersIcon className="h-4 w-4" /> }
                ]
              },
              {
                id: 'procurement-manager',
                title: 'Procurement Manager',
                level: 4,
                color: 'bg-blue-300',
                icon: <UsersIcon className="h-4 w-4" />,
                children: [
                  { id: 'asst-procurement', title: 'Assistant Manager Procurement', level: 5, color: 'bg-blue-200', icon: <UsersIcon className="h-4 w-4" /> },
                  { id: 'warehouse-officer-1', title: 'Warehouse Officer', level: 5, color: 'bg-blue-200', icon: <UsersIcon className="h-4 w-4" /> },
                  { id: 'warehouse-officer-2', title: 'Warehouse Officer', level: 5, color: 'bg-blue-200', icon: <UsersIcon className="h-4 w-4" /> },
                  { id: 'logistics-officer-1', title: 'Logistics Officer', level: 5, color: 'bg-blue-200', icon: <UsersIcon className="h-4 w-4" /> },
                  { id: 'logistics-officer-2', title: 'Logistics Officer', level: 5, color: 'bg-blue-200', icon: <UsersIcon className="h-4 w-4" /> },
                  { id: 'procurement-staff-1', title: 'Procurement Staff', level: 5, color: 'bg-blue-200', icon: <UsersIcon className="h-4 w-4" /> },
                  { id: 'procurement-staff-2', title: 'Procurement Staff', level: 5, color: 'bg-blue-200', icon: <UsersIcon className="h-4 w-4" /> },
                  { id: 'inventory-specialist', title: 'Inventory Specialist', level: 5, color: 'bg-blue-200', icon: <UsersIcon className="h-4 w-4" /> }
                ]
              },
              {
                id: 'production-manager',
                title: 'Production Manager',
                level: 4,
                color: 'bg-blue-300',
                icon: <UsersIcon className="h-4 w-4" />,
                children: [
                  { id: 'asst-production', title: 'Assistant Manager Production', level: 5, color: 'bg-blue-200', icon: <UsersIcon className="h-4 w-4" /> },
                  { id: 'production-planner-1', title: 'Production Planner', level: 5, color: 'bg-blue-200', icon: <UsersIcon className="h-4 w-4" /> },
                  { id: 'production-planner-2', title: 'Production Planner', level: 5, color: 'bg-blue-200', icon: <UsersIcon className="h-4 w-4" /> },
                  { id: 'quality-assurance-officer', title: 'Quality Assurance Officer', level: 5, color: 'bg-blue-200', icon: <UsersIcon className="h-4 w-4" /> },
                  { id: 'production-supervisor-1', title: 'Production Supervisor', level: 5, color: 'bg-blue-200', icon: <UsersIcon className="h-4 w-4" /> },
                  { id: 'production-supervisor-2', title: 'Production Supervisor', level: 5, color: 'bg-blue-200', icon: <UsersIcon className="h-4 w-4" /> },
                  { id: 'production-staff-1', title: 'Production Staff', level: 5, color: 'bg-blue-200', icon: <UsersIcon className="h-4 w-4" /> },
                  { id: 'production-staff-2', title: 'Production Staff', level: 5, color: 'bg-blue-200', icon: <UsersIcon className="h-4 w-4" /> },
                  { id: 'production-staff-3', title: 'Production Staff', level: 5, color: 'bg-blue-200', icon: <UsersIcon className="h-4 w-4" /> }
                ]
              },
              {
                id: 'hr-manager',
                title: 'Human Resources Manager',
                level: 4,
                color: 'bg-blue-300',
                icon: <UsersIcon className="h-4 w-4" />,
                children: [
                  { id: 'asst-hr', title: 'Assistant Manager Human Resources', level: 5, color: 'bg-blue-200', icon: <UsersIcon className="h-4 w-4" /> },
                  { id: 'training-officer-1', title: 'Training Officer', level: 5, color: 'bg-blue-200', icon: <UsersIcon className="h-4 w-4" /> },
                  { id: 'training-officer-2', title: 'Training Officer', level: 5, color: 'bg-blue-200', icon: <UsersIcon className="h-4 w-4" /> },
                  { id: 'payroll-executive-1', title: 'Payroll Executive', level: 5, color: 'bg-blue-200', icon: <UsersIcon className="h-4 w-4" /> },
                  { id: 'payroll-executive-2', title: 'Payroll Executive', level: 5, color: 'bg-blue-200', icon: <UsersIcon className="h-4 w-4" /> },
                  { id: 'recruitment-executive-1', title: 'Recruitment Executive', level: 5, color: 'bg-blue-200', icon: <UsersIcon className="h-4 w-4" /> },
                  { id: 'recruitment-executive-2', title: 'Recruitment Executive', level: 5, color: 'bg-blue-200', icon: <UsersIcon className="h-4 w-4" /> },
                  { id: 'hr-specialist', title: 'HR Specialist', level: 5, color: 'bg-blue-200', icon: <UsersIcon className="h-4 w-4" /> }
                ]
              },
              {
                id: 'it-manager',
                title: 'IT Manager',
                level: 4,
                color: 'bg-blue-300',
                icon: <UsersIcon className="h-4 w-4" />,
                children: [
                  { id: 'asst-it', title: 'Assistant Manager IT', level: 5, color: 'bg-blue-200', icon: <UsersIcon className="h-4 w-4" /> },
                  { id: 'system-administrator', title: 'System Administrator', level: 5, color: 'bg-blue-200', icon: <UsersIcon className="h-4 w-4" /> },
                  { id: 'software-developer-1', title: 'Software Developer', level: 5, color: 'bg-blue-200', icon: <UsersIcon className="h-4 w-4" /> },
                  { id: 'software-developer-2', title: 'Software Developer', level: 5, color: 'bg-blue-200', icon: <UsersIcon className="h-4 w-4" /> },
                  { id: 'it-support-1', title: 'IT Support', level: 5, color: 'bg-blue-200', icon: <UsersIcon className="h-4 w-4" /> },
                  { id: 'it-support-2', title: 'IT Support', level: 5, color: 'bg-blue-200', icon: <UsersIcon className="h-4 w-4" /> },
                  { id: 'database-administrator', title: 'Database Administrator', level: 5, color: 'bg-blue-200', icon: <UsersIcon className="h-4 w-4" /> }
                ]
              }
            ]
          }
        ]
      }
    ]
  }

  // Drag event handlers
  const handleDragStart = useCallback((e: React.DragEvent, positionId: string) => {
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', positionId)
    setDragState({
      isDragging: true,
      draggedId: positionId,
      dragOverId: null
    })
    
    // Accessibility announcement
    const position = findPositionById(organizationData, positionId)
    if (position) {
      announceToScreenReader(`${position.title} sürükleniyor`)
    }
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent, positionId: string) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    
    if (dragState.draggedId !== positionId) {
      setDragState(prev => ({
        ...prev,
        dragOverId: positionId
      }))
    }
  }, [dragState.draggedId])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    // Only clear if we're leaving the component entirely
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setDragState(prev => ({
        ...prev,
        dragOverId: null
      }))
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent, targetId: string) => {
    e.preventDefault()
    const draggedId = e.dataTransfer.getData('text/plain')
    
    if (draggedId && draggedId !== targetId) {
      // Handle the drop logic here
      console.log(`Dropped ${draggedId} onto ${targetId}`)
      announceToScreenReader(`${findPositionById(organizationData, draggedId)?.title} ${findPositionById(organizationData, targetId)?.title} pozisyonuna taşındı`)
    }
    
    setDragState({
      isDragging: false,
      draggedId: null,
      dragOverId: null
    })
  }, [])

  const handleDragEnd = useCallback(() => {
    setDragState({
      isDragging: false,
      draggedId: null,
      dragOverId: null
    })
  }, [])

  // Hover handlers
  const handleMouseEnter = useCallback((positionId: string) => {
    setHoveredId(positionId)
  }, [])

  const handleMouseLeave = useCallback(() => {
    setHoveredId(null)
  }, [])

  // Keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent, positionId: string) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      // Handle keyboard activation
      announceToScreenReader(`${findPositionById(organizationData, positionId)?.title} seçildi`)
    }
  }, [])

  // Helper functions
  const findPositionById = (position: Position, id: string): Position | null => {
    if (position.id === id) return position
    if (position.children) {
      for (const child of position.children) {
        const found = findPositionById(child, id)
        if (found) return found
      }
    }
    return null
  }

  const announceToScreenReader = (message: string) => {
    const announcement = document.createElement('div')
    announcement.setAttribute('aria-live', 'polite')
    announcement.setAttribute('aria-atomic', 'true')
    announcement.className = 'sr-only'
    announcement.textContent = message
    document.body.appendChild(announcement)
    setTimeout(() => document.body.removeChild(announcement), 1000)
  }

  // Zoom functions
  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 0.2, 3))
  }

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 0.2, 0.5))
  }

  const handleResetZoom = () => {
    setZoomLevel(1)
    setPosition({ x: 0, y: 0 })
  }

  const renderPosition = (position: Position, index: number = 0) => {
    const isDragging = dragState.isDragging && dragState.draggedId === position.id
    const isDropTarget = dragState.dragOverId === position.id
    const isHovered = hoveredId === position.id

    return (
      <div key={position.id} className="flex flex-col items-center">
        {/* Position Box */}
        <div 
          className="text-white p-4 rounded-lg min-w-[200px] min-h-[100px] text-center relative cursor-move select-none"
          data-position-id={position.id}
          data-position-title={position.title}
          data-position-level={position.level}
          style={{
            backgroundColor: isDropTarget ? '#dcfce7' : isHovered ? '#dbeafe' : 
                           position.color.includes('bg-gray-500') ? '#6b7280' : 
                           position.color.includes('bg-purple-500') ? '#8b5cf6' : 
                           position.color.includes('bg-yellow-500') ? '#eab308' : 
                           position.color.includes('bg-blue-300') ? '#93c5fd' : '#bfdbfe',
            border: isDropTarget ? '3px solid #22c55e' : isHovered ? '3px solid #3b82f6' : '2px solid rgba(255,255,255,0.3)',
            transform: isDragging ? 'scale(0.95)' : isDropTarget ? 'scale(1.1)' : isHovered ? 'scale(1.05)' : 'scale(1)',
            opacity: isDragging ? 0.6 : 1,
            boxShadow: isHovered ? '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' : 
                      isDropTarget ? '0 25px 50px -12px rgba(0, 0, 0, 0.25)' : '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            transition: 'all 150ms ease-in-out',
            outline: 'none'
          }}
          draggable
          tabIndex={0}
          onMouseEnter={() => handleMouseEnter(position.id)}
          onMouseLeave={handleMouseLeave}
          onDragStart={(e) => handleDragStart(e, position.id)}
          onDragOver={(e) => handleDragOver(e, position.id)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, position.id)}
          onDragEnd={handleDragEnd}
          onKeyDown={(e) => handleKeyDown(e, position.id)}
          aria-label={`${position.title} pozisyonu - sürüklenebilir`}
          role="button"
          aria-describedby={`position-${position.id}-desc`}
        >
          {/* Avatar with initials */}
          <div className="flex justify-center mb-2">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-sm">
                {position.title.split(' ').map(n => n[0]).join('')}
              </span>
            </div>
          </div>
          
          {/* 3 lines of information */}
          <div className="space-y-1">
            {/* Department - Top */}
            <div className="text-sm text-white font-bold">
              Departman
            </div>
            
            {/* Employee Name - Middle */}
            <div className="font-semibold text-sm text-white">
              {position.title}
            </div>
            
            {/* Position - Bottom */}
            <div className="text-xs text-white/80">
              Pozisyon
            </div>
          </div>
          
          {/* Drop zone indicator */}
          {isDropTarget && (
            <div className="absolute inset-0 border-3 border-dashed border-green-500 bg-green-100 bg-opacity-80 rounded-lg flex items-center justify-center z-10 animate-pulse">
              <div className="text-green-600 text-lg font-bold bg-white px-4 py-2 rounded-full shadow-lg">
                Altına Ekle
              </div>
            </div>
          )}
          
          {/* Hidden description for screen readers */}
          <div id={`position-${position.id}-desc`} className="sr-only">
            {position.title} pozisyonu. Sürüklemek için Enter veya Space tuşuna basın.
          </div>
        </div>

        {/* Children */}
        {position.children && position.children.length > 0 && (
          <div className="mt-4">
            {/* Connection Line */}
            <div className="w-px h-4 bg-gray-300 mx-auto"></div>
            
            {/* Children Container - Müdürler yan yana, personel dikey */}
            <div className="mt-4">
              {/* Connection Line */}
              <div className="w-px h-4 bg-gray-300 mx-auto"></div>
              
              {/* Müdürler yan yana */}
              <div className="flex flex-wrap justify-center gap-6 mt-6">
                {position.children.map((child, childIndex) => (
                  <div key={child.id} className="flex flex-col items-center">
                    {/* Child Position Box */}
                    <div 
                      className="text-white p-3 rounded-lg min-w-[160px] text-center cursor-move select-none"
                      data-position-id={child.id}
                      data-position-title={child.title}
                      data-position-level={child.level}
                      data-parent-id={position.id}
                      style={{
                        backgroundColor: dragState.dragOverId === child.id ? '#dcfce7' : hoveredId === child.id ? '#dbeafe' : 
                                       child.color.includes('bg-blue-300') ? '#93c5fd' : '#bfdbfe',
                        border: dragState.dragOverId === child.id ? '3px solid #22c55e' : hoveredId === child.id ? '3px solid #3b82f6' : '2px solid rgba(255,255,255,0.3)',
                        transform: dragState.isDragging && dragState.draggedId === child.id ? 'scale(0.95)' : 
                                  dragState.dragOverId === child.id ? 'scale(1.1)' : 
                                  hoveredId === child.id ? 'scale(1.05)' : 'scale(1)',
                        opacity: dragState.isDragging && dragState.draggedId === child.id ? 0.6 : 1,
                        boxShadow: hoveredId === child.id ? '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' : 
                                  dragState.dragOverId === child.id ? '0 25px 50px -12px rgba(0, 0, 0, 0.25)' : '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                        transition: 'all 150ms ease-in-out',
                        outline: 'none'
                      }}
                      draggable
                      tabIndex={0}
                      onMouseEnter={() => handleMouseEnter(child.id)}
                      onMouseLeave={handleMouseLeave}
                      onDragStart={(e) => handleDragStart(e, child.id)}
                      onDragOver={(e) => handleDragOver(e, child.id)}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDrop(e, child.id)}
                      onDragEnd={handleDragEnd}
                      onKeyDown={(e) => handleKeyDown(e, child.id)}
                      aria-label={`${child.title} pozisyonu - sürüklenebilir`}
                      role="button"
                      aria-describedby={`position-${child.id}-desc`}
                    >
                      {/* Avatar with initials */}
                      <div className="flex justify-center mb-2">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-md">
                          <span className="text-white font-bold text-xs">
                            {child.title.split(' ').map(n => n[0]).join('')}
                          </span>
                        </div>
                      </div>
                      
                      {/* 3 lines of information */}
                      <div className="space-y-1">
                        {/* Department - Top */}
                        <div className="text-xs text-white font-bold">
                          Departman
                        </div>
                        
                        {/* Employee Name - Middle */}
                        <div className="font-semibold text-xs text-white">
                          {child.title}
                        </div>
                        
                        {/* Position - Bottom */}
                        <div className="text-xs text-white/80">
                          Pozisyon
                        </div>
                      </div>
                      
                      {/* Drop zone indicator */}
                      {dragState.dragOverId === child.id && (
                        <div className="absolute inset-0 border-4 border-dashed border-[var(--dropzone-color)] bg-[var(--dropzone-bg)] bg-opacity-80 rounded-lg flex items-center justify-center z-10 animate-pulse">
                          <div className="text-[var(--dropzone-color)] text-sm font-bold bg-white px-3 py-1 rounded-full shadow-lg">
                            Altına Ekle
                          </div>
                        </div>
                      )}
                      
                      {/* Hidden description for screen readers */}
                      <div id={`position-${child.id}-desc`} className="sr-only">
                        {child.title} pozisyonu. Sürüklemek için Enter veya Space tuşuna basın.
                      </div>
                    </div>
                    
                    {/* Personel dikey olarak */}
                    {child.children && child.children.length > 0 && (
                      <div className="mt-2">
                        <div className="w-px h-3 bg-gray-300 mx-auto mb-1"></div>
                        <div className="flex flex-col items-center gap-2">
                          {child.children.map((person, personIndex) => (
                            <div key={person.id} className="flex flex-col items-center">
                              <div className="w-px h-2 bg-gray-300 mx-auto mb-1"></div>
                              <div 
                                className="text-white p-2 rounded-lg min-w-[140px] text-center cursor-move select-none"
                                data-position-id={person.id}
                                data-position-title={person.title}
                                data-position-level={person.level}
                                data-parent-id={child.id}
                                style={{
                                  backgroundColor: dragState.dragOverId === person.id ? '#dcfce7' : hoveredId === person.id ? '#dbeafe' : 
                                                 person.color.includes('bg-blue-200') ? '#bfdbfe' : '#bfdbfe',
                                  border: dragState.dragOverId === person.id ? '3px solid #22c55e' : hoveredId === person.id ? '3px solid #3b82f6' : '2px solid rgba(255,255,255,0.3)',
                                  transform: dragState.isDragging && dragState.draggedId === person.id ? 'scale(0.95)' : 
                                            dragState.dragOverId === person.id ? 'scale(1.1)' : 
                                            hoveredId === person.id ? 'scale(1.05)' : 'scale(1)',
                                  opacity: dragState.isDragging && dragState.draggedId === person.id ? 0.6 : 1,
                                  boxShadow: hoveredId === person.id ? '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' : 
                                            dragState.dragOverId === person.id ? '0 25px 50px -12px rgba(0, 0, 0, 0.25)' : '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                                  transition: 'all 150ms ease-in-out',
                                  outline: 'none'
                                }}
                                draggable
                                tabIndex={0}
                                onMouseEnter={() => handleMouseEnter(person.id)}
                                onMouseLeave={handleMouseLeave}
                                onDragStart={(e) => handleDragStart(e, person.id)}
                                onDragOver={(e) => handleDragOver(e, person.id)}
                                onDragLeave={handleDragLeave}
                                onDrop={(e) => handleDrop(e, person.id)}
                                onDragEnd={handleDragEnd}
                                onKeyDown={(e) => handleKeyDown(e, person.id)}
                                aria-label={`${person.title} pozisyonu - sürüklenebilir`}
                                role="button"
                                aria-describedby={`position-${person.id}-desc`}
                              >
                                <div className="flex items-center justify-center gap-2">
                                  {person.icon}
                                  <span className="font-semibold text-xs">{person.title}</span>
                                </div>
                                
                                {/* Drop zone indicator */}
                                {dragState.dragOverId === person.id && (
                                  <div className="absolute inset-0 border-4 border-dashed border-[var(--dropzone-color)] bg-[var(--dropzone-bg)] bg-opacity-80 rounded-lg flex items-center justify-center z-10 animate-pulse">
                                    <div className="text-[var(--dropzone-color)] text-xs font-bold bg-white px-2 py-1 rounded-full shadow-lg">
                                      Altına Ekle
                                    </div>
                                  </div>
                                )}
                                
                                {/* Hidden description for screen readers */}
                                <div id={`position-${person.id}-desc`} className="sr-only">
                                  {person.title} pozisyonu. Sürüklemek için Enter veya Space tuşuna basın.
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Organizasyon Şeması - Önizleme</span>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">Olka Group</Badge>
                  <div className="flex gap-1">
                    <Button
                      onClick={() => setShowDebugInfo(!showDebugInfo)}
                      variant={showDebugInfo ? "default" : "outline"}
                      size="sm"
                    >
                      <InfoIcon className="h-4 w-4 mr-1" />
                      Debug
                    </Button>
                    <Button
                      onClick={handleZoomOut}
                      variant="outline"
                      size="sm"
                      disabled={zoomLevel <= 0.5}
                    >
                      <ZoomOutIcon className="h-4 w-4" />
                    </Button>
                    <Button
                      onClick={handleZoomIn}
                      variant="outline"
                      size="sm"
                      disabled={zoomLevel >= 3}
                    >
                      <ZoomInIcon className="h-4 w-4" />
                    </Button>
                    <Button
                      onClick={handleResetZoom}
                      variant="outline"
                      size="sm"
                    >
                      <RotateCcwIcon className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div 
          ref={chartRef}
          className="w-full overflow-auto h-[800px] border rounded-lg bg-gray-50"
          style={{
            transform: `scale(${zoomLevel}) translate(${position.x}px, ${position.y}px)`,
            transformOrigin: 'center center',
            transition: 'transform 0.2s ease-in-out'
          }}
        >
          <div className="flex justify-center min-w-max p-10">
            {renderPosition(organizationData)}
          </div>
        </div>
        
        {/* Legend */}
        <div className="mt-8 pt-6 border-t">
          <h4 className="text-sm font-semibold text-gray-700 mb-3">Pozisyon Seviyeleri</h4>
          <div className="flex flex-wrap gap-4 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-gray-500 rounded"></div>
              <span>Yönetim Kurulu</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-purple-500 rounded"></div>
              <span>Üst Yönetim</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-yellow-500 rounded"></div>
              <span>Genel Müdürlük</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-300 rounded"></div>
              <span>Departman Müdürleri</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-200 rounded"></div>
              <span>Çalışanlar</span>
            </div>
          </div>
          
          {/* Instructions */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h5 className="text-sm font-semibold text-blue-800 mb-2">Kullanım Talimatları:</h5>
            <ul className="text-xs text-blue-700 space-y-1">
              <li>• Pozisyonları sürükleyip bırakarak yeniden düzenleyebilirsiniz</li>
              <li>• Hover durumunda mavi vurgu, drop zone'da yeşil vurgu görünür</li>
              <li>• Klavye ile Tab tuşu ile gezinip Enter/Space ile sürükleyebilirsiniz</li>
              <li>• Sürükleme sırasında öğe küçülür ve şeffaflaşır</li>
            </ul>
          </div>

          {/* Debug Panel */}
          {showDebugInfo && (
            <div className="mt-6 p-4 bg-gray-100 rounded-lg border">
              <h5 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <InfoIcon className="h-4 w-4" />
                Component Debug Bilgileri
              </h5>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {componentInfos.map((info) => (
                  <div key={info.id} className="bg-white p-3 rounded border text-xs">
                    <div className="font-semibold text-gray-800 mb-2">{info.title}</div>
                    <div className="space-y-1 text-gray-600">
                      <div><span className="font-medium">ID:</span> {info.id}</div>
                      <div><span className="font-medium">Seviye:</span> {info.level}</div>
                      <div><span className="font-medium">Boyut:</span> {Math.round(info.width)}×{Math.round(info.height)}px</div>
                      <div><span className="font-medium">Pozisyon:</span> ({Math.round(info.x)}, {Math.round(info.y)})px</div>
                      {info.parentId && (
                        <div><span className="font-medium">Üst:</span> {info.parentId}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 p-3 bg-yellow-50 rounded border-l-4 border-yellow-400">
                <div className="text-sm text-yellow-800">
                  <strong>Toplam Component:</strong> {componentInfos.length} | 
                  <strong> Ortalama Boyut:</strong> {componentInfos.length > 0 ? 
                    `${Math.round(componentInfos.reduce((sum, info) => sum + info.width, 0) / componentInfos.length)}×${Math.round(componentInfos.reduce((sum, info) => sum + info.height, 0) / componentInfos.length)}px` : 
                    'N/A'
                  }
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
