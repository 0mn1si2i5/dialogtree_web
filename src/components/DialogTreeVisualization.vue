<template>
  <div class="tree-visualization">
    <!-- 工具栏 -->
    <div class="tree-toolbar">
      <div class="toolbar-left">
        <a-button-group size="small">
          <a-button @click="fitToScreen">
            <template #icon>
              <icon-fullscreen />
            </template>
            适应屏幕
          </a-button>
          <a-button @click="resetZoom">
            <template #icon>
              <icon-refresh />
            </template>
            实际大小
          </a-button>
        </a-button-group>
      </div>
      
      <div class="toolbar-right">
        <!-- 节点颜色图例 -->
        <div class="color-legend">
          <div class="legend-item">
            <div class="legend-color current"></div>
            <span>当前选中</span>
          </div>
          <div class="legend-item">
            <div class="legend-color ancestor"></div>
            <span>祖先路径</span>
          </div>
          <div class="legend-item">
            <div class="legend-color starred"></div>
            <span>已收藏</span>
          </div>
          <div class="legend-item">
            <div class="legend-color default"></div>
            <span>普通节点</span>
          </div>
        </div>
      </div>
    </div>

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
      <a-empty description="选择一个会话开始对话" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import * as d3 from 'd3'
import { useDialogStore } from '@/stores'
import { 
  IconFullscreen, 
  IconRefresh 
} from '@arco-design/web-vue/es/icon'
import type { ConversationTreeNode } from '@/types'

// 使用stores
const dialogStore = useDialogStore()

// 模板引用
const containerRef = ref<HTMLElement>()
const svgRef = ref<SVGElement>()

// 状态
const tooltipVisible = ref(false)
const tooltipContent = ref('')
const tooltipStyle = ref({})

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

// 树形图配置
const nodeRadius = 8
const nodeSpacing = { x: 200, y: 80 }
let hoverId: number | null = null
let hoverTimeout: NodeJS.Timeout | null = null

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
watch(conversationTree, () => {
  nextTick(() => {
    renderTree()
  })
}, { deep: true })

watch([selectedConversationId, ancestorNodeIds, starredNodeIds], () => {
  updateNodeStyles()
}, { deep: true })

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
  linkSelection.exit().remove()

  // 添加新连接线
  const linkEnter = linkSelection.enter()
    .append('path')
    .attr('class', 'link')
    .attr('fill', 'none')
    .attr('stroke', '#ccc')
    .attr('stroke-width', 2)
    // .attr('marker-end', 'url(#arrowhead)') // 移除箭头

  // 更新连接线路径
  linkEnter.merge(linkSelection)
    .attr('d', d => {
      const source = d.source
      const target = d.target
      
      // 使用贝塞尔曲线连接节点
      return `M${source.x},${source.y}
              C${source.x},${(source.y + target.y) / 2}
               ${target.x},${(source.y + target.y) / 2}
               ${target.x},${target.y}`
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
    .attr('transform', d => `translate(${d.x},${d.y})`)
    .style('opacity', 0)

  // 添加节点圆圈
  nodeEnter.append('circle')
    .attr('r', nodeRadius)
    .attr('class', d => `node-circle ${d.data.type}`)

  // 添加节点文本
  const textGroup = nodeEnter.append('g')
    .attr('class', 'node-text')

  // 文本背景
  textGroup.append('rect')
    .attr('class', 'text-background')
    .attr('rx', 4)
    .attr('ry', 4)

  // 文本内容
  textGroup.append('text')
    .attr('class', 'text-content')
    .attr('text-anchor', 'middle')
    .attr('dy', '0.35em')

  // Summary框 - 默认不可见
  const summaryGroup = nodeEnter.append('g')
    .attr('class', 'summary-container')
    .style('opacity', 0)
    .style('pointer-events', 'none')

  // Summary背景
  summaryGroup.append('rect')
    .attr('class', 'summary-background')
    .attr('rx', 6)
    .attr('ry', 6)
    .attr('width', 200) // 固定宽度
    .attr('x', -100) // 居中
    .attr('y', 25) // 位于节点下方

  // Summary文本
  summaryGroup.append('text')
    .attr('class', 'summary-text')
    .attr('text-anchor', 'middle')
    .attr('y', 40)

  // 更新现有节点
  const nodeUpdate = nodeEnter.merge(nodeSelection)
    .transition()
    .duration(300)
    .style('opacity', 1)
    .attr('transform', d => `translate(${d.x},${d.y})`)

  // 更新文本内容和样式
  updateNodeTexts(nodeUpdate)
  
  // 更新Summary内容
  updateSummaryTexts(nodeEnter.merge(nodeSelection))
  
  // 添加交互事件
  addNodeInteractions(nodeEnter.merge(nodeSelection))

  // 更新节点样式
  updateNodeStyles()
}

// 更新节点文本
function updateNodeTexts(selection: d3.Transition<SVGGElement, d3.HierarchyNode<ConversationTreeNode>, SVGGElement, unknown>) {
  selection.select('.text-content')
    .text(d => {
      // 节点本身显示简化的对话标题或序号
      const title = d.data.title || `对话 ${d.data.conversationId}`
      return title.length > 15 ? title.substring(0, 15) + '...' : title
    })
    .each(function(d) {
      const text = d3.select(this)
      const title = d.data.title || `对话 ${d.data.conversationId}`
      
      // 如果标题太长，进行换行处理
      if (title.length > 15) {
        const words = title.split('')
        text.text('')
        
        let tspan = text.append('tspan')
          .attr('x', 0)
          .attr('dy', '0em')
        
        let line = ''
        for (let i = 0; i < Math.min(words.length, 30); i++) {
          if (i > 0 && i % 15 === 0) {
            tspan.text(line)
            tspan = text.append('tspan')
              .attr('x', 0)
              .attr('dy', '1.2em')
            line = words[i]
          } else {
            line += words[i]
          }
        }
        tspan.text(line + (title.length > 30 ? '...' : ''))
      }
    })

  // 更新文本背景
  selection.select('.text-background')
    .each(function() {
      const textElement = d3.select(this.parentNode).select('.text-content')
      const bbox = (textElement.node() as SVGTextElement)?.getBBox()
      
      if (bbox) {
        d3.select(this)
          .attr('x', bbox.x - 8)
          .attr('y', bbox.y - 4)
          .attr('width', bbox.width + 16)
          .attr('height', bbox.height + 8)
      }
    })
}

// 更新Summary文本
function updateSummaryTexts(selection: d3.Selection<SVGGElement, d3.HierarchyNode<ConversationTreeNode>, SVGGElement, unknown>) {
  selection.select('.summary-text')
    .text(d => {
      const summary = d.data.summary || d.data.content || 'No summary'
      return summary.length > 20 ? summary.substring(0, 20) + '...' : summary
    })
    .each(function(d) {
      const text = d3.select(this)
      const summary = d.data.summary || d.data.content || 'No summary'
      
      // 如果摘要太长，进行换行处理
      if (summary.length > 20) {
        const words = summary.split('')
        text.text('')
        
        let tspan = text.append('tspan')
          .attr('x', 0)
          .attr('dy', '0em')
        
        let line = ''
        for (let i = 0; i < Math.min(words.length, 30); i++) {
          if (i > 0 && i % 20 === 0) {
            tspan.text(line)
            tspan = text.append('tspan')
              .attr('x', 0)
              .attr('dy', '1.2em')
            line = words[i]
          } else {
            line += words[i]
          }
        }
        tspan.text(line + (summary.length > 30 ? '...' : ''))
      }
    })
}

// 添加节点交互
function addNodeInteractions(selection: d3.Selection<SVGGElement, d3.HierarchyNode<ConversationTreeNode>, SVGGElement, unknown>) {
  selection
    .style('cursor', 'pointer')
    .on('click', (event, d) => {
      handleNodeClick(d.data)
    })
    .on('mouseenter', (event, d) => {
      handleNodeMouseEnter(event, d.data)
    })
    .on('mouseleave', () => {
      handleNodeMouseLeave()
    })
}

// 更新节点样式
function updateNodeStyles() {
  if (!g) return

  g.selectAll<SVGCircleElement, d3.HierarchyNode<ConversationTreeNode>>('.node-circle')
    .each(function(d) {
      const circle = d3.select(this)
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
      
      // 移除所有颜色类
      circle.classed('current ancestor starred default', false)
      // 添加当前颜色类
      circle.classed(colorClass, true)
    })
}

// ===== 事件处理 =====

// 节点点击事件
function handleNodeClick(node: ConversationTreeNode) {
  dialogStore.setSelectedConversation(node.conversationId)
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
      g.selectAll<SVGGElement, d3.HierarchyNode<ConversationTreeNode>>('.node')
        .filter(d => d.data.id === node.id)
        .select('.summary-container')
        .style('opacity', 1)
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
  g.selectAll('.summary-container')
    .style('opacity', 0)
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
  padding: 12px 16px;
  background-color: #fff;
  border-bottom: 1px solid #e5e5e5;
  flex-shrink: 0;
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

.tree-svg {
  width: 100%;
  height: 100%;
  background-color: #fafafa;
}

// D3节点样式
:deep(.node) {
  .node-circle {
    fill: var(--node-default);
    stroke: var(--node-default);
    stroke-width: 2px;
    transition: all 0.3s ease;
    
    &.current {
      fill: var(--node-current);
      stroke: var(--node-current);
      stroke-width: 3px;
    }
    
    &.ancestor {
      fill: var(--node-ancestor);
      stroke: var(--node-ancestor);
      stroke-width: 3px;
    }
    
    &.starred {
      fill: var(--node-starred);
      stroke: var(--node-starred);
      stroke-width: 3px;
    }
    
    &.user {
      // 用户问题节点样式
    }
    
    &.assistant {
      // AI回答节点样式
    }
    
    &.conversation {
      // 完整对话节点样式（默认样式即可）
    }
  }
  
  .text-background {
    fill: rgba(255, 255, 255, 0.9);
    stroke: #ddd;
    stroke-width: 1px;
  }
  
  .text-content {
    fill: #333;
    font-size: 12px;
    font-weight: 500;
  }

  .summary-container {
    opacity: 0;
    pointer-events: none;
  }

  .summary-background {
    fill: rgba(255, 255, 255, 0.3);
    stroke: #fff;
    stroke-width: 1px;
  }

  .summary-text {
    fill: #fff;
    font-size: 12px;
    font-weight: 500;
  }
  
  &:hover {
    .node-circle {
      stroke-width: 4px;
      filter: brightness(1.1);
    }
    
    .text-background {
      fill: rgba(255, 255, 255, 1);
      stroke: #999;
    }

    .summary-container {
      opacity: 1;
      pointer-events: auto;
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