<template>
  <div class="tree-visualization">
    <!-- SVG容器 -->
    <div class="tree-container" ref="containerRef">
      <svg ref="svgRef" class="tree-svg">
        <defs>
          <!-- 定义箭头标记 -->
          <marker
            id="arrowhead"
            markerWidth="10"
            markerHeight="7"
            refX="9"
            refY="3.5"
            orient="auto"
          >
            <polygon
              points="0 0, 10 3.5, 0 7"
              fill="var(--node-default)"
            />
          </marker>
        </defs>
        <g class="tree-group"></g>
      </svg>
      
      <!-- 左下角控制区域 -->
      <div class="bottom-left-controls">
        <!-- 控制按钮 -->
        <div class="control-buttons">
          <a-button @click="resetLayout" type="secondary" size="mini">
            <template #icon>
              <icon-refresh />
            </template>
            {{ $t('tree.resetLayout') }}
          </a-button>
          <a-button @click="fitToScreen" type="secondary" size="mini">
            <template #icon>
              <icon-fullscreen />
            </template>
            {{ $t('tree.fitScreen') }}
          </a-button>
          <a-button @click="resetZoom" type="secondary" size="mini">
            <template #icon>
              <icon-zoom />
            </template>
            {{ $t('tree.actualSize') }}
          </a-button>
          <div class="drag-hint">
            {{ $t('tree.dragHint') }}
          </div>
        </div>
      </div>
    </div>

    <!-- 悬停提示 -->
    <div 
      v-show="tooltipVisible"
      class="tree-tooltip"
      :style="tooltipStyle"
    >
      {{ tooltipContent }}
    </div>

    <!-- 空状态 -->
    <div v-if="!hasDialogTree" class="empty-state">
      <a-empty :description="$t('chat.selectSession')" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import * as d3 from 'd3'
import { useI18n } from 'vue-i18n'
import { useDialogStore, useLocaleStore, useSessionStore, useLayoutStore } from '@/stores'
import { 
  IconFullscreen, 
  IconRefresh,
  IconZoomIn as IconZoom
} from '@arco-design/web-vue/es/icon'
import type { ConversationTreeNode } from '@/types'

// 使用stores和i18n
const dialogStore = useDialogStore()
const localeStore = useLocaleStore()
const sessionStore = useSessionStore()
const layoutStore = useLayoutStore()
const { locale } = useI18n()

// 模板引用
const containerRef = ref<HTMLElement>()
const svgRef = ref<SVGElement>()

// 状态
const tooltipVisible = ref(false)
const tooltipContent = ref('')
const tooltipStyle = ref({})

// 拖拽相关状态
const isDragging = ref(false)
const dragNode = ref<d3.HierarchyNode<ConversationTreeNode> | null>(null)
const customNodePositions = ref<Record<number, { x: number; y: number }>>({})
const dragStartPosition = ref<{ x: number; y: number } | null>(null)
const hasMoved = ref(false)

// 计算属性
const conversationTree = computed(() => dialogStore.conversationTree)
const selectedConversationId = computed(() => dialogStore.selectedConversationId)
const ancestorNodeIds = computed(() => dialogStore.ancestorNodeIds)
const starredNodeIds = computed(() => dialogStore.starredNodeIds)
const hasDialogTree = computed(() => dialogStore.hasDialogTree)

// D3相关变量
let svg: d3.Selection<SVGElement, unknown, null, undefined>
let g: d3.Selection<SVGGElement, unknown, null, undefined>
let tree: d3.TreeLayout<ConversationTreeNode>
let zoom: d3.ZoomBehavior<SVGElement, unknown>
let drag: d3.DragBehavior<SVGGElement, d3.HierarchyNode<ConversationTreeNode>, unknown>

// 树形图配置
const nodeRadius = 8
const nodeSpacing = { x: 200, y: 80 }
let hoverId: number | null = null
let hoverTimeout: ReturnType<typeof setTimeout> | null = null

// ===== 初始化D3 =====
onMounted(() => {
  initializeD3()
  
  // 监听窗口大小变化
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  if (hoverTimeout) {
    clearTimeout(hoverTimeout)
  }
})

// 监听数据变化
watch(conversationTree, (newTree) => {
  nextTick(() => {
    if (!newTree) {
      // 如果数据为空，清空所有D3渲染内容
      clearTree()
    } else {
      renderTree()
    }
  })
}, { deep: true })

watch([selectedConversationId, ancestorNodeIds, starredNodeIds], () => {
  updateNodeStyles()
}, { deep: true })

// 监听会话变化，加载对应会话的自定义位置
watch(() => sessionStore.currentSessionId, () => {
  loadCustomPositions()
}, { immediate: true })

// ===== D3初始化 =====
function initializeD3() {
  if (!svgRef.value || !containerRef.value) return

  const container = containerRef.value
  const width = container.clientWidth
  const height = container.clientHeight

  // 初始化SVG
  svg = d3.select(svgRef.value)
    .attr('width', width)
    .attr('height', height)

  g = svg.select('.tree-group')

  // 初始化缩放行为
  zoom = d3.zoom<SVGElement, unknown>()
    .scaleExtent([0.1, 3])
    .on('zoom', (event) => {
      g.attr('transform', event.transform)
    })

  svg.call(zoom)

  // 初始化树形布局
  tree = d3.tree<ConversationTreeNode>()
    .nodeSize([nodeSpacing.x, nodeSpacing.y])
    .separation((a, b) => {
      // 增大同级节点间距离
      return a.parent === b.parent ? 1.2 : 2
    })
  
  // 初始化拖拽行为
  drag = d3.drag<SVGGElement, d3.HierarchyNode<ConversationTreeNode>, unknown>()
    .subject((event, d) => {
      // 返回节点的当前位置作为拖拽主体
      const customPos = customNodePositions.value[d.data.conversationId]
      return customPos ? customPos : { x: d.x, y: d.y }
    })
    .clickDistance(5) // 增加点击距离容差，避免微小移动被认为是拖拽
    .on('start', handleDragStart)
    .on('drag', handleDrag)
    .on('end', handleDragEnd)
}

// ===== 清空树形图 =====
function clearTree() {
  if (!g) return
  
  // 移除所有节点和连接线
  g.selectAll('.node').remove()
  g.selectAll('.link').remove()
}

// ===== 渲染树形图 =====
function renderTree() {
  if (!conversationTree.value || !g) return

  // 创建层次结构
  const root = d3.hierarchy(conversationTree.value, d => d.children)
  
  // 计算节点位置
  tree(root)

  // 渲染连接线
  renderLinks(root.links())
  
  // 渲染节点
  renderNodes(root.descendants())

  // 自动居中显示
  fitToScreen()
}

// 渲染连接线
function renderLinks(links: d3.HierarchyLink<ConversationTreeNode>[]) {
  const linkSelection = g.selectAll<SVGPathElement, d3.HierarchyLink<ConversationTreeNode>>('.link')
    .data(links, d => `${d.source.data.id}-${d.target.data.id}`)

  // 移除旧连接线
  linkSelection.exit()
    .transition()
    .duration(300)
    .style('opacity', 0)
    .remove()

  // 添加新连接线
  const linkEnter = linkSelection.enter()
    .append('path')
    .attr('class', 'link')
    .attr('fill', 'none')
    .attr('stroke', '#ccc')
    .attr('stroke-width', 2)
    .style('opacity', 0) // 初始透明
    // .attr('marker-end', 'url(#arrowhead)') // 移除箭头

  // 更新连接线路径 - 连接到容器边缘，添加动画
  linkEnter.merge(linkSelection)
    .transition()
    .duration(300)
    .style('opacity', 1) // 渐显动画
    .attr('d', d => {
      const source = d.source
      const target = d.target
      
      // 计算容器尺寸和位置（考虑自定义位置）
      const getContainerBounds = (node: any) => {
        const summary = node.data.summary || node.data.content || 'No summary'
        const containerWidth = Math.max(120, Math.min(200, summary.length * 8 + 20))
        const usableWidth = containerWidth * 0.6
        const maxCharsPerLine = Math.max(6, Math.min(12, Math.floor(usableWidth / 10)))
        const estimatedLines = Math.min(3, Math.ceil(summary.length / maxCharsPerLine))
        const height = Math.max(28, estimatedLines * 16 + 16)
        
        // 使用自定义位置或默认位置
        const customPos = customNodePositions.value[node.data.conversationId]
        const x = customPos ? customPos.x : (node.x || 0)
        const y = customPos ? customPos.y : (node.y || 0)
        
        return {
          width: containerWidth,
          height: height,
          x: x,
          y: y
        }
      }
      
      const sourceBounds = getContainerBounds(source)
      const targetBounds = getContainerBounds(target)
      
      // 计算连接点（从容器底部到容器顶部）
      const sourceX = sourceBounds.x
      const sourceY = sourceBounds.y + sourceBounds.height / 2  // 源容器底部
      
      const targetX = targetBounds.x
      const targetY = targetBounds.y - targetBounds.height / 2  // 目标容器顶部
      
      // 使用贝塞尔曲线连接容器
      return `M${sourceX},${sourceY}
              C${sourceX},${(sourceY + targetY) / 2}
               ${targetX},${(sourceY + targetY) / 2}
               ${targetX},${targetY}`
    })
}

// 渲染节点
function renderNodes(nodes: d3.HierarchyNode<ConversationTreeNode>[]) {
  const nodeSelection = g.selectAll<SVGGElement, d3.HierarchyNode<ConversationTreeNode>>('.node')
    .data(nodes, d => d.data.id.toString())

  // 移除旧节点
  nodeSelection.exit()
    .transition()
    .duration(300)
    .style('opacity', 0)
    .remove()

  // 添加新节点组
  const nodeEnter = nodeSelection.enter()
    .append('g')
    .attr('class', 'node')
    .attr('transform', d => {
      const customPos = customNodePositions.value[d.data.conversationId]
      return customPos ? `translate(${customPos.x},${customPos.y})` : `translate(${d.x},${d.y})`
    })
    .style('opacity', 0)

  // 删除节点圆圈 - 不再需要

  // 添加节点文本
  const textGroup = nodeEnter.append('g')
    .attr('class', 'node-text')

  // 文本背景
  textGroup.append('rect')
    .attr('class', 'text-background')
    .attr('rx', 14)
    .attr('ry', 14)

  // 文本内容
  textGroup.append('text')
    .attr('class', 'text-content')
    .attr('text-anchor', 'middle')
    .attr('dy', '0.35em')

  // 更新现有节点
  const nodeUpdate = nodeEnter.merge(nodeSelection)
    .transition()
    .duration(300)
    .style('opacity', 1)
    .attr('transform', d => {
      const customPos = customNodePositions.value[d.data.conversationId]
      return customPos ? `translate(${customPos.x},${customPos.y})` : `translate(${d.x},${d.y})`
    })

  // 更新文本内容和样式
  updateNodeTexts(nodeUpdate)
  
  // 添加交互事件
  addNodeInteractions(nodeEnter.merge(nodeSelection))

  // 更新节点样式
  updateNodeStyles()
}

// 更新节点文本
function updateNodeTexts(selection: d3.Transition<SVGGElement, d3.HierarchyNode<ConversationTreeNode>, SVGGElement, unknown>) {
  selection.select('.text-content')
    .each(function(d) {
      const textElement = d3.select(this)
      const summary = d.data.summary || d.data.content || 'No summary'
      
      // 清空现有文本
      textElement.text('')
      textElement.attr('dy', null)
      
      // 设置基本文本属性
      textElement
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'central')
      
      // 计算container参数 - 使用超保守的估算
      const containerWidth = Math.max(120, Math.min(200, summary.length * 8 + 20))
      const usableWidth = containerWidth * 0.6 // 只使用container宽度的60%，留出40%边距
      const maxCharsPerLine = Math.floor(usableWidth / 10) // 每字符按10px计算，非常保守
      
      // 确保最小字符数，但也不能太多
      const safeMaxChars = Math.max(6, Math.min(12, maxCharsPerLine))
      
      // 换行处理
      const lines: string[] = []
      let remainingText = summary
      
      while (remainingText.length > 0 && lines.length < 3) {
        if (remainingText.length <= safeMaxChars) {
          lines.push(remainingText)
          break
        } else {
          lines.push(remainingText.substring(0, safeMaxChars))
          remainingText = remainingText.substring(safeMaxChars)
        }
      }
      
      // 如果还有剩余文本，在最后一行添加省略号
      if (remainingText.length > 0 && lines.length === 3) {
        lines[2] = lines[2].substring(0, Math.max(1, lines[2].length - 2)) + '..'
      }
      
      // 渲染文本行
      const lineHeight = 14
      const totalHeight = lines.length * lineHeight
      const startY = -totalHeight / 2 + lineHeight / 2
      
      lines.forEach((line, index) => {
        textElement.append('tspan')
          .attr('x', 0)
          .attr('y', startY + index * lineHeight)
          .text(line.trim()) // 去除可能的空格
      })
    })

  // 更新文本背景
  selection.select('.text-background')
    .each(function(d) {
      const summary = d.data.summary || d.data.content || 'No summary'
      
      // 计算container尺寸
      const containerWidth = Math.max(120, Math.min(200, summary.length * 8 + 20))
      const usableWidth = containerWidth * 0.6
      const maxCharsPerLine = Math.max(6, Math.min(12, Math.floor(usableWidth / 10)))
      const estimatedLines = Math.min(3, Math.ceil(summary.length / maxCharsPerLine))
      
      const width = containerWidth
      const height = Math.max(28, estimatedLines * 16 + 16) // 进一步增加高度边距
      
      d3.select(this)
        .attr('x', -width / 2)
        .attr('y', -height / 2)
        .attr('width', width)
        .attr('height', height)
    })
}

// 添加节点交互
function addNodeInteractions(selection: d3.Selection<SVGGElement, d3.HierarchyNode<ConversationTreeNode>, SVGGElement, unknown>) {
  selection
    .style('cursor', 'pointer')
    .call(drag)
    .on('click', (event, d) => {
      // 只有在没有移动的情况下才处理点击
      if (!hasMoved.value) {
        handleNodeClick(d.data)
      }
    })
    .on('mousedown', (event) => {
      // 阻止中键的默认行为
      if (event.button === 1) {
        event.preventDefault()
        event.stopPropagation()
      }
    })
    .on('mouseenter', (event, d) => {
      handleNodeMouseEnter(event, d.data)
    })
    .on('mouseleave', () => {
      handleNodeMouseLeave()
    })
    .on('mousemove', function(event) {
      // 根据是否按住修饰键动态改变鼠标样式（支持Cmd键或Alt键）
      const canDrag = event.metaKey || event.altKey
      d3.select(this).style('cursor', canDrag ? 'move' : 'pointer')
    })
}

// 更新节点样式
function updateNodeStyles() {
  if (!g) return

  g.selectAll<SVGGElement, d3.HierarchyNode<ConversationTreeNode>>('.node')
    .each(function(d) {
      const node = d3.select(this)
      const conversationId = d.data.conversationId
      
      // 确定节点颜色
      let colorClass = 'default'
      if (conversationId === selectedConversationId.value) {
        colorClass = 'current'
      } else if (ancestorNodeIds.value.includes(conversationId)) {
        colorClass = 'ancestor'
      } else if (starredNodeIds.value.includes(conversationId)) {
        colorClass = 'starred'
      }
      
      // 圆形节点已删除，不需要更新圆圈样式
      
      // 更新文本背景边框颜色
      const textBackground = node.select('.text-background')
      textBackground.classed('current ancestor starred default', false)
      textBackground.classed(colorClass, true)
    })
}

// ===== 事件处理 =====

// 节点点击事件
function handleNodeClick(node: ConversationTreeNode) {
  dialogStore.setSelectedConversation(node.conversationId)
  
  // 如果右边栏处于隐藏状态，自动唤出到正常展示状态
  if (layoutStore.chatPanelMode === 'hidden') {
    layoutStore.setChatPanelMode('normal')
  }
}

// 节点悬停进入
function handleNodeMouseEnter(event: MouseEvent, node: ConversationTreeNode) {
  if (hoverTimeout) {
    clearTimeout(hoverTimeout)
  }
  
  hoverId = node.id
  
  hoverTimeout = setTimeout(() => {
    if (hoverId === node.id) {
      // 显示当前节点的summary框
      // g.selectAll<SVGGElement, d3.HierarchyNode<ConversationTreeNode>>('.node')
      //   .filter(d => d.data.id === node.id)
      //   .select('.summary-container')
      //   .style('opacity', 1)
    }
  }, 500) // 0.5秒延迟
}

// 节点悬停离开
function handleNodeMouseLeave() {
  if (hoverTimeout) {
    clearTimeout(hoverTimeout)
    hoverTimeout = null
  }
  hoverId = null
  
  // 隐藏所有summary框
  // g.selectAll('.summary-container')
  //   .style('opacity', 0)
}

// 显示提示
function showTooltip(event: MouseEvent, content: string) {
  tooltipContent.value = content
  tooltipStyle.value = {
    left: event.clientX + 10 + 'px',
    top: event.clientY - 10 + 'px',
  }
  tooltipVisible.value = true
}

// 隐藏提示
function hideTooltip() {
  tooltipVisible.value = false
}

// ===== 工具栏操作 =====

// 适应屏幕
function fitToScreen() {
  if (!svg || !g || !containerRef.value) return

  const container = containerRef.value
  const width = container.clientWidth
  const height = container.clientHeight

  try {
    const bounds = g.node()?.getBBox()
    if (!bounds || bounds.width === 0 || bounds.height === 0) return

    const fullWidth = bounds.width
    const fullHeight = bounds.height
    const midX = bounds.x + fullWidth / 2
    const midY = bounds.y + fullHeight / 2

    const scale = Math.min(
      width / fullWidth,
      height / fullHeight
    ) * 0.8 // 留出边距

    const transform = d3.zoomIdentity
      .translate(width / 2, height / 2)
      .scale(scale)
      .translate(-midX, -midY)

    svg.transition()
      .duration(750)
      .call(zoom.transform, transform)
  } catch (error) {
    console.warn('Failed to fit to screen:', error)
  }
}

// 重置缩放
function resetZoom() {
  if (!svg) return

  svg.transition()
    .duration(750)
    .call(zoom.transform, d3.zoomIdentity)
}


// 处理窗口大小变化
function handleResize() {
  if (!containerRef.value || !svg) return

  const container = containerRef.value
  const width = container.clientWidth
  const height = container.clientHeight

  svg.attr('width', width).attr('height', height)
}

// ===== 拖拽处理函数 =====
function handleDragStart(event: any, d: d3.HierarchyNode<ConversationTreeNode>) {
  // 检查是否按住了修饰键或者使用中键，如果都没有则取消拖拽
  // 使用metaKey（Mac上的Cmd键）或altKey来避免Mac上Ctrl+左键弹出菜单的问题
  const isModifierClick = (event.sourceEvent.metaKey || event.sourceEvent.altKey) && event.sourceEvent.button === 0
  const isMiddleClick = event.sourceEvent.button === 1
  
  if (!isModifierClick && !isMiddleClick) {
    return
  }
  
  isDragging.value = true
  dragNode.value = d
  hasMoved.value = false
  
  // 记录拖拽起始位置
  const customPos = customNodePositions.value[d.data.conversationId]
  dragStartPosition.value = customPos ? { ...customPos } : { x: d.x, y: d.y }
  
  // 阻止事件冒泡和默认行为
  event.sourceEvent.stopPropagation()
  event.sourceEvent.preventDefault()
  
  // 特别阻止中键的默认行为（防止新标签页打开或滚动）
  if (isMiddleClick) {
    event.sourceEvent.stopImmediatePropagation()
  }
  
  // 添加拖拽样式 - 直接使用当前选中的节点
  const currentNode = d3.select(g.selectAll('.node').nodes().find(node => {
    const nodeData = d3.select(node).datum() as d3.HierarchyNode<ConversationTreeNode>
    return nodeData.data.conversationId === d.data.conversationId
  }))
  
  if (!currentNode.empty()) {
    currentNode.classed('dragging', true)
    // 提高z-index确保拖拽节点在最上层
    currentNode.style('z-index', '1000')
  }
}

function handleDrag(event: any, d: d3.HierarchyNode<ConversationTreeNode>) {
  if (!isDragging.value || !dragNode.value) return
  
  // 确保拖拽的是正确的节点
  if (dragNode.value.data.conversationId !== d.data.conversationId) {
    return
  }
  
  // 使用event.x和event.y，这是相对于SVG的绝对坐标
  const x = event.x
  const y = event.y
  
  // 检查是否有足够的移动距离
  if (dragStartPosition.value) {
    const moveDistance = Math.sqrt(
      Math.pow(x - dragStartPosition.value.x, 2) + 
      Math.pow(y - dragStartPosition.value.y, 2)
    )
    if (moveDistance > 2) {
      hasMoved.value = true
    }
  }
  
  // 更新自定义位置
  customNodePositions.value[dragNode.value.data.conversationId] = { x, y }
  
  // 立即更新正确的节点位置
  const currentNode = d3.select(g.selectAll('.node').nodes().find(node => {
    const nodeData = d3.select(node).datum() as d3.HierarchyNode<ConversationTreeNode>
    return nodeData.data.conversationId === dragNode.value!.data.conversationId
  }))
  
  if (!currentNode.empty()) {
    currentNode.attr('transform', `translate(${x},${y})`)
  }
  
  // 立即更新连接线
  updateLinksPosition()
}

function handleDragEnd(event: any, d: d3.HierarchyNode<ConversationTreeNode>) {
  // 移除拖拽样式 - 使用正确的节点
  const currentNode = d3.select(g.selectAll('.node').nodes().find(node => {
    const nodeData = d3.select(node).datum() as d3.HierarchyNode<ConversationTreeNode>
    return nodeData.data.conversationId === (dragNode.value?.data.conversationId || d.data.conversationId)
  }))
  
  if (!currentNode.empty()) {
    currentNode.classed('dragging', false)
    currentNode.style('z-index', null) // 恢复z-index
  }
  
  // 最终更新连接线
  updateLinksPosition()
  
  // 只有在真正移动了节点时才保存位置
  if (hasMoved.value) {
    saveCustomPositions()
  }
  
  // 清理拖拽状态
  isDragging.value = false
  dragNode.value = null
  dragStartPosition.value = null
  hasMoved.value = false
}

// 更新连接线位置
function updateLinksPosition() {
  if (!g) return
  
  g.selectAll<SVGPathElement, d3.HierarchyLink<ConversationTreeNode>>('.link')
    .attr('d', d => {
      const source = d.source
      const target = d.target
      
      // 计算容器尺寸和位置（考虑自定义位置）
      const getContainerBounds = (node: any) => {
        const summary = node.data.summary || node.data.content || 'No summary'
        const containerWidth = Math.max(120, Math.min(200, summary.length * 8 + 20))
        const usableWidth = containerWidth * 0.6
        const maxCharsPerLine = Math.max(6, Math.min(12, Math.floor(usableWidth / 10)))
        const estimatedLines = Math.min(3, Math.ceil(summary.length / maxCharsPerLine))
        const height = Math.max(28, estimatedLines * 16 + 16)
        
        // 使用自定义位置或默认位置
        const customPos = customNodePositions.value[node.data.conversationId]
        const x = customPos ? customPos.x : (node.x || 0)
        const y = customPos ? customPos.y : (node.y || 0)
        
        return {
          width: containerWidth,
          height: height,
          x: x,
          y: y
        }
      }
      
      const sourceBounds = getContainerBounds(source)
      const targetBounds = getContainerBounds(target)
      
      // 计算连接点（从容器底部到容器顶部）
      const sourceX = sourceBounds.x
      const sourceY = sourceBounds.y + sourceBounds.height / 2  // 源容器底部
      
      const targetX = targetBounds.x
      const targetY = targetBounds.y - targetBounds.height / 2  // 目标容器顶部
      
      // 生成曲线路径，保持与原始渲染一致的curve风格
      return `M${sourceX},${sourceY}
              C${sourceX},${(sourceY + targetY) / 2}
               ${targetX},${(sourceY + targetY) / 2}
               ${targetX},${targetY}`
    })
}

// 保存自定义位置到 localStorage
function saveCustomPositions() {
  const sessionId = sessionStore.currentSessionId
  if (!sessionId) return
  
  const key = `dialog-tree-positions-${sessionId}`
  try {
    localStorage.setItem(key, JSON.stringify(customNodePositions.value))
  } catch (error) {
    console.warn('Failed to save custom positions:', error)
  }
}

// 从 localStorage 加载自定义位置
function loadCustomPositions() {
  const sessionId = sessionStore.currentSessionId
  if (!sessionId) {
    customNodePositions.value = {}
    return
  }
  
  const key = `dialog-tree-positions-${sessionId}`
  try {
    const stored = localStorage.getItem(key)
    if (stored) {
      customNodePositions.value = JSON.parse(stored)
    } else {
      customNodePositions.value = {}
    }
  } catch (error) {
    console.warn('Failed to load custom positions:', error)
    customNodePositions.value = {}
  }
}

// 重置布局到默认位置
function resetLayout() {
  if (!conversationTree.value || !g) return
  
  // 创建层次结构来获取默认位置
  const root = d3.hierarchy(conversationTree.value, d => d.children)
  tree(root)
  
  // 为所有节点设置动画到默认位置
  const nodeUpdate = g.selectAll<SVGGElement, d3.HierarchyNode<ConversationTreeNode>>('.node')
    .transition()
    .duration(300)
    .attr('transform', d => `translate(${d.x},${d.y})`)
  
  // 为连接线设置动画到默认位置
  g.selectAll<SVGPathElement, d3.HierarchyLink<ConversationTreeNode>>('.link')
    .transition()
    .duration(300)
    .attr('d', d => {
      const source = d.source
      const target = d.target
      
      // 计算容器尺寸（使用默认位置）
      const getContainerBounds = (node: any) => {
        const summary = node.data.summary || node.data.content || 'No summary'
        const containerWidth = Math.max(120, Math.min(200, summary.length * 8 + 20))
        const usableWidth = containerWidth * 0.6
        const maxCharsPerLine = Math.max(6, Math.min(12, Math.floor(usableWidth / 10)))
        const estimatedLines = Math.min(3, Math.ceil(summary.length / maxCharsPerLine))
        const height = Math.max(28, estimatedLines * 16 + 16)
        
        return {
          width: containerWidth,
          height: height,
          x: node.x || 0,
          y: node.y || 0
        }
      }
      
      const sourceBounds = getContainerBounds(source)
      const targetBounds = getContainerBounds(target)
      
      // 计算连接点（从容器底部到容器顶部）
      const sourceX = sourceBounds.x
      const sourceY = sourceBounds.y + sourceBounds.height / 2
      
      const targetX = targetBounds.x
      const targetY = targetBounds.y - targetBounds.height / 2
      
      // 生成曲线路径
      return `M${sourceX},${sourceY}
              C${sourceX},${(sourceY + targetY) / 2}
               ${targetX},${(sourceY + targetY) / 2}
               ${targetX},${targetY}`
    })
  
  // 在动画完成后清空自定义位置并保存
  nodeUpdate.on('end', () => {
    customNodePositions.value = {}
    saveCustomPositions()
  })
}
</script>

<style lang="less" scoped>
.tree-visualization {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.tree-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 16px;
  background-color: #fff;
  border-bottom: 1px solid #e5e5e5;
  flex-shrink: 0;
  height: 40px;

  .toolbar-left {
    width: 300px;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  
  .toolbar-right {
    display: flex;
    align-items: center;
    gap: 8px;
  }
}



.color-legend {
  display: flex;
  gap: 16px;
  font-size: 12px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.legend-color {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: 2px solid;
  
  &.current {
    background-color: var(--node-current);
    border-color: var(--node-current);
  }
  
  &.ancestor {
    background-color: var(--node-ancestor);
    border-color: var(--node-ancestor);
  }
  
  &.starred {
    background-color: var(--node-starred);
    border-color: var(--node-starred);
  }
  
  &.default {
    background-color: var(--node-default);
    border-color: var(--node-default);
  }
}

.tree-container {
  flex: 1;
  overflow: hidden;
  position: relative;
}

.bottom-left-controls {
  position: absolute;
  bottom: 12px;
  left: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  pointer-events: none;
}

.control-buttons {
  display: flex;
  gap: 4px;
  pointer-events: auto;
  
  .arco-btn {
    background: rgba(255, 255, 255, 0.9);
    backdrop-filter: blur(4px);
    border: 1px solid rgba(0, 0, 0, 0.1);
    
    &:hover {
      background: rgba(255, 255, 255, 1);
    }
  }
}

.drag-hint {
  font-size: 12px;
  color: #999;
  background: rgba(255, 255, 255, 0.8);
  padding: 4px 8px;
  border-radius: 4px;
  backdrop-filter: blur(4px);
  pointer-events: none;
  user-select: none;
  white-space: nowrap;
}

.tree-svg {
  width: 100%;
  height: 100%;
  background-color: #fafafa;
}

// D3节点样式
:deep(.node) {
  // 圆形节点相关样式已删除
  transition: opacity 0.2s ease;
  
  &.dragging {
    opacity: 0.8;
    
    .text-background {
      stroke: #1890ff;
      stroke-width: 2px;
      filter: drop-shadow(0 4px 8px rgba(24, 144, 255, 0.3));
    }
  }
  
  .text-background {
    fill: rgba(252, 252, 252, 0.9);
    stroke: #ddd;
    stroke-width: 2px;
    
    &.current {
      stroke: #4696ff; // 蓝色
      stroke-width: 3px;
    }
    
    &.ancestor {
      stroke: #45b6f4; // 青色(cyan)
      stroke-width: 2px;
    }
    
    &.starred {
      stroke: #bd9035; // 黄色
      stroke-width: 2px;
    }
    
    &.default {
      stroke: #ddd; // 灰色
      stroke-width: 1px;
    }
  }
  
  .text-content {
    fill: #333;
    font-size: 12px;
    font-weight: 500;
  }
  
  &:hover {
    .text-background {
      fill: rgba(255, 255, 255, 1);
      transition: 0.3s ease;
      filter: drop-shadow(0 2px 6px rgba(0, 0, 0, 0.15));
      //stroke: #1373e4;
      //stroke-width: 2px;
    }
  }
}

.tree-tooltip {
  position: fixed;
  background-color: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 8px 12px;
  border-radius: 4px;
  font-size: 12px;
  max-width: 300px;
  word-wrap: break-word;
  z-index: var(--z-tooltip);
  pointer-events: none;
}

.empty-state {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}
</style>