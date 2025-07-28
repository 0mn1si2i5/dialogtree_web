<template>
  <div class="dialog-tree-visualization">
    <!-- 顶部工具栏 -->
    <div class="tree-toolbar">
      <div class="toolbar-left">
        <span class="current-session-title">
          {{ currentSession?.title || '请选择一个对话' }}
        </span>
        
        <!-- 图例说明 -->
        <div class="legend" v-if="hasDialogTree">
          <span class="legend-item">
            <span class="legend-dot current-dot"></span>
            当前节点
          </span>
          <span class="legend-item">
            <span class="legend-dot ancestor-dot"></span>
            祖先节点
          </span>
          <span class="legend-item">
            <span class="legend-dot starred-dot"></span>
            收藏节点
          </span>
          <span class="legend-item">
            <span class="legend-dot other-dot"></span>
            其他节点
          </span>
        </div>
      </div>
      <div class="toolbar-right">
        <a-space>
          <!-- 缩放控制 -->
          <a-button-group size="small">
            <a-button @click="zoomIn">
              <template #icon>
                <icon-zoom-in />
              </template>
            </a-button>
            <a-button @click="zoomOut">
              <template #icon>
                <icon-zoom-out />
              </template>
            </a-button>
            <a-button @click="resetZoom">
              <template #icon>
                <icon-refresh />
              </template>
            </a-button>
          </a-button-group>
          
          <!-- 显示模式控制 -->
          <a-button-group size="small">
            <a-button 
              @click="fitToScreen" 
              :type="displayMode === 'fit' ? 'primary' : 'secondary'"
            >
              <template #icon>
                <icon-fullscreen />
              </template>
              适应屏幕
            </a-button>
            <a-button 
              @click="actualSize" 
              :type="displayMode === 'actual' ? 'primary' : 'secondary'"
            >
              <template #icon>
                <icon-eye />
              </template>
              实际大小
            </a-button>
          </a-button-group>
        </a-space>
      </div>
    </div>

    <!-- D3.js 树形图容器 -->
    <div class="tree-container" ref="treeContainerRef">
      <svg ref="svgRef" class="tree-svg">
        <g ref="containerRef"></g>
      </svg>
      
      <!-- Hover Tooltip -->
      <div 
        v-if="showTooltip" 
        class="node-tooltip"
        :style="{
          left: tooltipPosition.x + 'px',
          top: tooltipPosition.y + 'px'
        }"
      >
        {{ tooltipContent }}
      </div>
      
      <!-- 当没有对话树时显示的占位符 -->
      <div v-if="!hasDialogTree" class="empty-tree">
        <a-empty description="暂无对话树">
          <template #image>
            <icon-branch />
          </template>
          <div class="empty-hint">
            选择一个会话并开始对话，将会生成对话树
          </div>
        </a-empty>
      </div>
    </div>

    <!-- 对话详情Modal -->
    <ConversationDetailModal
      v-model:visible="showDetailModal"
      :conversation-id="selectedConversationId"
      @continue-from-here="handleContinueFromHere"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, computed, nextTick } from 'vue'
import * as d3 from 'd3'
import { IconZoomIn, IconZoomOut, IconRefresh, IconBranch } from '@arco-design/web-vue/es/icon'
import { useSessionStore } from '@/stores/session'
import { useDialogStore } from '@/stores/dialog'
import ConversationDetailModal from './ConversationDetailModal.vue'
import type { ConversationTreeNode } from '@/types'

const sessionStore = useSessionStore()
const dialogStore = useDialogStore()

// DOM引用
const treeContainerRef = ref<HTMLElement>()
const svgRef = ref<SVGSVGElement>()
const containerRef = ref<SVGGElement>()

// D3相关变量
let svg: d3.Selection<SVGSVGElement, unknown, null, undefined>
let g: d3.Selection<SVGGElement, unknown, null, undefined>
let zoom: d3.ZoomBehavior<SVGSVGElement, unknown>
let tree: d3.TreeLayout<ConversationTreeNode>

// 响应式数据
const width = ref(800)
const height = ref(600)
const showDetailModal = ref(false)
const selectedConversationId = ref<number | null>(null)
const displayMode = ref<'fit' | 'actual'>('actual')

// Tooltip相关
const showTooltip = ref(false)
const tooltipContent = ref('')
const tooltipPosition = ref({ x: 0, y: 0 })
let hoverTimer: number | null = null

// 计算属性
const currentSession = computed(() => sessionStore.currentSession)
const conversationTree = computed(() => dialogStore.conversationTree)
const hasDialogTree = computed(() => conversationTree.value !== null)

// 监听当前会话变化
watch(() => sessionStore.currentSessionId, async (newSessionId) => {
  if (newSessionId) {
    await dialogStore.fetchDialogTree(newSessionId)
    await nextTick()
    renderTree()
  }
}, { immediate: true })

// 监听对话树数据变化
watch(conversationTree, () => {
  renderTree()
}, { deep: true })

// 初始化D3
const initD3 = () => {
  if (!svgRef.value || !containerRef.value) return

  // 获取容器尺寸
  const container = treeContainerRef.value!
  width.value = container.clientWidth
  height.value = container.clientHeight

  svg = d3.select(svgRef.value)
    .attr('width', width.value)
    .attr('height', height.value)

  g = d3.select(containerRef.value)

  // 设置缩放行为
  zoom = d3.zoom<SVGSVGElement, unknown>()
    .scaleExtent([0.1, 3])
    .on('zoom', (event) => {
      g.attr('transform', event.transform)
    })

  svg.call(zoom)

  // 初始化树布局
  tree = d3.tree<ConversationTreeNode>()
    .size([height.value - 100, width.value - 200])
}

// 渲染树形图
const renderTree = () => {
  if (!g || !conversationTree.value) return

  // 清除之前的内容
  g.selectAll('*').remove()

  // 创建层次数据
  const root = d3.hierarchy(conversationTree.value)
  
  // 应用树布局
  tree(root)

  // 绘制连接线
  const links = g.selectAll('.link')
    .data(root.links())
    .enter()
    .append('path')
    .attr('class', 'link')
    .attr('d', d3.linkHorizontal<d3.HierarchyLink<ConversationTreeNode>, d3.HierarchyPointNode<ConversationTreeNode>>()
      .x(d => d.y + 100)
      .y(d => d.x + 50)
    )
    .style('fill', 'none')
    .style('stroke', '#ccc')
    .style('stroke-width', 2)

  // 绘制节点
  const nodes = g.selectAll('.node')
    .data(root.descendants())
    .enter()
    .append('g')
    .attr('class', 'node')
    .attr('transform', d => `translate(${(d.y || 0) + 100},${(d.x || 0) + 50})`)
    .style('cursor', 'pointer')
    .on('click', handleNodeClick)

  // 添加节点圆圈
  nodes.append('circle')
    .attr('r', 8)
    .style('fill', d => {
      const conversationId = d.data.conversationId
      const selectedId = dialogStore.selectedConversationId
      const ancestorIds = dialogStore.ancestorConversationIds
      
      // 新的4色系统
      if (conversationId === selectedId) {
        return '#1890ff' // 蓝色：当前选中节点
      } else if (ancestorIds.includes(conversationId)) {
        return '#00b4d8' // 青色：祖先节点
      } else if (d.data.isStarred) {
        return '#ff7f0e' // 橙色：收藏节点
      } else {
        return '#94a3b8' // 灰色：其他节点
      }
    })
    .style('stroke', '#fff')
    .style('stroke-width', d => {
      // 当前选中节点使用更粗的边框
      const conversationId = d.data.conversationId
      const selectedId = dialogStore.selectedConversationId
      return conversationId === selectedId ? 3 : 2
    })

  // 添加节点文本（支持换行）
  const textNodes = nodes.append('text')
    .attr('dy', '.35em')
    .attr('x', d => d.children ? -13 : 13)
    .style('text-anchor', d => d.children ? 'end' : 'start')
    .style('font-size', '12px')
    .style('fill', '#333')
    .style('font-family', 'Arial, sans-serif')
  
  // 文本换行处理
  textNodes.each(function(d) {
    const text = d3.select(this)
    const summary = d.data.summary || d.data.title || 'Conversation'
    const maxWidth = 120 // 最大宽度
    const lineHeight = 14 // 行高
    
    // 如果文本较短，直接显示
    if (summary.length <= 15) {
      text.text(summary)
      return
    }
    
    // 长文本进行换行处理
    const words = summary.split('')
    let line = ''
    let lineNumber = 0
    const maxLines = 2 // 最多2行
    
    text.text('') // 清空文本
    
    for (let i = 0; i < words.length; i++) {
      const testLine = line + words[i]
      
      if (testLine.length > 15 && line) {
        // 创建新行
        if (lineNumber < maxLines - 1) {
          text.append('tspan')
            .attr('x', d.children ? -13 : 13)
            .attr('dy', lineNumber === 0 ? '0em' : '1.2em')
            .text(line)
          line = words[i]
          lineNumber++
        } else {
          // 最后一行，添加省略号
          text.append('tspan')
            .attr('x', d.children ? -13 : 13)
            .attr('dy', lineNumber === 0 ? '0em' : '1.2em')
            .text(line + '...')
          break
        }
      } else {
        line = testLine
      }
    }
    
    // 添加最后一行
    if (line && lineNumber < maxLines) {
      text.append('tspan')
        .attr('x', d.children ? -13 : 13)
        .attr('dy', lineNumber === 0 ? '0em' : '1.2em')
        .text(line)
    }
  })

  // 居中显示
  const bounds = g.node()?.getBBox()
  if (bounds) {
    const centerX = (width.value - bounds.width) / 2 - bounds.x
    const centerY = (height.value - bounds.height) / 2 - bounds.y
    
    svg.call(zoom.transform, d3.zoomIdentity.translate(centerX, centerY))
  }
}

// 节点点击处理
const handleNodeClick = async (event: any, d: d3.HierarchyNode<ConversationTreeNode>) => {
  console.log('节点被点击:', d.data)
  
  if (d.data.conversationId) {
    // 设置选中节点并获取祖先节点
    await dialogStore.setSelectedConversation(d.data.conversationId)
    
    // 重新渲染树以更新节点颜色
    renderTree()
    
    // 显示对话详情Modal
    selectedConversationId.value = d.data.conversationId
    showDetailModal.value = true
  }
}

// 处理从某个节点继续对话
const handleContinueFromHere = (conversationId: number) => {
  console.log('从对话继续:', conversationId)
  // 这里可以传递给ChatPanel组件，设置parentConversationId
  // 目前先打印日志
}

// 显示模式控制
const fitToScreen = () => {
  displayMode.value = 'fit'
  if (!g || !conversationTree.value) return
  
  // 获取所有节点的边界
  const nodes = g.selectAll('.node').nodes()
  if (nodes.length === 0) return
  
  // 计算边界框
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity
  
  nodes.forEach((node: any) => {
    const transform = node.getAttribute('transform')
    if (transform) {
      const match = transform.match(/translate\(([^,]+),([^)]+)\)/)
      if (match) {
        const x = parseFloat(match[1])
        const y = parseFloat(match[2])
        minX = Math.min(minX, x)
        maxX = Math.max(maxX, x)
        minY = Math.min(minY, y)
        maxY = Math.max(maxY, y)
      }
    }
  })
  
  // 计算缩放比例和平移量
  const nodeWidth = maxX - minX + 200 // 增加边距
  const nodeHeight = maxY - minY + 100
  const scaleX = width.value / nodeWidth
  const scaleY = height.value / nodeHeight
  const scale = Math.min(scaleX, scaleY, 1) // 不超过100%
  
  const centerX = (minX + maxX) / 2
  const centerY = (minY + maxY) / 2
  const translateX = width.value / 2 - centerX * scale
  const translateY = height.value / 2 - centerY * scale
  
  // 应用变换
  const transform = d3.zoomIdentity
    .translate(translateX, translateY)
    .scale(scale)
  
  svg.transition()
    .duration(750)
    .call(zoom.transform, transform)
}

const actualSize = () => {
  displayMode.value = 'actual'
  resetZoom()
}

// 节点hover处理
const handleNodeMouseEnter = (event: MouseEvent, d: d3.HierarchyNode<ConversationTreeNode>) => {
  // 清除之前的定时器
  if (hoverTimer) {
    clearTimeout(hoverTimer)
  }
  
  // 1秒后显示tooltip
  hoverTimer = window.setTimeout(() => {
    const summary = d.data.summary || d.data.title || '无摘要'
    tooltipContent.value = summary
    
    // 计算tooltip位置
    const rect = (event.target as Element).getBoundingClientRect()
    const containerRect = treeContainerRef.value?.getBoundingClientRect()
    
    if (containerRect) {
      tooltipPosition.value = {
        x: rect.left - containerRect.left + rect.width / 2,
        y: rect.top - containerRect.top - 10
      }
    }
    
    showTooltip.value = true
  }, 1000)
}

const handleNodeMouseLeave = () => {
  // 清除定时器和隐藏tooltip
  if (hoverTimer) {
    clearTimeout(hoverTimer)
    hoverTimer = null
  }
  showTooltip.value = false
}

// 缩放控制
const zoomIn = () => {
  svg.transition().duration(300).call(zoom.scaleBy, 1.5)
}

const zoomOut = () => {
  svg.transition().duration(300).call(zoom.scaleBy, 1 / 1.5)
}

const resetZoom = () => {
  svg.transition().duration(500).call(zoom.transform, d3.zoomIdentity)
}

// 窗口大小调整
const handleResize = () => {
  if (!treeContainerRef.value) return
  
  const container = treeContainerRef.value
  width.value = container.clientWidth
  height.value = container.clientHeight
  
  svg.attr('width', width.value).attr('height', height.value)
  tree.size([height.value - 100, width.value - 200])
  
  renderTree()
}

// 生命周期
onMounted(() => {
  nextTick(() => {
    initD3()
    renderTree()
  })
  
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})
</script>

<style lang="less" scoped>
.dialog-tree-visualization {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.tree-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: var(--bg-primary);
  border-bottom: 1px solid var(--border-color-light);
}

.toolbar-left {
  .current-session-title {
    font-size: 16px;
    font-weight: 500;
    color: var(--text-primary);
  }
  
  .legend {
    margin-top: 8px;
    display: flex;
    gap: 16px;
    
    .legend-item {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      color: var(--text-secondary);
    }
    
    .legend-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      border: 2px solid #fff;
      
      &.current-dot {
        background: #1890ff;
        border-width: 3px;
      }
      
      &.ancestor-dot {
        background: #00b4d8;
      }
      
      &.starred-dot {
        background: #ff7f0e;
      }
      
      &.other-dot {
        background: #94a3b8;
      }
    }
  }
}

.tree-container {
  flex: 1;
  position: relative;
  overflow: hidden;
}

.tree-svg {
  width: 100%;
  height: 100%;
  background: var(--bg-secondary);
}

.empty-tree {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
}

.empty-hint {
  margin-top: 8px;
  color: var(--text-secondary);
  font-size: 14px;
}

.node-tooltip {
  position: absolute;
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 8px 12px;
  border-radius: 4px;
  font-size: 12px;
  max-width: 200px;
  word-wrap: break-word;
  z-index: 1000;
  pointer-events: none;
  transform: translateX(-50%);
  
  &::after {
    content: '';
    position: absolute;
    top: 100%;
    left: 50%;
    transform: translateX(-50%);
    border: 5px solid transparent;
    border-top-color: rgba(0, 0, 0, 0.8);
  }
}

// D3.js样式
:deep(.link) {
  fill: none;
  stroke: #ccc;
  stroke-width: 2px;
}

:deep(.node) {
  cursor: pointer;
  
  circle {
    transition: all 0.2s;
    
    &:hover {
      r: 10;
      stroke-width: 3px;
    }
  }
  
  text {
    font: 12px sans-serif;
    pointer-events: none;
  }
}
</style> 