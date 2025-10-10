
import React, { useEffect, useRef, useState } from 'react'
import * as d3 from 'd3'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { ZoomInIcon, ZoomOutIcon, RotateCcwIcon, UndoIcon, RedoIcon, SaveIcon } from 'lucide-react'
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
}

interface OrganizationTreeProps {
  employees: Employee[]
  highlightId?: string
  levelColors?: Record<string, string>
  levelOrders?: Record<string, number>
}

export default function OrganizationTree({ employees, highlightId, levelColors = {}, levelOrders = {} }: OrganizationTreeProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const svgSelRef = useRef<d3.Selection<SVGSVGElement, unknown, null, undefined> | null>(null)
  const zoomRef = useRef<d3.ZoomBehavior<Element, unknown> | null>(null)
  const lastTransformRef = useRef(d3.zoomIdentity)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [isDragging, setIsDragging] = useState(false)
  const [dragStartPosition, setDragStartPosition] = useState<{x: number, y: number} | null>(null)
  const [showMoveModal, setShowMoveModal] = useState(false)
  const [moveData, setMoveData] = useState<{
    node: any,
    target: any,
    hasChildren: boolean,
    childrenCount: number
  } | null>(null)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [showInvalidModal, setShowInvalidModal] = useState(false)
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

  // Modal işleme fonksiyonları
  const handleMoveWithChildren = () => {
    if (!moveData) return
    performMove(moveData.node, moveData.target, true)
    setShowMoveModal(false)
    setMoveData(null)
  }

  const handleMoveWithoutChildren = () => {
    if (!moveData) return
    performMove(moveData.node, moveData.target, false)
    setShowMoveModal(false)
    setMoveData(null)
  }

  const handleCancelMove = () => {
    setShowMoveModal(false)
    setMoveData(null)
    // Düğümü orijinal pozisyonuna geri döndür
    setData((prev: any) => ({ ...prev }))
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
      employeeMap.set(emp.currAccCode, { ...emp, children: [] })
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
    if (!svgRef.current || !data) return

    console.log('🎨 OrganizationTree: data değişti, D3 chart çiziliyor...', data)
    
    const svg = d3.select(svgRef.current)
    svg.selectAll("*").remove()
    svgSelRef.current = svg as any

    const width = 2400
    const height = 1600

    svg.attr('width', width).attr('height', height)

    const root = d3.hierarchy(data)

    // Çocukları level order'a göre sırala (yukarıdan aşağıya)
    root.each((d: any) => {
      if (!d.children || d.children.length === 0) return
      d.children.sort((a: any, b: any) => getLevelOrder(a.data.levelName) - getLevelOrder(b.data.levelName))
    })

    console.log('🌳 D3 hierarchy oluşturuldu:', root)
    console.log('🌳 Root children sayısı:', root.children?.length || 0)
    
    // Düğümler arası yatay/dikey boşluklar
    const nodeWidth = 240
    const nodeHeight = 90
    const horizontalGap = 80
    const verticalGap = 120
    const treeLayout = d3
      .tree<any>()
      .nodeSize([nodeWidth + horizontalGap, nodeHeight + verticalGap])
      .separation((a: any, b: any) => (a.parent === b.parent ? 1.0 : 1.4))
    
    treeLayout(root)
    console.log('🌳 Tree layout uygulandı, root:', root)

    // Dikey istif: tüm çocuklar yaprak ise, level order'a göre sıralı dikey hizala
    const verticalLeafSpacing = nodeHeight + 16
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
      // Çift tıklamada zoom'u kapat
      .filter((event) => event.type !== 'dblclick')
      .on('zoom', (event) => {
        lastTransformRef.current = event.transform
        g.attr('transform', `${event.transform.toString()}`)
      })
    svg.call(zoom as any)
    // Güvenlik: d3'nin default dblclick.zoom handler'ını kaldır
    svg.on('dblclick.zoom', null as any)
    // Önceki transformu yeniden uygula ki ekran kaymasın
    ;(zoom as any).transform(svg as any, lastTransformRef.current)
    zoomRef.current = zoom

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
        const off = 140
        return `M ${x1},${y1} H ${x1 - off} V ${y2} H ${x2}`
      }
      const yMid = (y1 + y2) / 2
      return `M ${x1},${y1} V ${yMid} H ${x2} V ${y2}`
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
      .data(descendants)
      .enter()
      .append('g')
      .attr('class', 'node')
      .attr('transform', (d: any) => {
        const isLeaf = !d.children || d.children.length === 0
        const sameColumnWithParent = d.parent ? Math.abs(d.x - d.parent.x) < 1 : false
        const offset = isLeaf && sameColumnWithParent ? 25 : 0
        return `translate(${d.x + offset},${d.y})`
      })
      .on('click', (event: any, d: any) => {
        event.stopPropagation()
        const id = d.data.id || d.data.currAccCode
        const isMulti = event.ctrlKey || event.metaKey
        const next = new Set(selectedIds)
        if (isMulti) {
          if (next.has(id)) next.delete(id); else next.add(id)
        } else {
          next.clear(); next.add(id)
        }
        setSelectedIds(next)
        // Görsel vurgu: seçili düğümleri sarı yap
        g.selectAll<SVGGElement, any>('g.node').select('rect')
          .style('fill', (nd: any) => {
            const nodeId = nd.data.id || nd.data.currAccCode
            if (next.has(nodeId)) {
              return '#fef3c7' // Sarı arka plan
            }
            const levelKey = (nd.data.levelName || '').toLowerCase().trim()
            const lvlColor = levelColors[levelKey]
            if (lvlColor) return lvlColor
            return nd.data.isManager ? '#dbeafe' : '#f8fafc'
          })
          .style('stroke', (nd: any) => {
            const nodeId = nd.data.id || nd.data.currAccCode
            if (highlightId && nodeId === highlightId) return '#800000' // Bordo çerçeve
            if (next.has(nodeId)) {
              return '#f59e0b' // Sarı kenarlık
            }
            const levelKey = (nd.data.levelName || '').toLowerCase().trim()
            const lvlColor = levelColors[levelKey]
            if (lvlColor) return lvlColor
            return nd.data.isManager ? '#3b82f6' : '#64748b'
          })
          .style('stroke-width', (nd: any) => {
            const nodeId = nd.data.id || nd.data.currAccCode
            if (highlightId && nodeId === highlightId) return 5
            if (next.has(nodeId)) {
              return 4 // Kalın kenarlık
            }
            return 3
          })
          .style('filter', (nd: any) => {
            const nodeId = nd.data.id || nd.data.currAccCode
            if (next.has(nodeId)) {
              return 'drop-shadow(0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04))'
            }
            return 'drop-shadow(0 1px 1px rgba(0,0,0,0.04))'
          })
          .style('transform', (nd: any) => {
            const nodeId = nd.data.id || nd.data.currAccCode
            if (next.has(nodeId)) {
              return 'scale(1.05)'
            }
            return 'scale(1)'
          })
      })

    // Node rectangles styled like the provided image
    const rectWidth = 240
    const rectHeight = 64

    const rect = node.append('rect')
      .attr('x', -rectWidth / 2)
      .attr('y', -rectHeight / 2)
      .attr('width', rectWidth)
      .attr('height', rectHeight)
      .attr('rx', 12)
      .attr('ry', 12)
      .style('fill', (d: any) => {
        const nodeId = d.data.id || d.data.currAccCode
        if (selectedIds.has(nodeId)) {
          return '#fef3c7' // Sarı arka plan
        }
        const levelKey = (d.data.levelName || '').toLowerCase().trim()
        const lvlColor = levelColors[levelKey]
        if (lvlColor) return lvlColor
        return d.data.isManager ? '#dbeafe' : '#f8fafc'
      })
      .style('stroke', (d: any) => {
        const nodeId = d.data.id || d.data.currAccCode
        if (highlightId && nodeId === highlightId) {
          return '#800000' // Bordo çerçeve
        }
        if (selectedIds.has(nodeId)) {
          return '#f59e0b' // Sarı kenarlık
        }
        const levelKey = (d.data.levelName || '').toLowerCase().trim()
        const lvlColor = levelColors[levelKey]
        if (lvlColor) return lvlColor
        return d.data.isManager ? '#3b82f6' : '#64748b'
      })
      .style('stroke-width', (d: any) => {
        const nodeId = d.data.id || d.data.currAccCode
        if (highlightId && nodeId === highlightId) return 5
        return selectedIds.has(nodeId) ? 4 : 3
      })
      .style('filter', 'drop-shadow(0 1px 1px rgba(0,0,0,0.04))')
      .style('transition', 'all 150ms ease-in-out')
      .style('cursor', 'pointer')

    // Hover effects
    rect
      .on('mouseenter', function(event: any, d: any) {
        const nodeId = d.data.id || d.data.currAccCode
        const isSelected = selectedIds.has(nodeId)
        const isHighlighted = !!highlightId && nodeId === highlightId
        
        if (isSelected) {
          d3.select(this)
            .style('fill', '#fde68a')
            .style('stroke', isHighlighted ? '#800000' : '#d97706')
            .style('stroke-width', isHighlighted ? 5 : 5)
            .style('filter', 'drop-shadow(0 25px 50px -12px rgba(0, 0, 0, 0.25))')
            .style('transform', 'scale(1.1)')
        } else {
          d3.select(this)
            .style('fill', (dAny: any) => {
              const levelKey = (dAny.data.levelName || '').toLowerCase().trim()
              const lvlColor = levelColors[levelKey]
              return lvlColor || '#fef3c7'
            })
            .style('stroke', isHighlighted ? '#800000' : '#f59e0b')
            .style('stroke-width', isHighlighted ? 5 : 4)
            .style('filter', 'drop-shadow(0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04))')
            .style('transform', 'scale(1.05)')
        }
      })
      .on('mouseleave', function(event: any, d: any) {
        const nodeId = d.data.id || d.data.currAccCode
        const isSelected = selectedIds.has(nodeId)
        const isHighlighted = !!highlightId && nodeId === highlightId
        
        if (isSelected) {
          d3.select(this)
            .style('fill', '#fef3c7')
            .style('stroke', isHighlighted ? '#800000' : '#f59e0b')
            .style('stroke-width', isHighlighted ? 5 : 4)
            .style('filter', 'drop-shadow(0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04))')
            .style('transform', 'scale(1.05)')
        } else {
          d3.select(this)
            .style('fill', (dAny: any) => dAny.data.isManager ? '#dbeafe' : (levelColors[(dAny.data.levelName || '').toLowerCase().trim()] || '#f8fafc'))
            .style('stroke', (dAny: any) => (isHighlighted ? '#800000' : (dAny.data.isManager ? '#3b82f6' : '#64748b')))
            .style('stroke-width', isHighlighted ? 5 : 3)
            .style('filter', 'drop-shadow(0 1px 1px rgba(0,0,0,0.04))')
            .style('transform', 'scale(1)')
        }
      })

    // Drag & drop to re-parent
    const drag = d3.drag<any, any>()
      .on('start', function (event, d) {
        d3.select(this).raise()
        // Sürükleme sırasında zoom davranışını geçici kapat
        if (svgSelRef.current) {
          svgSelRef.current.on('.zoom', null as any)
        }
        
        // Sürükleme durumunu güncelle
        setIsDragging(true)
        setDragStartPosition({ x: d.x, y: d.y })
        
        // Sürükleme sırasında sarı görsel efekt - !important ile zorla uygula
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
      })
      .on('drag', function (event, d) {
        d3.select(this).attr('transform', `translate(${event.x},${event.y})`)
        
        // İlk drag'de gölge oluştur
        if (!g.select('.shadow-copy').empty()) {
          // Gölge zaten var, güncelle
          g.select('.shadow-copy')
            .attr('transform', `translate(${dragStartPosition?.x || d.x},${dragStartPosition?.y || d.y})`)
        } else {
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
        
        // Sürüklenen düğümü sarı tut
        d3.select(this).select('rect')
          .style('fill', '#fef3c7 !important')
          .style('stroke', '#f59e0b !important')
          .style('stroke-width', '4px !important')
          .style('opacity', '0.8 !important')
          .style('transform', 'scale(0.95) !important')
          .style('filter', 'drop-shadow(0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)) !important')
          .attr('fill', '#fef3c7')
          .attr('stroke', '#f59e0b')
          .attr('stroke-width', '4')
        
        // En yakın hedef düğümü bul ve vurgula
        const pt = d3.pointer(event, base.node() as any)
        const inv = lastTransformRef.current.invert([pt[0], pt[1]])
        const mx = inv[0]
        const my = inv[1]
        
        let target: any = null
        let minDist = Infinity
        g.selectAll<SVGGElement, any>('.node').each(function (nd: any) {
          if (nd === d) return
          const [tx, ty] = [nd.x, nd.y]
          const dist = Math.hypot(mx - tx, my - ty)
          if (dist < minDist) { minDist = dist; target = nd }
        })
        
        // Diğer düğümleri normal duruma getir (sürüklenen hariç)
        g.selectAll<SVGGElement, any>('.node').each(function(nd: any) {
          if (nd !== d) {
            const levelKey = (nd.data.levelName || '').toLowerCase().trim()
            const lvlColor = levelColors[levelKey]
            d3.select(this).select('rect')
              .style('fill', lvlColor || (nd.data.isManager ? '#dbeafe' : '#f8fafc'))
              .style('stroke', nd.data.isManager ? '#3b82f6' : '#64748b')
              .style('stroke-width', selectedIds.has(nd.data.id || nd.data.currAccCode) ? 4 : 3)
              .style('filter', 'drop-shadow(0 1px 1px rgba(0,0,0,0.04))')
              .style('transform', 'scale(1)')
              .attr('fill', lvlColor || (nd.data.isManager ? '#dbeafe' : '#f8fafc'))
              .attr('stroke', nd.data.isManager ? '#3b82f6' : '#64748b')
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
        // En yakın hedef düğümü bul
        // Mevcut zoom/pan'i hesaba kat: pointer'ı g koordinatlarına çevir
        const pt = d3.pointer(event, base.node() as any)
        const inv = lastTransformRef.current.invert([pt[0], pt[1]])
        const mx = inv[0]
        const my = inv[1]
        let target: any = null
        let minDist = Infinity
        g.selectAll<SVGGElement, any>('.node').each(function (nd: any) {
          if (nd === d) return
          const [tx, ty] = [nd.x, nd.y]
          const dist = Math.hypot(mx - tx, my - ty)
          if (dist < minDist) { minDist = dist; target = nd }
        })
        const dropThreshold = 200
        if (!target || minDist > dropThreshold) {
          // Yeterince yakın değil, yeniden çizimi tetikle
          setData((prev: any) => ({ ...prev }))
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

        const movingId = d.data.id || d.data.currAccCode
        const targetId = target.data.id || target.data.currAccCode

        if (isDescendant(d.data, targetId) || movingId === targetId) {
          // Döngü oluşturacak işlem - geçersiz pop-up göster
          setShowInvalidModal(true)
          setTimeout(() => setShowInvalidModal(false), 3000)
          
          // Düğümü orijinal pozisyonuna geri döndür
          setData((prev: any) => ({ ...prev }))
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
        // performMove fonksiyonunu kullan
        performMove(d, target, false)
        
        console.log('✅ Drag-drop başarılı:', d.data.firstLastName, '->', target.data.firstLastName)
        
        // Sürükleme durumunu güncelle
        setIsDragging(false)
        setDragStartPosition(null)
        
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
          .style('stroke', (nd: any) => nd.data.isManager ? '#3b82f6' : '#64748b')
          .style('stroke-width', 3)
          .style('filter', 'drop-shadow(0 1px 1px rgba(0,0,0,0.04))')
          .style('transform', 'scale(1)')
          .style('opacity', 1)
      })

    node.call(drag as any)

    // Avatar circle - kutunun sol kenar orta noktasından 5px sağda
    node.append('circle')
      .attr('cx', -100)
      .attr('cy', 0)
      .attr('r', 12)
      .style('fill', '#3b82f6')
      .style('stroke', '#ffffff')
      .style('stroke-width', '2px')
      .style('filter', 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))')

    // Avatar initials - kutunun sol kenar orta noktasından 5px sağda
    node.append('text')
      .attr('text-anchor', 'middle')
      .attr('x', -100)
      .attr('y', 5)
      .style('font-size', '10px')
      .style('font-weight', '700')
      .style('fill', '#ffffff')
      .text((d: any) => {
        const name = d.data.name || d.data.firstLastName || '—'
        return name.split(' ').map((n: string) => n[0]).join('')
      })

    // Üst satır: Departman - avatar'a yakın
    node.append('text')
      .attr('text-anchor', 'start')
      .attr('x', -75)
      .attr('y', -12)
      .style('font-size', '10px')
      .style('font-weight', '700')
      .style('fill', '#111827')
      .text((d: any) => d.data.department || d.data.departmentName || 'N/A')

    // Orta satır: İsim - avatar'a yakın
    node.append('text')
      .attr('text-anchor', 'start')
      .attr('x', -75)
      .attr('y', 2)
      .style('font-size', '11px')
      .style('font-weight', '700')
      .style('fill', '#111827')
      .text((d: any) => {
        const name = d.data.name || d.data.firstLastName || '—'
        return name
      })

    // Alt satır: Pozisyon - avatar'a yakın
    node.append('text')
      .attr('text-anchor', 'start')
      .attr('x', -75)
      .attr('y', 16)
      .style('font-size', '9px')
      .style('fill', '#111827')
      .text((d: any) => d.data.title || d.data.positionName || 'N/A')

    // Full info on hover
    node.append('title')
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
  }, [data, levelColors, levelOrders])

  // Toplam kişi sayısını hesapla
  const countTotalPeople = (data: any): number => {
    let count = 1 // Kendisi
    if (data.children) {
      data.children.forEach((child: any) => {
        count += countTotalPeople(child)
      })
    }
    return count
  }

  const totalPeople = countTotalPeople(data || fallbackData)

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
      alert('Kaydetme sırasında hata oluştu: ' + error.message)
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
    const translateX = width / 2 - (width * scale) / 2
    const translateY = height / 2 - (height * scale) / 2
    const transform = d3.zoomIdentity.translate(translateX, translateY).scale(scale)
    svgSelRef.current.transition().duration(150).call(zoomRef.current.transform as any, transform)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UserIcon className="h-5 w-5" />
            <span>Organizasyon Ağacı</span>
            <Badge variant="secondary">{totalPeople} çalışan</Badge>
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
          <div className="bg-white rounded-xl shadow-2xl border border-gray-100 p-6 max-w-md w-full mx-4">
            <div className="mb-5">
              <h3 className="text-xl font-semibold text-gray-900">Taşıma Seçenekleri</h3>
              <p className="text-gray-600 mt-2">
                <strong>{moveData.node.data.firstLastName || moveData.node.data.name}</strong> yöneticisini
                {" "}
                <strong>{moveData.target?.data?.firstLastName || moveData.target?.data?.name}</strong> altına taşımak üzeresiniz.
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Altında <strong>{moveData.childrenCount}</strong> kişi bulunuyor.
              </p>
            </div>
            
            <div className="space-y-3">
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
    </Card>
  )
}
