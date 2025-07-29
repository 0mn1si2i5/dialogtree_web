<template>
  <div class="tree-visualization">
    <!-- 工具栏 -->
    <div class="tree-toolbar">
      <div class="toolbar-left">
        <a-button-group size="small">
          <a-button @click="fitToScreen" type="text">
            <template #icon>
              <icon-fullscreen />
            </template>
            {{ $t('tree.fitScreen') }}
          </a-button>
          <a-button @click="resetZoom" type="text">
            <template #icon>
              <icon-refresh />
            </template>
            {{ $t('tree.actualSize') }}
          </a-button>
        </a-button-group>
      </div>
      
      <div class="toolbar-right">
        <!-- 语言切换按钮 -->
        <a-button @click="toggleLanguage" type="text" size="small" class="language-toggle">
          <template #icon>
            <icon-language />
          </template>
          {{ localeStore.getToggleButtonText() }}
        </a-button>
        
        <!-- 节点颜色图例 -->
<!--        <div class="color-legend">-->
<!--          <div class="legend-item">-->
<!--            <div class="legend-color current"></div>-->
<!--            <span>当前选中</span>-->
<!--          </div>-->
<!--          <div class="legend-item">-->
<!--            <div class="legend-color ancestor"></div>-->
<!--            <span>祖先路径</span>-->
<!--          </div>-->
<!--          <div class="legend-item">-->
<!--            <div class="legend-color starred"></div>-->
<!--            <span>已收藏</span>-->
<!--          </div>-->
<!--          <div class="legend-item">-->
<!--            <div class="legend-color default"></div>-->
<!--            <span>普通节点</span>-->
<!--          </div>-->
<!--        </div>-->
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
      <a-empty :description="$t('chat.selectSession')" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import * as d3 from 'd3'
import { useI18n } from 'vue-i18n'
import { useDialogStore, useLocaleStore } from '@/stores'
import { 
  IconFullscreen, 
  IconRefresh,
  IconLanguage
} from '@arco-design/web-vue/es/icon'
import type { ConversationTreeNode } from '@/types'

// 使用stores和i18n
const dialogStore = useDialogStore()
const localeStore = useLocaleStore()
const { locale } = useI18n()

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
  linkSelection.exit().remove()

  // 添加新连接线
  const linkEnter = linkSelection.enter()
    .append('path')
    .attr('class', 'link')
    .attr('fill', 'none')
    .attr('stroke', '#ccc')
    .attr('stroke-width', 2)
    // .attr('marker-end', 'url(#arrowhead)') // 移除箭头

  // 更新连接线路径 - 连接到容器边缘
  linkEnter.merge(linkSelection)
    .attr('d', d => {
      const source = d.source
      const target = d.target
      
      // 计算容器尺寸
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
    .attr('transform', d => `translate(${d.x},${d.y})`)
    .style('opacity', 0)

  // 删除节点圆圈 - 不再需要

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

  // 更新现有节点
  const nodeUpdate = nodeEnter.merge(nodeSelection)
    .transition()
    .duration(300)
    .style('opacity', 1)
    .attr('transform', d => `translate(${d.x},${d.y})`)

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

// 切换语言
function toggleLanguage() {
  localeStore.toggleLocale()
  locale.value = localeStore.currentLocale
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
  height: 65px;

  .toolbar-left {
    width: 300px;
    display: flex;
    align-items: center;
    justify-content: space-between;
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

.tree-svg {
  width: 100%;
  height: 100%;
  background-color: #fafafa;
}

// D3节点样式
:deep(.node) {
  // 圆形节点相关样式已删除
  
  .text-background {
    fill: rgba(255, 255, 255, 0.9);
    stroke: #ddd;
    stroke-width: 1px;
    
    &.current {
      stroke: #0961d5; // 蓝色
      stroke-width: 2px;
    }
    
    &.ancestor {
      stroke: #89ccff; // 青色(cyan)
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
      stroke: #999;
      stroke-width: 2px;
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