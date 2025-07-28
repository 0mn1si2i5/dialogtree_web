<template>
  <div class="dialog-tree-visualization">
    <!-- 顶部工具栏 -->
    <div class="tree-toolbar">
      <div class="toolbar-left">
        <span class="current-session-title">
          {{ currentSession?.title || '请选择一个对话' }}
        </span>
      </div>
      <div class="toolbar-right">
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
      </div>
    </div>

    <!-- D3.js 树形图容器 -->
    <div class="tree-container" ref="treeContainerRef">
      <svg ref="svgRef" class="tree-svg">
        <g ref="containerRef"></g>
      </svg>
      
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
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, computed, nextTick } from 'vue'
import * as d3 from 'd3'
import { IconZoomIn, IconZoomOut, IconRefresh, IconBranch } from '@arco-design/web-vue/es/icon'
import { useSessionStore } from '@/stores/session'
import { useDialogStore } from '@/stores/dialog'
import type { DialogTreeNode } from '@/types'

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
let tree: d3.TreeLayout<DialogTreeNode>

// 响应式数据
const width = ref(800)
const height = ref(600)

// 计算属性
const currentSession = computed(() => sessionStore.currentSession)
const dialogTree = computed(() => dialogStore.dialogTree)
const hasDialogTree = computed(() => dialogTree.value && dialogTree.value.children && dialogTree.value.children.length > 0)

// 监听当前会话变化
watch(() => sessionStore.currentSessionId, async (newSessionId) => {
  if (newSessionId) {
    await dialogStore.fetchDialogTree(newSessionId)
    await nextTick()
    renderTree()
  }
}, { immediate: true })

// 监听对话树数据变化
watch(dialogTree, () => {
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
  tree = d3.tree<DialogTreeNode>()
    .size([height.value - 100, width.value - 200])
}

// 渲染树形图
const renderTree = () => {
  if (!g || !dialogTree.value) return

  // 清除之前的内容
  g.selectAll('*').remove()

  // 创建层次数据
  const root = d3.hierarchy(dialogTree.value)
  
  // 应用树布局
  tree(root)

  // 绘制连接线
  const links = g.selectAll('.link')
    .data(root.links())
    .enter()
    .append('path')
    .attr('class', 'link')
    .attr('d', d3.linkHorizontal<d3.HierarchyLink<DialogTreeNode>, d3.HierarchyPointNode<DialogTreeNode>>()
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
    .attr('transform', d => `translate(${d.y + 100},${d.x + 50})`)
    .style('cursor', 'pointer')
    .on('click', handleNodeClick)

  // 添加节点圆圈
  nodes.append('circle')
    .attr('r', 8)
    .style('fill', d => d.data.type === 'user' ? '#1890ff' : '#52c41a')
    .style('stroke', '#fff')
    .style('stroke-width', 2)

  // 添加节点文本
  nodes.append('text')
    .attr('dy', '.35em')
    .attr('x', d => d.children ? -13 : 13)
    .style('text-anchor', d => d.children ? 'end' : 'start')
    .style('font-size', '12px')
    .style('fill', '#333')
    .text(d => {
      const text = d.data.content || d.data.title || 'Conversation'
      return text.length > 20 ? text.substring(0, 20) + '...' : text
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
const handleNodeClick = (event: MouseEvent, d: d3.HierarchyPointNode<DialogTreeNode>) => {
  console.log('节点被点击:', d.data)
  // 这里可以添加节点点击的逻辑，比如显示详细信息或开始新的对话分支
  if (d.data.conversationId) {
    dialogStore.setSelectedConversation(d.data.conversationId)
  }
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