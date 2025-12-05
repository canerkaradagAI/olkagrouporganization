
import React, { useEffect, useRef, useState, useCallback } from 'react'
import * as d3 from 'd3'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog'
import { Label } from './ui/label'
import { Input } from './ui/input'
import { Checkbox } from './ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { ZoomInIcon, ZoomOutIcon, RotateCcwIcon, UndoIcon, RedoIcon, SaveIcon, FocusIcon } from 'lucide-react'
import { UserIcon } from 'lucide-react'

interface Employee {
  currAccCode: string
  firstLastName: string
  positionName: string
  departmentName: string
  managerName: string
  locationName: string
  brandName: string
  isManager: boolean
  hideFromChart?: boolean
  departmentId?: number | null
  locationId?: number | null
  brandId?: number | null
  companyId?: number | null
  managerId?: string | null
}

interface OrganizationTreeProps {
  employees: Employee[]
  highlightId?: string
  levelColors?: Record<string, string>
  levelOrders?: Record<string, number>
  searchQuery?: string
  selectedSeats?: Set<string>
  onSeatSelectionChange?: (seats: Set<string>) => void
  onSelectedIdsChange?: (selectedIds: Set<string>) => void
}

export default function OrganizationTree({ employees, highlightId, levelColors = {}, levelOrders = {}, searchQuery = '', selectedSeats = new Set(), onSeatSelectionChange, onSelectedIdsChange }: OrganizationTreeProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const svgSelRef = useRef<d3.Selection<SVGSVGElement, unknown, null, undefined> | null>(null)
  const rootRef = useRef<any | null>(null)
  const zoomRef = useRef<d3.ZoomBehavior<Element, unknown> | null>(null)
  const lastTransformRef = useRef(d3.zoomIdentity)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const selectedIdsRef = useRef<Set<string>>(new Set()) // Ref ile de tut (closure problemi için)
  const [selectedNode, setSelectedNode] = useState<any | null>(null) // Tek seçili node (koltuk ekleme/silme için)
  const selectedNodeRef = useRef<any | null>(null) // Ref ile de tut (closure problemi için)
  
  // selectedIds değiştiğinde ref'i güncelle
  useEffect(() => {
    selectedIdsRef.current = selectedIds
  }, [selectedIds])

  // selectedIds değiştiğinde parent'a bildir (ayrı effect - sonsuz loop'u önlemek için)
  useEffect(() => {
    if (onSelectedIdsChange) {
      onSelectedIdsChange(selectedIds)
    }
  }, [selectedIds]) // onSelectedIdsChange'i dependency'den çıkardık - useCallback ile sarmalandı
  const [isDragging, setIsDragging] = useState(false)
  const [dragStartPosition, setDragStartPosition] = useState<{x: number, y: number} | null>(null)
  const [draggedNodes, setDraggedNodes] = useState<any[]>([]) // Çoklu sürükleme için
  const [showMoveModal, setShowMoveModal] = useState(false)
  const [moveData, setMoveData] = useState<{
    node: any,
    target: any,
    hasChildren: boolean,
    childrenCount: number,
    isMultiMove?: boolean,
    selectedNodes?: any[]
  } | null>(null)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [showInvalidModal, setShowInvalidModal] = useState(false)
  const [showSwapModal, setShowSwapModal] = useState(false)
  const [swapData, setSwapData] = useState<{
    manager1: any,
    manager2: any,
    manager1TeamCount: number,
    manager2TeamCount: number
  } | null>(null)
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [assignData, setAssignData] = useState<{
    person: any,
    target: any,
    teamCount: number
  } | null>(null)
  const [data, setData] = useState<any | null>(null)
  
  // Geri/İleri için history yönetimi
  const [history, setHistory] = useState<any[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)

  const getLevelOrder = (name?: string | null) => {
    const key = (name || '').toLowerCase().trim()
    const val = levelOrders[key]
    return typeof val === 'number' ? val : 9999
  }

  // Child düğümleri sayma fonksiyonu
  const countChildren = (node: any): number => {
    if (!node || !node.children || !Array.isArray(node.children)) return 0
    let count = node.children.length
    for (const child of node.children) {
      count += countChildren(child)
    }
    return count
  }

  // Helper: Bir müdürün altındaki kişi sayısını employees array'inden hesapla
  const countSubordinates = (managerId: string): number => {
    return employees.filter(emp => emp.managerId === managerId).length
  }

  // Data içinde node bulma helper
  const findNodeInData = (node: any, targetId: string): any => {
    if (!node) return null
    const nodeId = node.data?.id || node.data?.currAccCode
    if (nodeId === targetId) return node
    if (node.children) {
      for (const child of node.children) {
        const found = findNodeInData(child, targetId)
        if (found) return found
      }
    }
    return null
  }

  // Çoklu taşıma fonksiyonu
  const performBulkMove = (nodes: any[], target: any, withChildren: boolean) => {
    const cloned = JSON.parse(JSON.stringify(data))
    
    nodes.forEach((node) => {
      const primaryId = node.data.id || node.data.currAccCode
      const targetId = target.data.id || target.data.currAccCode
      
      const findByIdSafe = (node: any, id: string): any => {
        if (!node) return null
        if ((node.id || node.currAccCode) === id) return node
        if (!node.children || !Array.isArray(node.children)) return null
        for (const c of node.children) {
          const r = findByIdSafe(c, id)
          if (r) return r
        }
        return null
      }
      
      const nodeData = findByIdSafe(data, primaryId)
      if (!nodeData) return
      
      let movingNodeData
      if (withChildren) {
        movingNodeData = nodeData
      } else {
        if (nodeData.children && nodeData.children.length > 0) {
          const findParentInOriginal = (node: any, targetId: string): any => {
            if (!node || !node.children) return null
            for (const child of node.children) {
              const childId = child.id || child.currAccCode
              if (childId === targetId) return node
              const found = findParentInOriginal(child, targetId)
              if (found) return found
            }
            return null
          }
          
          const parentNode = findParentInOriginal(data, primaryId)
          if (parentNode && parentNode.children) {
            parentNode.children.push(...nodeData.children)
          }
        }
        
        movingNodeData = {
          ...nodeData,
          children: []
        }
      }
      
      const removeFromParent = (node: any, id: string): boolean => {
        if (!node || !node.children || !Array.isArray(node.children)) return false
        
        const findAndRemoveChildren = (parentNode: any, targetId: string) => {
          if (!parentNode || !parentNode.children) return false
          
          for (let i = parentNode.children.length - 1; i >= 0; i--) {
            const child = parentNode.children[i]
            const childId = child.id || child.currAccCode
            
            if (childId === targetId) {
              parentNode.children.splice(i, 1)
              return true
            } else {
              if (findAndRemoveChildren(child, targetId)) {
                return true
              }
            }
          }
          return false
        }
        
        return findAndRemoveChildren(node, id)
      }
      
      const findByIdInCloned = (node: any, id: string): any => {
        if (!node) return null
        if ((node.id || node.currAccCode) === id) return node
        if (!node.children || !Array.isArray(node.children)) return null
        for (const c of node.children) {
          const r = findByIdInCloned(c, id)
          if (r) return r
        }
        return null
      }
      
      const targetNode = findByIdInCloned(cloned, targetId)
      if (!targetNode) return
      
      if (!Array.isArray(targetNode.children)) targetNode.children = []
      
      const isDescendant = (node: any, possibleAncestorId: string): boolean => {
        if (!node || !node.children) return false
        for (const c of node.children) {
          const cid = c.id || c.currAccCode
          if (cid === possibleAncestorId) return true
          if (isDescendant(c, possibleAncestorId)) return true
        }
        return false
      }
      
      const movingId = movingNodeData.id || movingNodeData.currAccCode
      if (isDescendant(movingNodeData, targetId) || movingId === targetId) {
        return // Geçersiz işlem, atla
      }
      
      removeFromParent(cloned, movingId)
      
      if (!targetNode.children.some((c: any) => (c.id || c.currAccCode) === movingId)) {
        targetNode.children.push(movingNodeData)
      }
    })
    
    addToHistory(cloned)
    setData(cloned)
  }

  // Modal işleme fonksiyonları
  const handleMoveWithChildren = () => {
    if (!moveData) return
    if (moveData.isMultiMove && moveData.selectedNodes) {
      performBulkMove(moveData.selectedNodes, moveData.target, true)
    } else {
      performMove(moveData.node, moveData.target, true)
    }
    setShowMoveModal(false)
    setMoveData(null)
    setSelectedIds(new Set()) // Seçimi temizle
  }

  const handleMoveWithoutChildren = () => {
    if (!moveData) return
    if (moveData.isMultiMove && moveData.selectedNodes) {
      performBulkMove(moveData.selectedNodes, moveData.target, false)
    } else {
      performMove(moveData.node, moveData.target, false)
    }
    setShowMoveModal(false)
    setMoveData(null)
    setSelectedIds(new Set()) // Seçimi temizle
  }

  const handleCancelMove = () => {
    setShowMoveModal(false)
    setMoveData(null)
    setDraggedNodes([])
    // Düğümü orijinal pozisyonuna geri döndür
    setData((prev: any) => ({ ...prev }))
  }

  // Swap managers handler
  const handleSwapManagers = async () => {
    if (!swapData) return

    try {
      const response = await fetch('/api/organization/swap-managers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          manager1Id: swapData.manager1.data.id || swapData.manager1.data.currAccCode,
          manager2Id: swapData.manager2.data.id || swapData.manager2.data.currAccCode
        })
      })

      if (response.ok) {
        const result = await response.json()
        alert(`✅ ${result.message}\n${result.manager1Name} ve ${result.manager2Name} yer değiştirildi.\nToplam ${result.totalUpdated} kişi güncellendi.`)
        setShowSwapModal(false)
        setSwapData(null)
        setSelectedIds(new Set())
        // Sayfayı yenile
        window.location.reload()
      } else {
        const error = await response.json()
        alert(`❌ Hata: ${error.message}`)
      }
    } catch (error) {
      console.error('Swap managers error:', error)
      alert('❌ Müdürler yer değiştirilirken hata oluştu')
    }
  }

  // Assign team handler
  const handleAssignTeam = async () => {
    if (!assignData) return

    try {
      const response = await fetch('/api/organization/assign-team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          oldManagerId: assignData.person.data.id || assignData.person.data.currAccCode,
          newManagerId: assignData.target.data.id || assignData.target.data.currAccCode
        })
      })

      if (response.ok) {
        const result = await response.json()
        alert(`✅ ${result.message}\n${result.teamCount} kişi ${result.newManagerName} yöneticisine atandı.`)
        setShowAssignModal(false)
        setAssignData(null)
        setSelectedIds(new Set())
        window.location.reload()
      } else {
        const error = await response.json()
        alert(`❌ Hata: ${error.message}`)
      }
    } catch (error) {
      console.error('Assign team error:', error)
      alert('❌ Ekip atanırken hata oluştu')
    }
  }

  // Assign person handler
  const handleAssignPerson = async () => {
    if (!assignData) return

    try {
      const response = await fetch('/api/organization/assign-person', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          personId: assignData.person.data.id || assignData.person.data.currAccCode,
          targetManagerId: assignData.target.data.id || assignData.target.data.currAccCode
        })
      })

      if (response.ok) {
        const result = await response.json()
        alert(`✅ ${result.message}\n${result.personName} ${result.targetManagerName} yöneticisine bağlandı.`)
        setShowAssignModal(false)
        setAssignData(null)
        setSelectedIds(new Set())
        window.location.reload()
      } else {
        const error = await response.json()
        alert(`❌ Hata: ${error.message}`)
      }
    } catch (error) {
      console.error('Assign person error:', error)
      alert('❌ Kişi atanırken hata oluştu')
    }
  }

  // Taşıma işlemini gerçekleştiren fonksiyon
  const performMove = (node: any, target: any, withChildren: boolean) => {
    const cloned = JSON.parse(JSON.stringify(data))
    const primaryId = node.data.id || node.data.currAccCode
    const targetId = target.data.id || target.data.currAccCode

    // Kaydırılacak node'un verisini orijinal ağaçtan al
    const findByIdSafe = (node: any, id: string): any => {
      if (!node) return null
      if ((node.id || node.currAccCode) === id) return node
      if (!node.children || !Array.isArray(node.children)) return null
      for (const c of node.children) {
        const r = findByIdSafe(c, id)
        if (r) return r
      }
      return null
    }

    const nodeData = findByIdSafe(data, primaryId)
    if (!nodeData) return

    // Child düğümleri ile mi taşıyacağız?
    let movingNodeData
    if (withChildren) {
      movingNodeData = nodeData
    } else {
      // Child düğümleri üst düğüme bağla
      if (nodeData.children && nodeData.children.length > 0) {
        // Parent düğümü bul (orijinal ağaçta)
        const findParentInOriginal = (node: any, targetId: string): any => {
          if (!node || !node.children) return null
          for (const child of node.children) {
            const childId = child.id || child.currAccCode
            if (childId === targetId) return node
            const found = findParentInOriginal(child, targetId)
            if (found) return found
          }
          return null
        }
        
        const parentNode = findParentInOriginal(data, primaryId)
        if (parentNode && parentNode.children) {
          // Child düğümleri parent'a ekle (orijinal ağaçta)
          parentNode.children.push(...nodeData.children)
          
          // Cloned ağaçta da aynı işlemi yap
          const findParentInCloned = (node: any, targetId: string): any => {
            if (!node || !node.children) return null
            for (const child of node.children) {
              const childId = child.id || child.currAccCode
              if (childId === targetId) return node
              const found = findParentInCloned(child, targetId)
              if (found) return found
            }
            return null
          }
          
          const parentNodeInCloned = findParentInCloned(cloned, primaryId)
          if (parentNodeInCloned && parentNodeInCloned.children) {
            parentNodeInCloned.children.push(...nodeData.children)
          }
        }
      }
      
      movingNodeData = {
        ...nodeData,
        children: [] // Child düğümleri temizle
      }
    }

    // cloned ağaçtan node'u çıkar
    const removeFromParent = (node: any, id: string): boolean => {
      if (!node || !node.children || !Array.isArray(node.children)) return false
      
      const findAndRemoveChildren = (parentNode: any, targetId: string) => {
        if (!parentNode || !parentNode.children) return false
        
        for (let i = parentNode.children.length - 1; i >= 0; i--) {
          const child = parentNode.children[i]
          const childId = child.id || child.currAccCode
          
          if (childId === targetId) {
            parentNode.children.splice(i, 1)
            return true
          } else {
            if (findAndRemoveChildren(child, targetId)) {
              return true
            }
          }
        }
        return false
      }
      
      return findAndRemoveChildren(node, id)
    }

    // Hedef düğümü bul
    const findByIdInCloned = (node: any, id: string): any => {
      if (!node) return null
      if ((node.id || node.currAccCode) === id) return node
      if (!node.children || !Array.isArray(node.children)) return null
      for (const c of node.children) {
        const r = findByIdInCloned(c, id)
        if (r) return r
      }
      return null
    }

    const targetNode = findByIdInCloned(cloned, targetId)
    if (!targetNode) return

    if (!Array.isArray(targetNode.children)) targetNode.children = []

    // Döngü oluşturmayı engelle
    const isDescendant = (node: any, possibleAncestorId: string): boolean => {
      if (!node || !node.children) return false
      for (const c of node.children) {
        const cid = c.id || c.currAccCode
        if (cid === possibleAncestorId) return true
        if (isDescendant(c, possibleAncestorId)) return true
      }
      return false
    }

    const movingId = movingNodeData.id || movingNodeData.currAccCode
    if (isDescendant(movingNodeData, targetId) || movingId === targetId) {
      // Döngü oluşturacak işlem - geçersiz pop-up göster
      setShowInvalidModal(true)
      setTimeout(() => setShowInvalidModal(false), 3000)
      
      // Düğümü orijinal pozisyonuna geri döndür
      setData((prev: any) => ({ ...prev }))
      return
    }

    // Önce klondan çıkar
    removeFromParent(cloned, movingId)

    // Hedefe ekle
    if (!targetNode.children.some((c: any) => (c.id || c.currAccCode) === movingId)) {
      targetNode.children.push(movingNodeData)
    }

    // History'ye ekle
    addToHistory(cloned)
    setData(cloned)
  }
  const [isLoading, setIsLoading] = useState(false)

  // Klavye kısayolları
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // CTRL tuşu basılı mı kontrol et
      if (event.ctrlKey || event.metaKey) {
        switch (event.key.toLowerCase()) {
          case 'z':
            event.preventDefault()
            if (event.shiftKey) {
              // CTRL+SHIFT+Z = İleri Al
              handleRedo()
            } else {
              // CTRL+Z = Geri Al
              handleUndo()
            }
            break
          case 'y':
            event.preventDefault()
            // CTRL+Y = İleri Al
            handleRedo()
            break
          case 's':
            event.preventDefault()
            // CTRL+S = Kaydet
            handleSave()
            break
        }
      }
    }

    // Event listener'ı ekle
    document.addEventListener('keydown', handleKeyDown)

    // Cleanup
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [historyIndex, history.length, isLoading, data])

  // Fallback data sadece employees boş olduğunda kullanılır
  const fallbackData = {
    id: 'fallback',
    name: 'Veri Yok',
    title: 'Çalışan Bulunamadı',
    department: 'N/A',
    isManager: false,
    children: []
  }

  const buildHierarchy = (employees: Employee[]): any => {
    // Eğer employees boşsa, hiçbir şey döndürme (varsayılan sahte veriyi kullanma)
    if (!employees.length) return null

    console.log('🌳 buildHierarchy çağrıldı, employees sayısı:', employees.length)
    console.log('🌳 İlk 5 çalışan:', employees.slice(0, 5).map(e => ({ name: e.firstLastName, manager: e.managerName })))

    const employeeMap = new Map<string, any>()
    employees.forEach(emp => {
      // hideFromChart kontrolü: eğer gizli ve yönetici değilse, hiyerarşiden çıkar
      const isHiddenManager = emp.hideFromChart && emp.isManager
      const shouldHide = emp.hideFromChart && !emp.isManager
      
      employeeMap.set(emp.currAccCode, { 
        ...emp, 
        children: [],
        isHiddenManager,
        shouldHide
      })
    })

    let root: any = null
    
    // Önce Yasin Kavşak'ı bul ve root olarak ayarla
    const yasinKavsak = employees.find(emp => emp.firstLastName === 'Yasin Kavşak')
    if (yasinKavsak) {
      root = employeeMap.get(yasinKavsak.currAccCode)
      console.log('🌳 Root (Yasin Kavşak) bulundu:', root)
    }
    
    employees.forEach(emp => {
      const employee = employeeMap.get(emp.currAccCode)
      
      // hideFromChart kontrolü: eğer gizli ve yönetici değilse, hiyerarşiden çıkar
      if (employee.shouldHide) {
        return // Bu çalışanı hiyerarşiden çıkar ama toplam sayıya dahil et (sayma işlemi ayrı yapılacak)
      }
      
      // Yasin Kavşak'ı atla, zaten root olarak ayarlandı
      if (emp.firstLastName === 'Yasin Kavşak') return
      
      // managerName alanını kontrol et
      const managerName = emp.managerName
      
      if (!managerName || managerName === '') {
        // Manager yoksa root'a ekle
        if (root) {
          root.children.push(employee)
        } else {
          if (!root) root = employee
        }
      } else {
        // Manager'ı bul - manager'ın kendisi gizli olsa bile (gri kutucuk olarak gösterilecek)
        const manager = Array.from(employeeMap.values()).find((mgr: any) => mgr.firstLastName === managerName)
        if (manager) {
          manager.children.push(employee)
          console.log(`🌳 ${emp.firstLastName} -> ${managerName} (başarılı)`)
        } else {
          console.log(`🌳 Manager bulunamadı: ${managerName} (${emp.firstLastName})`)
          // Manager bulunamazsa root'a ekle
          if (root) {
            root.children.push(employee)
          } else {
            if (!root) root = employee
          }
        }
      }
    })
    
    console.log('🌳 Final root:', root)
    console.log('🌳 Root children sayısı:', root?.children?.length || 0)
    
    return root || fallbackData
  }

  // selectedIds değiştiğinde ref'i güncelle
  useEffect(() => {
    selectedIdsRef.current = selectedIds
  }, [selectedIds])
  
  // selectedIds değiştiğinde görsel vurguyu güncelle
  useEffect(() => {
    if (!svgRef.current) return
    
    const svg = d3.select(svgRef.current)
    const nodesLayer = svg.select('.nodes-layer')
    
    if (nodesLayer.empty()) {
      console.warn('⚠️ nodesLayer bulunamadı, görsel vurgu uygulanamıyor')
      return
    }
    
    nodesLayer.selectAll<SVGGElement, any>('g.node').each(function(nd: any) {
      const nodeId = nd.data.id || nd.data.currAccCode
      const isSelected = selectedIds.has(nodeId)
      const rect = d3.select(this).select('rect')
      
      if (isSelected) {
        const isHidden = nd.data.isHiddenManager
        rect
          .style('fill', '#fef3c7')
          .style('stroke', '#dc2626')
          .style('stroke-width', '4px')
          .style('stroke-dasharray', isHidden ? '8,4' : 'none')
          .style('filter', 'drop-shadow(0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04))')
          .style('transform', 'scale(1.05)')
      } else {
        const levelKey = (nd.data.levelName || '').toLowerCase().trim()
        const lvlColor = levelColors[levelKey]
        const isHidden = nd.data.isHiddenManager
        const fillColor = isHidden ? '#e5e7eb' : (lvlColor || (nd.data.isManager ? '#dbeafe' : '#f8fafc'))
        const strokeColor = isHidden ? '#9ca3af' : (highlightId && nodeId === highlightId ? '#800000' : (nd.data.isManager ? '#3b82f6' : '#64748b'))
        
        rect
          .style('fill', fillColor)
          .style('stroke', strokeColor)
          .style('stroke-width', highlightId && nodeId === highlightId ? '5px' : '3px')
          .style('stroke-dasharray', isHidden ? '8,4' : 'none')
          .style('filter', 'drop-shadow(0 1px 1px rgba(0,0,0,0.04))')
          .style('transform', 'scale(1)')
      }
    })
  }, [selectedIds, highlightId, levelColors])
  
  // selectedIds değiştiğinde selectedNode'u güncelle
  useEffect(() => {
    if (selectedIds.size === 0) {
      selectedNodeRef.current = null
      setSelectedNode(null)
      return
    }
    
    if (selectedIds.size > 1) {
      selectedNodeRef.current = null
      setSelectedNode(null)
      return
    }
    
    if (selectedIds.size === 1) {
      const selectedId = Array.from(selectedIds)[0]
      
      if (selectedNodeRef.current) {
        const refNodeId = selectedNodeRef.current.data?.id || selectedNodeRef.current.data?.currAccCode
        if (refNodeId === selectedId) {
          const currentStateId = selectedNode?.data?.id || selectedNode?.data?.currAccCode
          if (currentStateId !== selectedId) {
            console.log('🟡 Ref\'te node var, state güncelleniyor:', selectedNodeRef.current.data?.firstLastName)
            setSelectedNode(selectedNodeRef.current)
          }
          return
        }
      }
      
      if (data) {
        const findNode = (node: any): any => {
          const nodeId = node.data?.id || node.data?.currAccCode
          if (nodeId === selectedId) {
            return node
          }
          if (node.children) {
            for (const child of node.children) {
              const found = findNode(child)
              if (found) return found
            }
          }
          return null
        }
        const foundNode = findNode(data)
        if (foundNode) {
          console.log('✅ selectedNode bulundu (useEffect):', foundNode.data?.firstLastName || foundNode.data?.name)
          selectedNodeRef.current = foundNode
          setSelectedNode(foundNode)
        } else {
          console.log('❌ selectedNode bulunamadı, selectedId:', selectedId)
        }
      }
    }
  }, [selectedIds, data, selectedNode])

  // Click handler - useCallback kullanmadan doğrudan tanımla (closure problemi için)
  // NOT: Bu fonksiyon her render'da yeniden oluşturulacak ama D3.js event listener'ları
  // her render'da yeniden ekleniyor, bu yüzden sorun olmayacak

  useEffect(() => {
    if (!svgRef.current) return

    console.log('🔄 OrganizationTree: employees değişti, yeni hierarchy oluşturuluyor...', employees.length)
    console.log('🔄 OrganizationTree: employees array:', employees.map(e => e.firstLastName))
    
    // Her employees değiştiğinde yeni hierarchy oluştur
    const hierarchy = buildHierarchy(employees)
    if (!hierarchy) {
      console.log('❌ OrganizationTree: hierarchy oluşturulamadı')
      return
    }
    
    console.log('✅ OrganizationTree: hierarchy oluşturuldu, data güncelleniyor...', hierarchy)
    
    // Data'yı güncelle
    setData(hierarchy)
    
    // İlk durumu history'ye ekle
    if (history.length === 0) {
      addToHistory(hierarchy)
    }
  }, [employees]) // Sadece employees değiştiğinde çalışsın

  useEffect(() => {
    if (!svgRef.current) return
    
    // Data null veya undefined ise fallbackData kullan
    const dataToUse = data || fallbackData
    if (!dataToUse) {
      console.warn('⚠️ OrganizationTree: data ve fallbackData yok, chart çizilemiyor')
      return
    }

    console.log('🎨 OrganizationTree: data değişti, D3 chart çiziliyor...', dataToUse)
    
    const svg = d3.select(svgRef.current)
    svg.selectAll("*").remove()
    svgSelRef.current = svg as any

    const width = 3200  // 2400'den 3200'e artırıldı
    const height = 2400 // 1600'den 2400'e artırıldı

    svg.attr('width', width).attr('height', height)

    const root = d3.hierarchy(dataToUse)
    rootRef.current = root

    // Çocukları level order'a göre sırala (yukarıdan aşağıya)
    root.each((d: any) => {
      if (!d.children || d.children.length === 0) return
      d.children.sort((a: any, b: any) => getLevelOrder(a.data.levelName) - getLevelOrder(b.data.levelName))
    })

    console.log('🌳 D3 hierarchy oluşturuldu:', root)
    console.log('🌳 Root children sayısı:', root.children?.length || 0)
    
    // Düğümler arası yatay/dikey boşluklar - Çakışmayı önlemek için artırıldı
    const nodeWidth = 240
    const nodeHeight = 90
    const horizontalGap = 120  // 80'den 120'ye artırıldı
    const verticalGap = 150    // 120'den 150'ye artırıldı
    const treeLayout = d3
      .tree<any>()
      .nodeSize([nodeWidth + horizontalGap, nodeHeight + verticalGap])
      .separation((a: any, b: any) => {
        // Aynı ebeveyn altındaki düğümler arasında daha fazla boşluk
        if (a.parent === b.parent) return 1.5  // 1.0'dan 1.5'e artırıldı
        // Farklı ebeveynler arasında daha fazla boşluk
        return 2.0  // 1.4'ten 2.0'a artırıldı
      })
    
    treeLayout(root)
    console.log('🌳 Tree layout uygulandı, root:', root)

    // Dikey istif: tüm çocuklar yaprak ise, level order'a göre sıralı dikey hizala
    const verticalLeafSpacing = nodeHeight + 30  // 16'dan 30'a artırıldı
    root.each((d: any) => {
      if (!d.children || d.children.length === 0) return
      const allLeaf = d.children.every((c: any) => !c.children || c.children.length === 0)
      if (!allLeaf) return

      // Zaten yukarıda sort edildi; sadece konumlandır
      const baseY = d.y + nodeHeight + 30
      d.children.forEach((c: any, idx: number) => {
        c.x = d.x
        c.y = baseY + idx * verticalLeafSpacing
      })
    })
    // Root'un pozisyonunu kontrol et
    console.log('🌳 Root x,y:', root.x, root.y)
    if (root.children) {
      root.children.forEach((child, i) => {
        console.log(`🌳 Child ${i}:`, child.data.firstLastName, 'x,y:', child.x, child.y)
      })
    }

    // Base group for margin and a child group for zoom transform
    const base = svg.append('g').attr('transform', 'translate(50,50)')
    const g = base.append('g')
    const linksLayer = g.append('g').attr('class', 'links-layer')
    const nodesLayer = g.append('g').attr('class', 'nodes-layer')
    // Varsa son zoom/pan dönüşümünü koru
    g.attr('transform', lastTransformRef.current.toString())

    // Zoom behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.2, 3])
      // Çift tıklamada zoom'u kapat, node click'lerini engelleme ama pan'e izin ver
      .filter((event) => {
        if (event.type === 'dblclick') return false
        // Pan için sadece boş alan (svg/base g) mousedown'ına izin ver
        if (event.type === 'mousedown') {
          const target = event.target as HTMLElement | SVGGElement
          const baseNode = base.node()
          return !!(target && (target.tagName === 'svg' || (target.tagName === 'g' && baseNode && target === baseNode)))
        }
        // Diğer tüm event'ler (click dahil) geçsin; node click'leri çalışsın
        return true
      })
      .on('zoom', (event) => {
        lastTransformRef.current = event.transform
        g.attr('transform', `${event.transform.toString()}`)
      })
    svg.call(zoom as any)
    // Güvenlik: d3'nin default dblclick.zoom handler'ını kaldır
    svg.on('dblclick.zoom', null as any)
    // Önceki transformu yeniden uygula ki ekran kaymasın
    ;(zoom as any).transform(svg as any, lastTransformRef.current)
    zoomRef.current = zoom as any

    // Links (orthogonal/elbow) - bus/omurga yok, klasik bağlantılar
    const linkGenerator = (d: any) => {
      const x1 = d.source.x
      const y1 = d.source.y
      const x2 = d.target.x
      const y2 = d.target.y
      // KURAL (T=1.1): Aynı ebeveyn altında birden fazla yaprak varsa ve
      // çocuk yaprak ebeveyniyle aynı kolonda ise -> dikey-istif uygula
      const isLeaf = !d.target.children || d.target.children.length === 0
      const sameColumn = Math.abs(x1 - x2) < 1
      const parentLeafCount = (d.source.children || []).filter((c: any) => !c.children || c.children.length === 0).length
      const shouldUseVerticalBus = isLeaf && sameColumn && parentLeafCount > 1
      if (shouldUseVerticalBus) {
        const off = 180  // 140'tan 180'e artırıldı - çizgi çakışmalarını önlemek için
        return `M ${x1},${y1} H ${x1 - off} V ${y2} H ${x2}`
      }
      const yMid = (y1 + y2) / 2
      return `M ${x1},${y1} V ${yMid} H ${x2} V ${y2}`
    }

    const simpleLinkPath = (x1: number, y1: number, x2: number, y2: number) => {
      const yMid = (y1 + y2) / 2
      return `M ${x1},${y1} V ${yMid} H ${x2} V ${y2}`
    }

    const updateAllLinks = () => {
      linksLayer.selectAll<SVGPathElement, any>('.link')
        .attr('d', (lnk: any) => simpleLinkPath(
          lnk.source.x,
          lnk.source.y,
          lnk.target.x,
          lnk.target.y
        ))
    }

    linksLayer.selectAll('.link')
      .data(root.links())
      .enter()
      .append('path')
      .attr('class', 'link')
      .attr('d', linkGenerator as any)
      .style('fill', 'none')
      .style('stroke', '#374151')
      .style('stroke-width', 2)

    // Nodes
    const descendants = root.descendants()
    console.log('🌳 Root descendants sayısı:', descendants.length)
    console.log('🌳 Descendants:', descendants.map(d => d.data.firstLastName || d.data.name))
    
    const node = nodesLayer.selectAll('.node')
      .data(descendants, (d: any) => d.data.id || d.data.currAccCode)
    
    // Yeni node'ları ekle
    const nodeEnter = node.enter()
      .append('g')
      .attr('class', 'node')
      .attr('transform', (d: any) => {
        const isLeaf = !d.children || d.children.length === 0
        const sameColumnWithParent = d.parent ? Math.abs(d.x - d.parent.x) < 1 : false
        const offset = isLeaf && sameColumnWithParent ? 40 : 0  // 25'ten 40'a artırıldı
        return `translate(${d.x + offset},${d.y})`
      })
    
    // Mevcut node'ları güncelle
    const nodeUpdate = nodeEnter.merge(node as any)
      .attr('transform', (d: any) => {
        const isLeaf = !d.children || d.children.length === 0
        const sameColumnWithParent = d.parent ? Math.abs(d.x - d.parent.x) < 1 : false
        const offset = isLeaf && sameColumnWithParent ? 40 : 0
        return `translate(${d.x + offset},${d.y})`
      })
    
    // NOT: Click handler'ları sadece rect element'ine ekleyeceğiz (g element'ine değil)
    // Çünkü rect element'i tıklanabilir alan, g element'i sadece container

    // Node rectangles styled like the provided image
    const rectWidth = 240
    const rectHeight = 64

    // Rect element'lerini seç veya oluştur
    const rect = nodeUpdate.selectAll('rect').data((d: any) => [d])
    const rectEnter = rect.enter()
      .append('rect')
      .attr('x', -rectWidth / 2)
      .attr('y', -rectHeight / 2)
      .attr('width', rectWidth)
      .attr('height', rectHeight)
      .attr('rx', 12)
      .attr('ry', 12)
    
    const rectUpdate = rectEnter.merge(rect as any)
      .attr('x', -rectWidth / 2)
      .attr('y', -rectHeight / 2)
      .attr('width', rectWidth)
      .attr('height', rectHeight)
      .attr('rx', 12)
      .attr('ry', 12)
      .style('fill', (d: any) => {
        // Koltuk kontrolü
        const nodeId = d.data.id || d.data.currAccCode || ''
        const isSeat = nodeId.startsWith('SEAT_')
        
        if (isSeat) {
          // Seçili koltuklar için daha koyu mavi
          if (selectedSeats.has(nodeId)) {
            return '#80c7ff' // Daha koyu pastel mavi
          }
          return '#b3d9ff' // Pastel mavi
        }
        
        // Gizli yönetici ise gri kutucuk göster
        if (d.data.isHiddenManager) {
          return '#e5e7eb'
        }
        if (selectedIds.has(nodeId)) {
          return '#fef3c7' // Sarı arka plan
        }
        const levelKey = (d.data.levelName || '').toLowerCase().trim()
        const lvlColor = levelColors[levelKey]
        if (lvlColor) return lvlColor
        return d.data.isManager ? '#dbeafe' : '#f8fafc'
      })
      .style('stroke', (d: any) => {
        // Koltuk kontrolü
        const nodeId = d.data.id || d.data.currAccCode || ''
        const isSeat = nodeId.startsWith('SEAT_')
        
        if (isSeat) {
          // Seçili koltuklar için daha kalın kenarlık
          if (selectedSeats.has(nodeId)) {
            return '#4b5563' // Daha koyu gri
          }
          return '#6b7280' // Gri kenarlık
        }
        
        // Gizli yönetici ise gri çerçeve göster
        if (d.data.isHiddenManager) {
          return '#9ca3af'
        }
        if (highlightId && nodeId === highlightId) {
          return '#800000' // Bordo çerçeve
        }
        if (selectedIds.has(nodeId)) {
          return '#dc2626' // Kırmızı çerçeve (CTRL ile seçilenler)
        }
        const levelKey = (d.data.levelName || '').toLowerCase().trim()
        const lvlColor = levelColors[levelKey]
        if (lvlColor) return lvlColor
        return d.data.isManager ? '#3b82f6' : '#64748b'
      })
      .style('stroke-dasharray', (d: any) => {
        // Koltuk kontrolü - çizgili kenarlık
        const nodeId = d.data.id || d.data.currAccCode || ''
        const isSeat = nodeId.startsWith('SEAT_')
        
        if (isSeat) {
          return '5,5' // Çizgili gri kenarlık
        }
        // Gizli yönetici ise kesik çizgili kenarlık
        if (d.data.isHiddenManager) {
          return '8,4'
        }
        return 'none'
      })
      .style('stroke-width', (d: any) => {
        const nodeId = d.data.id || d.data.currAccCode || ''
        const isSeat = nodeId.startsWith('SEAT_')
        
        if (isSeat && selectedSeats.has(nodeId)) {
          return 4 // Seçili koltuklar için daha kalın kenarlık
        }
        
        if (highlightId && nodeId === highlightId) return 5
        return selectedIds.has(nodeId) ? 4 : 3
      })
      .style('filter', 'drop-shadow(0 1px 1px rgba(0,0,0,0.04))')
      .style('transition', 'all 150ms ease-in-out')
      .style('cursor', (d: any) => {
        const nodeId = d.data.id || d.data.currAccCode || ''
        if (nodeId.startsWith('SEAT_')) {
          return 'default' // Koltuklar sürüklenemez, normal cursor
        }
        return 'pointer'
      })
      .style('pointer-events', 'all') // ÖNEMLİ: Click event'lerinin yakalanması için
      .on('click', null) // Önce temizle
      .on('pointerdown', function(event: any, d: any) {
        console.log('🔵🔵🔵 RECT SELECT EVENT TETİKLENDİ! 🔵🔵🔵', {
          nodeName: d?.data?.firstLastName || d?.data?.name || 'BİLİNMEYEN',
          nodeId: d?.data?.id || d?.data?.currAccCode || 'BİLİNMEYEN',
          eventType: event?.type,
          target: event?.target?.tagName,
          currentTarget: event?.currentTarget?.tagName,
          ctrlKey: event?.ctrlKey,
          metaKey: event?.metaKey,
          shiftKey: event?.shiftKey,
          pointerType: event?.pointerType
        })
        
        if (!d || !d.data) {
          console.error('❌ Select handler: d veya d.data yok!', { d })
          return
        }
        
        const id = d.data.id || d.data.currAccCode
        if (!id) {
          console.error('❌ Select handler: id bulunamadı!', { d })
          return
        }
        
        const isMulti = event.ctrlKey || event.metaKey || event.shiftKey
        
        console.log('🟡 Select handler içinde:', { id, isMulti })

        // CTRL/CMD/Shift yoksa seçim yapma (tekli seçim dahil)
        if (!isMulti) {
          return
        }
        
        // Koltuk seçimi kontrolü
        const isSeat = id.startsWith('SEAT_')
        
        if (isSeat && onSeatSelectionChange) {
          // Koltuk seçimi için özel handler
          if (isMulti) {
            const newSeats = new Set(selectedSeats)
            if (newSeats.has(id)) {
              newSeats.delete(id)
            } else {
              newSeats.add(id)
            }
            onSeatSelectionChange(newSeats)
          } else {
            onSeatSelectionChange(new Set([id]))
          }
          return
        }
        
        // Normal node seçimi - closure problemi için callback pattern kullan
        if (isMulti) {
          setSelectedIds(prev => {
            const next = new Set(prev)
            if (next.has(id)) {
              next.delete(id)
            } else {
              next.add(id)
            }
            selectedIdsRef.current = next // Ref'i güncelle
            selectedNodeRef.current = null
            setSelectedNode(null)
            console.log('🟡 Çoklu seçim, yeni set:', Array.from(next))
            return next
          })
        } else {
          const newSet = new Set([id])
          console.log('🟢🟢🟢 TEK SEÇİM YAPILDI! 🟢🟢🟢', {
            nodeName: d.data?.firstLastName || d.data?.name,
            nodeId: id
          })
          
          // Önce ref'leri güncelle
          selectedIdsRef.current = newSet
          selectedNodeRef.current = d
          
          // Sonra state'leri güncelle
          setSelectedNode(d)
          setSelectedIds(newSet)
        }
      })

    // Hover effects
    rectUpdate
      .on('mouseenter', function(event: any, d: any) {
        const nodeId = d.data.id || d.data.currAccCode
        const isSeat = nodeId.startsWith('SEAT_')
        const isSelected = selectedIds.has(nodeId)
        const isSeatSelected = isSeat && selectedSeats.has(nodeId)
        const isHighlighted = !!highlightId && nodeId === highlightId
        
        // Koltuk hover efekti
        if (isSeat) {
          d3.select(this)
            .style('fill', isSeatSelected ? '#80c7ff' : '#b3d9ff')
            .style('stroke', isSeatSelected ? '#4b5563' : '#6b7280')
            .style('stroke-dasharray', '5,5') // Koltuklar her zaman çizgili
            .style('stroke-width', isSeatSelected ? 4 : 3)
            .style('filter', 'drop-shadow(0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04))')
            .style('transform', 'scale(1.05)')
          return
        }
        
        if (isSelected) {
          d3.select(this)
            .style('fill', '#fde68a')
            .style('stroke', isHighlighted ? '#800000' : '#dc2626') // Kırmızı çerçeve
            .style('stroke-width', isHighlighted ? 5 : 5)
            .style('filter', 'drop-shadow(0 25px 50px -12px rgba(0, 0, 0, 0.25))')
            .style('transform', 'scale(1.1)')
        } else {
          d3.select(this)
            .style('fill', (dAny: any) => {
              // Gizli yönetici ise gri tut
              if (dAny.data.isHiddenManager) {
                return '#e5e7eb'
              }
              const levelKey = (dAny.data.levelName || '').toLowerCase().trim()
              const lvlColor = levelColors[levelKey]
              return lvlColor || '#fef3c7'
            })
            .style('stroke', (dAny: any) => {
              // Gizli yönetici ise gri çerçeve tut
              if (dAny.data.isHiddenManager) {
                return '#9ca3af'
              }
              return isHighlighted ? '#800000' : '#f59e0b'
            })
            .style('stroke-dasharray', (dAny: any) => {
              // Gizli yönetici ise kesik çizgili kenarlık
              if (dAny.data.isHiddenManager) {
                return '8,4'
              }
              return 'none'
            })
            .style('stroke-width', isHighlighted ? 5 : 4)
            .style('filter', 'drop-shadow(0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04))')
            .style('transform', 'scale(1.05)')
        }
      })
      .on('mouseleave', function(event: any, d: any) {
        const nodeId = d.data.id || d.data.currAccCode
        const isSeat = nodeId.startsWith('SEAT_')
        const isSelected = selectedIds.has(nodeId)
        const isSeatSelected = isSeat && selectedSeats.has(nodeId)
        const isHighlighted = !!highlightId && nodeId === highlightId
        
        // Koltuk hover efekti
        if (isSeat) {
          d3.select(this)
            .style('fill', isSeatSelected ? '#80c7ff' : '#b3d9ff')
            .style('stroke', isSeatSelected ? '#4b5563' : '#6b7280')
            .style('stroke-dasharray', '5,5') // Koltuklar her zaman çizgili
            .style('stroke-width', isSeatSelected ? 4 : 3)
            .style('filter', 'drop-shadow(0 1px 1px rgba(0,0,0,0.04))')
            .style('transform', 'scale(1)')
          return
        }
        
        if (isSelected) {
          d3.select(this)
            .style('fill', '#fef3c7')
            .style('stroke', isHighlighted ? '#800000' : '#dc2626') // Kırmızı çerçeve
            .style('stroke-width', isHighlighted ? 5 : 4)
            .style('filter', 'drop-shadow(0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04))')
            .style('transform', 'scale(1.05)')
        } else {
          d3.select(this)
            .style('fill', (dAny: any) => {
              // Gizli yönetici ise gri tut
              if (dAny.data.isHiddenManager) {
                return '#e5e7eb'
              }
              return dAny.data.isManager ? '#dbeafe' : (levelColors[(dAny.data.levelName || '').toLowerCase().trim()] || '#f8fafc')
            })
            .style('stroke', (dAny: any) => {
              // Gizli yönetici ise gri çerçeve tut
              if (dAny.data.isHiddenManager) {
                return '#9ca3af'
              }
              return isHighlighted ? '#800000' : (dAny.data.isManager ? '#3b82f6' : '#64748b')
            })
            .style('stroke-dasharray', (dAny: any) => {
              // Gizli yönetici ise kesik çizgili kenarlık
              if (dAny.data.isHiddenManager) {
                return '8,4'
              }
              return 'none'
            })
            .style('stroke-width', isHighlighted ? 5 : 3)
            .style('filter', 'drop-shadow(0 1px 1px rgba(0,0,0,0.04))')
            .style('transform', 'scale(1)')
        }
      })

    // Drag & drop to re-parent
    const drag = d3.drag<any, any>()
      .filter((event) => {
        // Click event'lerini engelle - sadece drag için çalışsın
        if (event.type === 'click') {
          return false
        }
        // Koltuklar için drag'i engelle (sadece tıklanabilir olsunlar)
        // event.subject kullanarak node verisine eriş
        if (event.subject && event.subject.data) {
          const nodeId = event.subject.data.id || event.subject.data.currAccCode || ''
          if (nodeId.startsWith('SEAT_')) {
            return false // Koltuklar sürüklenemez
          }
        }
        return true
      })
      .on('start', function (event, d) {
        // Koltuklar için drag'i engelle (ekstra kontrol)
        const draggedId = d.data.id || d.data.currAccCode
        if (draggedId && draggedId.startsWith('SEAT_')) {
          event.sourceEvent.stopPropagation()
          return
        }
        d3.select(this).raise()
        // Sürükleme sırasında zoom davranışını geçici kapat
        if (svgSelRef.current) {
          svgSelRef.current.on('.zoom', null as any)
        }
        
        // Sürükleme durumunu güncelle
        setIsDragging(true)
        setDragStartPosition({ x: d.x, y: d.y })
        
        // Çoklu seçim kontrolü - ref kullan (closure problemi için)
        const currentSelectedIds = selectedIdsRef.current
        const selectedNodes: any[] = []
        const isMultiDrag = currentSelectedIds.size > 1 && currentSelectedIds.has(draggedId)
        
        if (isMultiDrag) {
          // Seçili tüm düğümleri bul ve görsel olarak vurgula
          g.selectAll<SVGGElement, any>('.node').each(function(nd: any) {
            const nodeId = nd.data.id || nd.data.currAccCode
            if (currentSelectedIds.has(nodeId)) {
              selectedNodes.push(nd)
              // Seçili tüm düğümleri görsel olarak vurgula (kırmızı çerçeve)
              d3.select(this).select('rect')
                .style('fill', '#fef3c7')
                .style('stroke', '#dc2626') // Kırmızı çerçeve
                .style('stroke-width', '4px')
                .style('opacity', '0.8')
                .style('transform', 'scale(0.95)')
                .style('filter', 'drop-shadow(0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04))')
                .attr('fill', '#fef3c7')
                .attr('stroke', '#dc2626')
                .attr('stroke-width', '4')
            }
          })
          setDraggedNodes(selectedNodes)
        } else {
          // Tek öğe sürükleme (mevcut davranış)
          setDraggedNodes([d])
          d3.select(this).select('rect')
            .style('fill', '#fef3c7 !important') // Sarı arka plan
            .style('stroke', '#f59e0b !important') // Sarı kenarlık
            .style('stroke-width', '4px !important')
            .style('opacity', '0.8 !important')
            .style('transform', 'scale(0.95) !important')
            .style('filter', 'drop-shadow(0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)) !important')
            .attr('fill', '#fef3c7') // SVG attribute olarak da ayarla
            .attr('stroke', '#f59e0b')
            .attr('stroke-width', '4')
        }
      })
      .on('drag', function (event, d) {
        const draggedId = d.data.id || d.data.currAccCode
        const currentSelectedIds = selectedIdsRef.current
        const isMultiDrag = currentSelectedIds.size > 1 && currentSelectedIds.has(draggedId)
        
        // Ekran koordinatını zoom/pan'den arındır
        const pt = d3.pointer(event, base.node() as any)
        const inv = lastTransformRef.current.invert([pt[0], pt[1]])
        const x = inv[0]
        const y = inv[1]
        
        if (isMultiDrag) {
          // Çoklu sürükleme: Tüm seçili öğeleri birlikte hareket ettir
          const deltaX = x - (dragStartPosition?.x || d.x)
          const deltaY = y - (dragStartPosition?.y || d.y)
          
          // Seçili tüm düğümleri bul ve hareket ettir
          g.selectAll<SVGGElement, any>('.node').each(function(nd: any) {
            const nodeId = nd.data.id || nd.data.currAccCode
            if (currentSelectedIds.has(nodeId)) {
              if (nodeId === draggedId) {
                // Ana sürüklenen öğe
                d3.select(this).attr('transform', `translate(${x},${y})`)
              } else {
                // Diğer seçili öğeler - göreceli konumlarını koru
                const originalX = nd.x || 0
                const originalY = nd.y || 0
                const newX = originalX + deltaX
                const newY = originalY + deltaY
                nd.x = newX
                nd.y = newY
                d3.select(this).attr('transform', `translate(${newX},${newY})`)
              }
            }
          })
        } else {
          // Tek öğe sürükleme (mevcut davranış)
          d.x = x
          d.y = y
          d3.select(this).attr('transform', `translate(${x},${y})`)
        }

        updateAllLinks()
        
        // İlk drag'de gölge oluştur (sadece tek öğe için)
        if (!isMultiDrag && !g.select('.shadow-copy').empty()) {
          // Gölge zaten var, güncelle
          g.select('.shadow-copy')
            .attr('transform', `translate(${dragStartPosition?.x || d.x},${dragStartPosition?.y || d.y})`)
        } else if (!isMultiDrag) {
          // Gölge yok, oluştur - gerçekçi klon gibi
          const shadowGroup = g.append('g')
            .attr('class', 'shadow-copy')
            .attr('transform', `translate(${dragStartPosition?.x || d.x},${dragStartPosition?.y || d.y})`)
            .style('opacity', 0.7)
            .style('pointer-events', 'none')
          
          // Gölge kopya için rect oluştur - orijinal boyutlarla
          shadowGroup.append('rect')
            .attr('x', -rectWidth / 2)
            .attr('y', -rectHeight / 2)
            .attr('width', rectWidth)
            .attr('height', rectHeight)
            .attr('rx', 12)
            .attr('ry', 12)
            .style('fill', d.data.isManager ? '#dbeafe' : '#f8fafc')
            .style('stroke', d.data.isManager ? '#3b82f6' : '#64748b')
            .style('stroke-width', 3)
            .style('stroke-dasharray', '8,4')
            .style('filter', 'drop-shadow(0 8px 16px rgba(0, 0, 0, 0.15))')
          
          // Gölge kopya için text oluştur - orijinal pozisyonlarla
          shadowGroup.append('text')
            .attr('x', 0)
            .attr('y', -8)
            .attr('text-anchor', 'middle')
            .attr('dominant-baseline', 'middle')
            .style('font-size', '12px')
            .style('font-weight', '600')
            .style('fill', d.data.isManager ? '#1e40af' : '#374151')
            .text(d.data.title || d.data.name || 'Position')
          
          // Alt satır için ikinci text (eğer varsa)
          if (d.data.name && d.data.title) {
            shadowGroup.append('text')
              .attr('x', 0)
              .attr('y', 8)
              .attr('text-anchor', 'middle')
              .attr('dominant-baseline', 'middle')
              .style('font-size', '10px')
              .style('font-weight', '400')
              .style('fill', d.data.isManager ? '#1e40af' : '#6b7280')
              .text(d.data.name)
          }
        }
        
        // Sürüklenen düğümleri sarı tut (draggedId ve isMultiDrag zaten yukarıda tanımlı)
        if (isMultiDrag) {
          // Çoklu sürükleme: Tüm seçili öğeleri sarı tut
          g.selectAll<SVGGElement, any>('.node').each(function(nd: any) {
            const nodeId = nd.data.id || nd.data.currAccCode
            if (currentSelectedIds.has(nodeId)) {
              const isHidden = nd.data.isHiddenManager
              d3.select(this).select('rect')
                .style('fill', '#fef3c7')
                .style('stroke', '#dc2626') // Kırmızı çerçeve
                .style('stroke-width', '4px')
                .style('stroke-dasharray', isHidden ? '8,4' : 'none')
                .style('opacity', '0.8')
                .style('transform', 'scale(0.95)')
                .style('filter', 'drop-shadow(0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04))')
                .attr('fill', '#fef3c7')
                .attr('stroke', '#dc2626')
                .attr('stroke-width', '4')
                .attr('stroke-dasharray', isHidden ? '8,4' : 'none')
            }
          })
        } else {
          // Tek öğe sürükleme
          const isHidden = d.data.isHiddenManager
          d3.select(this).select('rect')
            .style('fill', '#fef3c7 !important')
            .style('stroke', '#f59e0b !important')
            .style('stroke-width', '4px !important')
            .style('stroke-dasharray', isHidden ? '8,4 !important' : 'none !important')
            .style('opacity', '0.8 !important')
            .style('transform', 'scale(0.95) !important')
            .style('filter', 'drop-shadow(0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)) !important')
            .attr('fill', '#fef3c7')
            .attr('stroke', '#f59e0b')
            .attr('stroke-width', '4')
            .attr('stroke-dasharray', isHidden ? '8,4' : 'none')
        }
        
        // En yakın hedef düğümü bul ve vurgula
        let target: any = null
        let minDist = Infinity
        g.selectAll<SVGGElement, any>('.node').each(function (nd: any) {
          // Çoklu sürüklemede seçili öğeleri hedef olarak sayma
          if (isMultiDrag) {
            const ndId = nd.data.id || nd.data.currAccCode
            if (currentSelectedIds.has(ndId)) return
          } else {
            if (nd === d) return
          }
          const [tx, ty] = [nd.x, nd.y]
          const dist = Math.hypot(x - tx, y - ty)
          if (dist < minDist) { minDist = dist; target = nd }
        })
        
        // Diğer düğümleri normal duruma getir (sürüklenen hariç)
        g.selectAll<SVGGElement, any>('.node').each(function(nd: any) {
          const ndId = nd.data.id || nd.data.currAccCode
          const isDragged = isMultiDrag ? currentSelectedIds.has(ndId) : (nd === d)
          if (!isDragged) {
            const levelKey = (nd.data.levelName || '').toLowerCase().trim()
            const lvlColor = levelColors[levelKey]
            const isHidden = nd.data.isHiddenManager
            const fillColor = isHidden ? '#e5e7eb' : (lvlColor || (nd.data.isManager ? '#dbeafe' : '#f8fafc'))
            const strokeColor = isHidden ? '#9ca3af' : (nd.data.isManager ? '#3b82f6' : '#64748b')
            d3.select(this).select('rect')
              .style('fill', fillColor)
              .style('stroke', strokeColor)
              .style('stroke-width', currentSelectedIds.has(nd.data.id || nd.data.currAccCode) ? 4 : 3)
              .style('stroke-dasharray', isHidden ? '8,4' : 'none')
              .style('filter', 'drop-shadow(0 1px 1px rgba(0,0,0,0.04))')
              .style('transform', 'scale(1)')
              .attr('fill', fillColor)
              .attr('stroke', strokeColor)
              .attr('stroke-dasharray', isHidden ? '8,4' : 'none')
          }
        })
        
        // Hedef düğümü yeşil vurgula
        if (target && minDist < 200) {
          g.selectAll<SVGGElement, any>('.node').each(function (nd: any) {
            if (nd === target) {
              d3.select(this).select('rect')
                .style('fill', '#dcfce7')
                .style('stroke', '#22c55e')
                .style('stroke-width', 4)
                .style('filter', 'drop-shadow(0 25px 50px -12px rgba(0, 0, 0, 0.25))')
                .style('transform', 'scale(1.1)')
                .attr('fill', '#dcfce7')
                .attr('stroke', '#22c55e')
            }
          })
        }
      })
      .on('end', function (event, d) {
        // Koltuklar için drag işlemini engelle
        const draggedId = d.data.id || d.data.currAccCode
        if (draggedId && draggedId.startsWith('SEAT_')) {
          // Koltuklar sürüklenemez, sadece tıklanabilir
          setData((prev: any) => ({ ...prev }))
          setDraggedNodes([])
          setIsDragging(false)
          setDragStartPosition(null)
          g.selectAll('.shadow-copy').remove()
          return
        }
        
        // En yakın hedef düğümü bul
        // Mevcut zoom/pan'i hesaba kat: pointer'ı g koordinatlarına çevir
        const pt = d3.pointer(event, base.node() as any)
        const inv = lastTransformRef.current.invert([pt[0], pt[1]])
        const mx = inv[0]
        const my = inv[1]
        let target: any = null
        let minDist = Infinity
        
        const currentSelectedIds = selectedIdsRef.current
        const isMultiDrag = currentSelectedIds.size > 1 && currentSelectedIds.has(draggedId)
        
        g.selectAll<SVGGElement, any>('.node').each(function (nd: any) {
          // Çoklu sürüklemede seçili öğeleri hedef olarak sayma
          if (isMultiDrag) {
            const ndId = nd.data.id || nd.data.currAccCode
            if (currentSelectedIds.has(ndId)) return
          } else {
            if (nd === d) return
          }
          const [tx, ty] = [nd.x, nd.y]
          const dist = Math.hypot(mx - tx, my - ty)
          if (dist < minDist) { minDist = dist; target = nd }
        })
        const dropThreshold = 200
        if (!target || minDist > dropThreshold) {
          // Yeterince yakın değil, yeniden çizimi tetikle
          setData((prev: any) => ({ ...prev }))
          setDraggedNodes([])
          return
        }

        // ÖNCE: Parent-child ilişkisi kontrol et (döngü kontrolü)
        const isDescendant = (node: any, possibleAncestorId: string): boolean => {
          if (!node || !node.children) return false
          for (const c of node.children) {
            const cid = c.id || c.currAccCode
            if (cid === possibleAncestorId) return true
            if (isDescendant(c, possibleAncestorId)) return true
          }
          return false
        }

        // Data objesini güncelle - gerçek değişikliği yap
        const updateDataStructure = (rootNode: any, draggedNode: any, newParent: any) => {
          if (!rootNode) return false
          
          // Eğer bu düğüm sürüklenen düğümse, parent'ını değiştir
          if (rootNode === draggedNode) {
            // Eski parent'tan çıkar
            if (rootNode.parent && rootNode.parent.children) {
              const index = rootNode.parent.children.indexOf(rootNode)
              if (index > -1) {
                rootNode.parent.children.splice(index, 1)
              }
            }
            
            // Yeni parent'a ekle
            if (newParent) {
              if (!newParent.children) newParent.children = []
              newParent.children.push(rootNode)
              rootNode.parent = newParent
            } else {
              rootNode.parent = null
            }
            
            return true
          }
          
          // Alt düğümleri kontrol et
          if (rootNode.children) {
            for (const child of rootNode.children) {
              if (updateDataStructure(child, draggedNode, newParent)) {
                return true
              }
            }
          }
          
          return false
        }

        const targetId = target.data.id || target.data.currAccCode

        if (isMultiDrag) {
          // Çoklu taşıma: Tüm seçili öğeleri kontrol et
          const selectedNodesArray: any[] = []
          let hasInvalidMove = false
          
          // Seçili tüm düğümleri bul
          g.selectAll<SVGGElement, any>('.node').each(function(nd: any) {
            const nodeId = nd.data.id || nd.data.currAccCode
            if (currentSelectedIds.has(nodeId)) {
              selectedNodesArray.push(nd)
              if (isDescendant(nd.data, targetId) || nodeId === targetId) {
                hasInvalidMove = true
              }
            }
          })
          
          if (hasInvalidMove) {
            setShowInvalidModal(true)
            setTimeout(() => setShowInvalidModal(false), 3000)
            setData((prev: any) => ({ ...prev }))
            setDraggedNodes([])
            return
          }
          
          // Çoklu taşıma modal'ı göster
          setMoveData({
            node: d, // Ana düğüm (gösterim için)
            target: target,
            hasChildren: false,
            childrenCount: selectedNodesArray.length,
            isMultiMove: true,
            selectedNodes: selectedNodesArray
          })
          setShowMoveModal(true)
          return
        } else {
          // Tek öğe taşıma (mevcut kod)
          const movingId = d.data.id || d.data.currAccCode

          if (isDescendant(d.data, targetId) || movingId === targetId) {
            // Döngü oluşturacak işlem - geçersiz pop-up göster
            setShowInvalidModal(true)
            setTimeout(() => setShowInvalidModal(false), 3000)
            
            // Düğümü orijinal pozisyonuna geri döndür
            setData((prev: any) => ({ ...prev }))
            setDraggedNodes([])
            return
          }

          // Eğer sürüklenen kişi müdür ise, assign modal göster
          if (d.data.isManager) {
            const managerId = d.data.id || d.data.currAccCode
            const teamCount = countSubordinates(managerId)
            setAssignData({
              person: d,
              target: target,
              teamCount: teamCount
            })
            setShowAssignModal(true)
            return
          }

          // SONRA: Child düğümleri var mı kontrol et
          const hasChildren = d.data.children && d.data.children.length > 0
          const childrenCount = hasChildren ? countChildren(d.data) : 0

          if (hasChildren) {
            // Child düğümleri var, kullanıcıya sor
            setMoveData({
              node: d,
              target: target,
              hasChildren: true,
              childrenCount: childrenCount
            })
            setShowMoveModal(true)
            return
          }

          // Child düğümleri yoksa direkt taşı
          performMove(d, target, false)
          
          console.log('✅ Drag-drop başarılı:', d.data.firstLastName, '->', target.data.firstLastName)
        }
        
        // Sürükleme durumunu güncelle
        setIsDragging(false)
        setDragStartPosition(null)
        setDraggedNodes([])
        
        // Gölge kopyayı kaldır
        g.selectAll('.shadow-copy').remove()
        
        // Sürükleme sonrası görsel efektleri sıfırla - sürüklenen düğümü sarı bırak
        const draggedNodeId = d.data.id || d.data.currAccCode
        
        // Sürükleme sonrası tüm düğümleri normal renklerine döndür
        g.selectAll<SVGGElement, any>('.node').select('rect')
          .style('fill', (nd: any) => {
            const levelKey = (nd.data.levelName || '').toLowerCase().trim()
            const lvlColor = levelColors[levelKey]
            return lvlColor || (nd.data.isManager ? '#dbeafe' : '#f8fafc')
          })
          .style('stroke', (nd: any) => {
            return nd.data.isManager ? '#3b82f6' : '#64748b'
          })
          .style('stroke-dasharray', (nd: any) => {
            return 'none'
          })
          .style('stroke-width', 3)
          .style('filter', 'drop-shadow(0 1px 1px rgba(0,0,0,0.04))')
          .style('transform', 'scale(1)')
          .style('opacity', 1)
      })

    // Drag'i doğrudan rect'e bağla; bubble bağımlılığını azalt
    rectUpdate.call(drag as any)
    // Drag'i g (node) seviyesine de bağla; farklı alt eleman tıklamalarında da çalışsın
    nodeUpdate.call(drag as any)

    // Gradient definition for avatar backgrounds (single gradient for all avatars)
    const defs = svg.append('defs')
    const gradient = defs.append('linearGradient')
      .attr('id', 'avatarGradient')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '100%')
      .attr('y2', '100%')
    
    gradient.append('stop')
      .attr('offset', '0%')
      .attr('stop-color', '#3b82f6')
    
    gradient.append('stop')
      .attr('offset', '100%')
      .attr('stop-color', '#2563eb')

    // Avatar circle with gradient - kutunun sol kenar orta noktasından 5px sağda
    nodeUpdate.append('circle')
      .attr('cx', -100)
      .attr('cy', 0)
      .attr('r', 16)
      .style('fill', 'url(#avatarGradient)')
      .style('stroke', '#ffffff')
      .style('stroke-width', '2px')
      .style('filter', 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))')
      .style('pointer-events', 'none') // Circle element'i click event'lerini engellemesin

    // Avatar initials - kutunun sol kenar orta noktasından 5px sağda
    nodeUpdate.append('text')
      .attr('text-anchor', 'middle')
      .attr('x', -100)
      .attr('y', 6)
      .style('pointer-events', 'none') // Text element'leri click event'lerini engellemesin
      .style('font-size', '11px')
      .style('font-weight', '700')
      .style('fill', '#ffffff')
      .text((d: any) => {
        // Gizli yönetici ise baş harfleri gösterme
        if (d.data.isHiddenManager) {
          return ''
        }
        const name = d.data.name || d.data.firstLastName || '—'
        return name.split(' ').map((n: string) => n[0]).join('')
      })

    // Üst satır: Departman - avatar'a yakın
    nodeUpdate.append('text')
      .attr('text-anchor', 'start')
      .attr('x', -75)
      .attr('y', -12)
      .style('pointer-events', 'none') // Text element'leri click event'lerini engellemesin
      .style('font-size', '10px')
      .style('font-weight', '700')
      .style('fill', '#111827')
      .text((d: any) => {
        // Gizli yönetici ise departman gösterme
        if (d.data.isHiddenManager) {
          return ''
        }
        return d.data.department || d.data.departmentName || 'N/A'
      })

    // Orta satır: İsim - avatar'a yakın
    nodeUpdate.append('text')
      .attr('text-anchor', 'start')
      .attr('x', -75)
      .attr('y', 2)
      .style('pointer-events', 'none') // Text element'leri click event'lerini engellemesin
      .style('font-size', '11px')
      .style('font-weight', '700')
      .style('fill', '#111827')
      .text((d: any) => {
        // Gizli yönetici ise isim gösterme
        if (d.data.isHiddenManager) {
          return ''
        }
        const name = d.data.name || d.data.firstLastName || '—'
        return name
      })

    // Alt satır: Pozisyon - avatar'a yakın
    nodeUpdate.append('text')
      .attr('text-anchor', 'start')
      .attr('x', -75)
      .attr('y', 16)
      .style('pointer-events', 'none') // Text element'leri click event'lerini engellemesin
      .style('font-size', '9px')
      .style('fill', '#111827')
      .text((d: any) => {
        // Gizli yönetici ise pozisyon gösterme
        if (d.data.isHiddenManager) {
          return ''
        }
        return d.data.title || d.data.positionName || 'N/A'
      })

    // En alt satır: Lokasyon - bold
    nodeUpdate.append('text')
      .attr('text-anchor', 'start')
      .attr('x', -75)
      .attr('y', 28)
      .style('pointer-events', 'none') // Text element'leri click event'lerini engellemesin
      .style('font-size', '9px')
      .style('font-weight', '700') // Bold
      .style('fill', '#111827')
      .text((d: any) => {
        // Gizli yönetici ise lokasyon gösterme
        if (d.data.isHiddenManager) {
          return ''
        }
        return d.data.locationName || 'N/A'
      })

    // Full info on hover
    nodeUpdate.append('title')
      .text((d: any) => {
        const name = d.data.name || d.data.firstLastName || 'N/A'
        const title = d.data.title || d.data.positionName || 'N/A'
        const dept = d.data.department || d.data.departmentName || 'N/A'
        return `${name}\n${title}\n${dept}`
      })

    // Başlangıçta tüm şemayı gösterecek şekilde zoom yap (sadece ilk yüklemede)
    if (lastTransformRef.current === d3.zoomIdentity) {
      setTimeout(() => {
        if (svgSelRef.current && zoomRef.current) {
          const scale = 0.3
          const translateX = width / 2 - (width * scale) / 2
          const translateY = height / 2 - (height * scale) / 2
          const transform = d3.zoomIdentity.translate(translateX, translateY).scale(scale)
          svgSelRef.current.call(zoomRef.current.transform as any, transform)
          lastTransformRef.current = transform
        }
      }, 100)
    }
  }, [data, levelColors, levelOrders, highlightId, selectedSeats, onSeatSelectionChange])

  // Seçim stillerini redraw yapmadan güncelle
  useEffect(() => {
    if (!svgSelRef.current) return
    const svg = svgSelRef.current

    svg.selectAll<SVGRectElement, any>('g.node rect').each(function (d: any) {
      const nodeId = d.data?.id || d.data?.currAccCode || ''
      const isSeat = nodeId.startsWith('SEAT_')
      const isSelected = selectedIds.has(nodeId)
      const isSeatSelected = isSeat && selectedSeats.has(nodeId)
      const isHidden = d.data?.isHiddenManager
      const levelKey = (d.data?.levelName || '').toLowerCase().trim()
      const lvlColor = levelColors[levelKey]

      const fill = isSeat
        ? (isSeatSelected ? '#80c7ff' : '#b3d9ff')
        : isHidden
        ? '#e5e7eb'
        : isSelected
        ? '#fef3c7'
        : lvlColor
        ? lvlColor
        : d.data?.isManager
        ? '#dbeafe'
        : '#f8fafc'

      const stroke = isSeat
        ? (isSeatSelected ? '#4b5563' : '#6b7280')
        : isHidden
        ? '#9ca3af'
        : isSelected
        ? '#dc2626'
        : lvlColor
        ? lvlColor
        : d.data?.isManager
        ? '#3b82f6'
        : '#64748b'

      const strokeWidth = isSeatSelected ? 4 : isSelected ? 4 : 3

      d3.select(this)
        .style('fill', fill)
        .style('stroke', stroke)
        .style('stroke-width', strokeWidth)
    })
  }, [selectedIds, selectedSeats, levelColors])

  // Toplam kişi sayısını hesapla
  const countTotalPeople = (data: any): number => {
    if (!data) return 0
    let count = 1 // Kendisi
    if (data.children && Array.isArray(data.children)) {
      data.children.forEach((child: any) => {
        count += countTotalPeople(child)
      })
    }
    return count
  }

  // Toplam sayı: employees array'inden al (hideFromChart olanlar dahil)
  // Çünkü hideFromChart olanlar hiyerarşiden çıkarıldı ama toplam sayıya dahil edilmeli
  const totalPeople = employees.length

  // History yönetimi fonksiyonları
  const addToHistory = (newData: any) => {
    const newHistory = history.slice(0, historyIndex + 1)
    newHistory.push(JSON.parse(JSON.stringify(newData)))
    setHistory(newHistory)
    setHistoryIndex(newHistory.length - 1)
  }

  const handleUndo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1
      setHistoryIndex(newIndex)
      setData(JSON.parse(JSON.stringify(history[newIndex])))
    }
  }

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1
      setHistoryIndex(newIndex)
      setData(JSON.parse(JSON.stringify(history[newIndex])))
    }
  }

  const handleSave = async () => {
    console.log('🔴 handleSave fonksiyonu çağrıldı!')
    setIsLoading(true)
    try {
      console.log('💾 Kaydetme işlemi başlatılıyor...')
      
      // Organizasyon ağacından değişiklikleri çıkar
      const changes: Array<{ currAccCode: string; managerId: string | null }> = []
      
    // Tüm düğümleri tarayarak manager ilişkilerini topla
    const collectChanges = (node: any, parentNode: any = null) => {
      // Root node'da data property yok, direkt node'da var
      const nodeData = node.data || node
      
      if (nodeData && nodeData.currAccCode) {
        // Manager ID'sini bul
        let managerId: string | null = null
        if (parentNode) {
          const parentData = parentNode.data || parentNode
          if (parentData && parentData.currAccCode) {
            managerId = parentData.currAccCode
          }
        }
        
        changes.push({
          currAccCode: nodeData.currAccCode,
          managerId: managerId
        })
        
        console.log(`📝 ${nodeData.currAccCode} -> managerId: ${managerId}`)
      }
      
      // Alt düğümleri de kontrol et
      if (node.children && Array.isArray(node.children)) {
        node.children.forEach((child: any) => collectChanges(child, node))
      }
    }
    
    // Debug: data objesinin yapısını kontrol et
    console.log('🔍 Data objesi:', data)
    console.log('🔍 Data.data:', data?.data)
    console.log('🔍 Data.children:', data?.children)
      
      if (data) {
        console.log('🔍 Data yapısı:', data)
        collectChanges(data)
        console.log('📝 Toplanan değişiklikler:', changes.length, 'adet')
        console.log('📝 Değişiklikler:', changes)
        
        // API'ye gönder
        const response = await fetch('/api/organization/save', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ changes }),
        })
        
        if (!response.ok) {
          throw new Error(`API hatası: ${response.status}`)
        }
        
        const result = await response.json()
        console.log('✅ Kaydetme başarılı:', result)
      
      // Kaydetme sonrası history'yi temizle ve geri almayı devre dışı bırak
      setHistory([data]) // Sadece mevcut durumu history'de tut
      setHistoryIndex(0) // Index'i 0'a sıfırla
      
      // Başarı pop-up'ını göster
      setShowSuccessModal(true)
      
      // 3 saniye sonra otomatik kapat
      setTimeout(() => {
        setShowSuccessModal(false)
      }, 3000)
      }
    } catch (error) {
      console.error('❌ Kaydetme hatası:', error)
      // Hata durumunda kullanıcıya bilgi ver
      alert('Kaydetme sırasında hata oluştu: ' + (error instanceof Error ? error.message : String(error)))
    } finally {
      setIsLoading(false)
    }
  }

  const handleZoomIn = () => {
    if (!svgSelRef.current || !zoomRef.current) return
    svgSelRef.current.transition().duration(150).call(zoomRef.current.scaleBy as any, 1.2)
  }
  const handleZoomOut = () => {
    if (!svgSelRef.current || !zoomRef.current) return
    svgSelRef.current.transition().duration(150).call(zoomRef.current.scaleBy as any, 1/1.2)
  }
  const handleZoomReset = () => {
    if (!svgSelRef.current || !zoomRef.current) return
    // Tüm şemayı gösterecek şekilde zoom yap
    const scale = 0.3
    const width = 2400
    const height = 1600
    const translateX = width / 2 - (width * scale) / 2
    const translateY = height / 2 - (height * scale) / 2
    const transform = d3.zoomIdentity.translate(translateX, translateY).scale(scale)
    svgSelRef.current.transition().duration(150).call(zoomRef.current.transform as any, transform)
  }

  const handleZoomToFilteredPerson = () => {
    console.log('🎯 Focus butonu tıklandı, searchQuery:', searchQuery)
    
    if (!svgSelRef.current || !zoomRef.current || !data) {
      console.warn('Focus: SVG veya zoom referansları eksik')
      return
    }
    
    // Eğer arama sorgusu varsa, o kişiye odaklan
    if (searchQuery.trim()) {
      const foundEmployee = employees.find(emp =>
        emp.firstLastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.currAccCode.toLowerCase().includes(searchQuery.toLowerCase())
      )
      
      console.log('Focus: Bulunan çalışan:', foundEmployee?.firstLastName || 'YOK')
      
      if (foundEmployee) {
        // D3.js tree layout'u kullanarak koordinatları hesapla
        const tree = d3.tree().size([3200, 2400])  // Boyutlar güncellendi
        const root = d3.hierarchy(data)
        tree(root)
        
        // D3 hierarchy'de bu kişiyi bul
        const findNodeInHierarchy = (node: any, targetId: string): any => {
          if (!node) return null
          const nodeId = node.data?.id || node.data?.currAccCode || node.id || node.currAccCode
          if (nodeId === targetId) return node
          if (node.children) {
            for (const child of node.children) {
              const found = findNodeInHierarchy(child, targetId)
              if (found) return found
            }
          }
          return null
        }
        
        const targetNode = findNodeInHierarchy(root, foundEmployee.currAccCode)
        console.log('Focus: Target node bulundu:', targetNode ? 'EVET' : 'HAYIR')
        console.log('Focus: Target node koordinatları:', targetNode?.x, targetNode?.y)
        
        if (targetNode && typeof targetNode.x === 'number' && typeof targetNode.y === 'number') {
          // Bu kişiye odaklan - ekranın tam ortasına yerleştir
          const scale = 1.2
          const svgWidth = 3200  // Boyutlar güncellendi
          const svgHeight = 2400
          
          // Koordinat hesaplaması: Ekranın merkezini düğüme odakla
          const translateX = (svgWidth / 2) - targetNode.x * scale
          const translateY = (svgHeight / 2) - targetNode.y * scale
          
          console.log('Focus: Hesaplanan translate:', translateX, translateY)
          
          const transform = d3.zoomIdentity.translate(translateX, translateY).scale(scale)
          
          // Transform'u önce güncelle
          lastTransformRef.current = transform
          
          // Zoom işlemini uygula
          svgSelRef.current.transition().duration(300).call(zoomRef.current.transform as any, transform)
          
          // Pan'in çalışması için kesin çözüm
          setTimeout(() => {
            if (svgSelRef.current && zoomRef.current) {
              svgSelRef.current.call(zoomRef.current as any)
              svgSelRef.current.call(zoomRef.current.transform as any, transform)
            }
          }, 400)
          return
        }
      }
    }
    
    // Eğer arama sorgusu yoksa, hiyerarşinin en üstüne odaklan
    const tree = d3.tree().size([3200, 2400])  // Boyutlar güncellendi
    const root = d3.hierarchy(data)
    tree(root)
    
    if (root && typeof root.x === 'number' && typeof root.y === 'number') {
      const scale = 0.8
      const svgWidth = 3200  // Boyutlar güncellendi
      const svgHeight = 2400
      
      const translateX = (svgWidth / 2) - root.x * scale
      const translateY = (svgHeight / 2) - root.y * scale
      
      const transform = d3.zoomIdentity.translate(translateX, translateY).scale(scale)
      
      lastTransformRef.current = transform
      
      svgSelRef.current.transition().duration(300).call(zoomRef.current.transform as any, transform)
      
      setTimeout(() => {
        if (svgSelRef.current && zoomRef.current) {
          svgSelRef.current.call(zoomRef.current as any)
          svgSelRef.current.call(zoomRef.current.transform as any, transform)
        }
      }, 400)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UserIcon className="h-5 w-5" />
            <span>Organizasyon Ağacı</span>
            <Badge variant="secondary">{totalPeople} çalışan</Badge>
            {selectedIds.size > 0 && (
              <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">
                {selectedIds.size} seçili
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            {/* Geri/İleri/Kaydet Butonları */}
            <Button 
              size="sm" 
              variant="outline" 
              onClick={handleUndo}
              disabled={historyIndex <= 0}
              title="Geri Al (Ctrl+Z)"
            >
              <UndoIcon className="h-4 w-4" />
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={handleRedo}
              disabled={historyIndex >= history.length - 1}
              title="İleri Al (Ctrl+Y veya Ctrl+Shift+Z)"
            >
              <RedoIcon className="h-4 w-4" />
            </Button>
            <Button 
              size="sm" 
              variant="default" 
              onClick={() => {
                console.log('🔴 Kaydet butonu tıklandı!')
                handleSave()
              }}
              disabled={isLoading}
              title="Kaydet (Ctrl+S)"
            >
              <SaveIcon className="h-4 w-4" />
              {isLoading ? 'Kaydediliyor...' : 'Kaydet'}
            </Button>
            
            {/* Zoom Butonları */}
            <div className="w-px h-6 bg-gray-300 mx-2"></div>
            <div className="flex gap-1">
              <Button size="sm" variant="outline" onClick={handleZoomOut} title="Uzaklaştır">
                <ZoomOutIcon className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="outline" onClick={handleZoomIn} title="Yakınlaştır">
                <ZoomInIcon className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="outline" onClick={handleZoomReset} title="Sıfırla">
                <RotateCcwIcon className="h-4 w-4" />
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={handleZoomToFilteredPerson} 
                title={searchQuery.trim() ? `"${searchQuery}" kişisine odaklan` : "Hiyerarşinin en üstüne odaklan"}
                className="bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-700"
              >
                <FocusIcon className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="w-full overflow-auto border-t">
          <svg ref={svgRef} className="w-full" style={{ minHeight: '800px' }}></svg>
        </div>
        <div className="p-4 bg-gray-50 border-t text-sm text-gray-600">
          <p><strong>İpuçları:</strong> Düğümlere hover yaparak detaylı bilgileri görebilirsiniz. Mavi düğümler yönetici pozisyonlarıdır.</p>
          <p className="mt-2"><strong>Klavye Kısayolları:</strong> <kbd className="px-1 py-0.5 bg-white border rounded text-xs">Ctrl+Z</kbd> Geri Al | <kbd className="px-1 py-0.5 bg-white border rounded text-xs">Ctrl+Y</kbd> İleri Al | <kbd className="px-1 py-0.5 bg-white border rounded text-xs">Ctrl+S</kbd> Kaydet</p>
        </div>
      </CardContent>

      {/* Move Modal */}
      {showMoveModal && moveData && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl border border-gray-100 p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="mb-5">
              <h3 className="text-xl font-semibold text-gray-900">
                {moveData.isMultiMove ? 'Toplu Taşıma' : 'Taşıma Seçenekleri'}
              </h3>
              <p className="text-gray-600 mt-2">
                {moveData.isMultiMove ? (
                  <>
                    <strong>{moveData.childrenCount} kişi</strong> yöneticisini
                    {" "}
                    <strong>{moveData.target?.data?.firstLastName || moveData.target?.data?.name}</strong> altına taşımak üzeresiniz.
                  </>
                ) : (
                  <>
                    <strong>{moveData.node.data.firstLastName || moveData.node.data.name}</strong> yöneticisini
                    {" "}
                    <strong>{moveData.target?.data?.firstLastName || moveData.target?.data?.name}</strong> altına taşımak üzeresiniz.
                  </>
                )}
              </p>
              {moveData.isMultiMove ? (
                <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800 font-medium mb-2">
                    <strong>Seçili Kişiler ({moveData.childrenCount}):</strong>
                  </p>
                  <ul className="text-sm text-blue-700 space-y-1 max-h-40 overflow-y-auto">
                    {moveData.selectedNodes?.map((node: any, idx: number) => (
                      <li key={idx}>• {node.data.firstLastName || node.data.name || 'İsimsiz'}</li>
                    ))}
                  </ul>
                </div>
              ) : (
                <p className="text-sm text-gray-500 mt-1">
                  Altında <strong>{moveData.childrenCount}</strong> kişi bulunuyor.
                </p>
              )}
            </div>
            
            <div className="space-y-3">
              {moveData.isMultiMove ? (
                <>
                  <button
                    onClick={handleMoveWithoutChildren}
                    className="w-full bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 transition-colors font-medium"
                  >
                    Tümünü Taşı ({moveData.childrenCount} kişi)
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={handleMoveWithChildren}
                    className="w-full bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 transition-colors font-medium"
                  >
                    Ekibi Taşı ({moveData.childrenCount} kişi)
                  </button>
                  
                  <div>
                    <button
                      onClick={handleMoveWithoutChildren}
                      className="w-full bg-purple-600 text-white px-4 py-3 rounded-lg hover:bg-purple-700 transition-colors font-medium"
                    >
                      {(moveData.node.data.firstLastName || moveData.node.data.name) + "'ı Taşı"}
                    </button>
                    <p className="text-xs text-gray-500 mt-1 text-center">Ekip mevcut üst yöneticiye bağlanır</p>
                  </div>
                </>
              )}
              
              <button
                onClick={handleCancelMove}
                className="w-full px-4 py-3 rounded-lg bg-gray-500 text-white hover:bg-gray-600 transition-colors"
              >
                İptal Et
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4 shadow-2xl">
            <div className="flex items-center justify-center mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
            
            <h3 className="text-lg font-semibold text-center text-gray-900 mb-2">
              Başarılı!
            </h3>
            
            <p className="text-gray-600 text-center mb-6">
              Organizasyon yapısı başarıyla kaydedildi!
            </p>
            
            <div className="flex justify-center">
              <button
                onClick={() => setShowSuccessModal(false)}
                className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors font-medium"
              >
                Tamam
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Invalid Operation Modal */}
      {showInvalidModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4 shadow-2xl">
            <div className="flex items-center justify-center mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
            </div>
            
            <h3 className="text-lg font-semibold text-center text-gray-900 mb-2">
              Uyarı!
            </h3>
            
            <p className="text-gray-600 text-center mb-6">
              Bu işlem döngü oluşturacağı için geçersizdir. Yönetici ekibinden birine bağlanamaz.
            </p>
            
            <div className="flex justify-center">
              <button
                onClick={() => setShowInvalidModal(false)}
                className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors font-medium"
              >
                Tamam
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Swap Managers Modal */}
      {showSwapModal && swapData && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl border border-gray-100 p-6 max-w-md w-full mx-4">
            <div className="mb-5">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                🔄 İki Müdür Yer Değiştirecek
              </h3>
              <p className="text-gray-600 mb-4">
                <strong>{swapData.manager1.data.firstLastName || swapData.manager1.data.name}</strong> ve 
                {" "}
                <strong>{swapData.manager2.data.firstLastName || swapData.manager2.data.name}</strong> yer değiştirecek.
              </p>
              <div className="bg-blue-50 rounded-lg p-4 space-y-2">
                <p className="text-sm text-blue-800">
                  <strong>{swapData.manager1.data.firstLastName || swapData.manager1.data.name}</strong> ekibi 
                  ({swapData.manager1TeamCount} kişi) → 
                  <strong> {swapData.manager2.data.firstLastName || swapData.manager2.data.name}</strong> yöneticisine bağlanacak
                </p>
                <p className="text-sm text-blue-800">
                  <strong>{swapData.manager2.data.firstLastName || swapData.manager2.data.name}</strong> ekibi 
                  ({swapData.manager2TeamCount} kişi) → 
                  <strong> {swapData.manager1.data.firstLastName || swapData.manager1.data.name}</strong> yöneticisine bağlanacak
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleSwapManagers}
                className="flex-1 bg-purple-600 text-white px-4 py-3 rounded-lg hover:bg-purple-700 transition-colors font-medium"
              >
                Yer Değiştir
              </button>
              <button
                onClick={() => {
                  setShowSwapModal(false)
                  setSwapData(null)
                }}
                className="flex-1 px-4 py-3 rounded-lg bg-gray-500 text-white hover:bg-gray-600 transition-colors"
              >
                İptal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assign Modal */}
      {showAssignModal && assignData && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl border border-gray-100 p-6 max-w-md w-full mx-4">
            <div className="mb-5">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Atama Seçenekleri
              </h3>
              <p className="text-gray-600 mb-4">
                <strong>{assignData.person.data.firstLastName || assignData.person.data.name}</strong> yöneticisini
                {" "}
                <strong>{assignData.target.data.firstLastName || assignData.target.data.name}</strong> altına taşımak üzeresiniz.
              </p>
              {assignData.teamCount > 0 && (
                <p className="text-sm text-gray-500 mb-4">
                  Altında <strong>{assignData.teamCount} kişi</strong> bulunuyor.
                </p>
              )}
            </div>
            <div className="space-y-3">
              {assignData.teamCount > 0 && (
                <button
                  onClick={handleAssignTeam}
                  className="w-full bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 transition-colors font-medium"
                >
                  Atama Yap ({assignData.teamCount} kişi yeni müdüre bağlanacak)
                </button>
              )}
              <button
                onClick={handleAssignPerson}
                className="w-full bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Kişiyi Bağlı (Sadece bu kişi yeni müdüre bağlanacak)
              </button>
              <button
                onClick={() => {
                  setShowAssignModal(false)
                  setAssignData(null)
                  setData((prev: any) => ({ ...prev }))
                }}
                className="w-full px-4 py-3 rounded-lg bg-gray-500 text-white hover:bg-gray-600 transition-colors"
              >
                İptal
              </button>
            </div>
          </div>
        </div>
      )}

    </Card>
  )
}
