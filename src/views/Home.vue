<template>
  <div class="layout-container" :class="{ 'is-resizing': isResizing }">
    <!-- 左侧会话栏 -->
    <div 
      class="sidebar-container" 
      :class="{ 'sidebar-hidden': leftSidebarHidden }"
      :style="{ width: leftSidebarHidden ? '40px' : '280px' }"
    >
      <!-- 切换按钮 -->
      <div class="sidebar-toggle" @click="toggleLeftSidebar">
        <icon-menu-unfold v-if="leftSidebarHidden" />
        <icon-menu-fold v-else />
      </div>
      
      <SessionSidebar v-if="!leftSidebarHidden" />
    </div>
    
    <!-- 中间对话树可视化 -->
    <div 
      class="tree-container"
      :style="{ 
        left: leftSidebarHidden ? '40px' : '280px',
        right: rightPanelHidden ? '40px' : `${rightPanelWidth}px`
      }"
    >
      <DialogTreeVisualization />
    </div>
    
    <!-- 右侧聊天面板 -->
    <div 
      class="chat-container" 
      :class="{ 
        'chat-hidden': rightPanelHidden,
        'chat-fullscreen': rightPanelFullscreen 
      }"
      :style="{ 
        width: rightPanelHidden ? '40px' : `${rightPanelWidth}px` 
      }"
    >
      <!-- 右侧面板控制按钮 -->
      <div class="panel-controls">
        <div class="resize-handle" 
             v-if="!rightPanelHidden && !rightPanelFullscreen"
             @mousedown="startResize">
          <div class="resize-icon">
            <icon-drag-arrow />
          </div>
        </div>
        
        <div class="control-buttons">
          <a-button 
            v-if="rightPanelFullscreen" 
            size="small" 
            @click="toggleFullscreen"
            title="退出全屏"
          >
            <icon-fullscreen-exit />
          </a-button>
          
          <a-button 
            v-if="!rightPanelHidden && !rightPanelFullscreen" 
            size="small" 
            @click="toggleFullscreen"
            title="全屏"
          >
            <icon-fullscreen />
          </a-button>
          
          <a-button 
            size="small" 
            @click="toggleRightPanel"
            :title="rightPanelHidden ? '显示聊天面板' : '隐藏聊天面板'"
          >
            <icon-right v-if="rightPanelHidden" />
            <icon-left v-else />
          </a-button>
        </div>
      </div>
      
      <ChatPanel v-if="!rightPanelHidden" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { 
  IconMenuFold, 
  IconMenuUnfold, 
  IconFullscreen, 
  IconFullscreenExit,
  IconLeft,
  IconRight,
  IconDragArrow
} from '@arco-design/web-vue/es/icon'
import SessionSidebar from '@/components/SessionSidebar.vue'
import DialogTreeVisualization from '@/components/DialogTreeVisualization.vue'
import ChatPanel from '@/components/ChatPanel.vue'

// 响应式数据
const leftSidebarHidden = ref(false)
const rightPanelHidden = ref(false)
const rightPanelFullscreen = ref(false)
const rightPanelWidth = ref(400) // 默认400px

// 拖拽相关
const isResizing = ref(false)

// 方法
const toggleLeftSidebar = () => {
  leftSidebarHidden.value = !leftSidebarHidden.value
}

const toggleRightPanel = () => {
  if (rightPanelFullscreen.value) {
    rightPanelFullscreen.value = false
  }
  rightPanelHidden.value = !rightPanelHidden.value
}

const toggleFullscreen = () => {
  rightPanelFullscreen.value = !rightPanelFullscreen.value
  if (rightPanelFullscreen.value) {
    rightPanelHidden.value = false
  }
}

// 拖拽缩放功能
const startResize = (event: MouseEvent) => {
  isResizing.value = true
  event.preventDefault()
  
  document.addEventListener('mousemove', handleResize)
  document.addEventListener('mouseup', stopResize)
}

const handleResize = (event: MouseEvent) => {
  if (!isResizing.value) return
  
  const containerWidth = window.innerWidth
  const newWidth = containerWidth - event.clientX
  
  // 限制宽度范围：20% - 65%
  const minWidth = containerWidth * 0.2
  const maxWidth = containerWidth * 0.65
  
  rightPanelWidth.value = Math.max(minWidth, Math.min(maxWidth, newWidth))
}

const stopResize = () => {
  isResizing.value = false
  document.removeEventListener('mousemove', handleResize)
  document.removeEventListener('mouseup', stopResize)
}

// 生命周期
onMounted(() => {
  // 监听窗口大小变化，动态调整面板宽度
  const handleWindowResize = () => {
    const containerWidth = window.innerWidth
    const maxWidth = containerWidth * 0.65
    if (rightPanelWidth.value > maxWidth) {
      rightPanelWidth.value = maxWidth
    }
  }
  
  window.addEventListener('resize', handleWindowResize)
  
  onUnmounted(() => {
    window.removeEventListener('resize', handleWindowResize)
  })
})
</script>

<style lang="less" scoped>
.layout-container {
  position: relative;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
}

.sidebar-container {
  position: fixed;
  top: 0;
  left: 0;
  height: 100vh;
  background: var(--bg-secondary);
  border-right: 1px solid var(--border-color-light);
  transition: width 0.3s ease;
  z-index: 100;
  
  &.sidebar-hidden {
    .sidebar-toggle {
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
  }
  
  .sidebar-toggle {
    position: absolute;
    top: 12px;
    right: 8px;
    z-index: 101;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--bg-primary);
    border: 1px solid var(--border-color-light);
    border-radius: 4px;
    cursor: pointer;
    color: var(--text-primary);
    
    &:hover {
      background: var(--bg-tertiary);
    }
  }
}

.tree-container {
  position: fixed;
  top: 0;
  height: 100vh;
  background: var(--bg-primary);
  transition: left 0.3s ease, right 0.3s ease;
  z-index: 50;
}

.chat-container {
  position: fixed;
  top: 0;
  right: 0;
  height: 100vh;
  background: var(--bg-secondary);
  border-left: 1px solid var(--border-color-light);
  transition: width 0.3s ease;
  z-index: 100;
  
  &.chat-hidden {
    .panel-controls {
      .control-buttons {
        position: absolute;
        top: 12px;
        left: 4px;
        right: auto;
        width: 32px;
      }
    }
  }
  
  &.chat-fullscreen {
    width: 100vw !important;
    left: 0 !important;
    z-index: 200;
  }
  
  .panel-controls {
    position: relative;
    height: 56px;
    border-bottom: 1px solid var(--border-color-light);
    display: flex;
    align-items: center;
    
    .resize-handle {
      position: absolute;
      left: 0;
      top: 0;
      width: 8px;
      height: 100%;
      background: transparent;
      cursor: ew-resize;
      z-index: 101;
      display: flex;
      align-items: center;
      justify-content: center;
      
      .resize-icon {
        width: 4px;
        height: 40px;
        background: var(--border-color-light);
        border-radius: 2px;
        display: flex;
        align-items: center;
        justify-content: center;
        opacity: 0.6;
        transition: all 0.2s ease;
        
        svg {
          width: 12px;
          height: 12px;
          color: var(--text-secondary);
          transform: rotate(90deg);
        }
      }
      
      &:hover .resize-icon {
        background: var(--primary-color);
        opacity: 1;
        height: 60px;
        
        svg {
          color: white;
        }
      }
    }
    
    .control-buttons {
      position: absolute;
      top: 12px;
      right: 12px;
      display: flex;
      gap: 8px;
    }
  }
}

// 拖拽时的视觉反馈
.layout-container.is-resizing {
  cursor: ew-resize;
  user-select: none;
  
  .tree-container,
  .chat-container {
    pointer-events: none;
  }
}

// 全屏模式下的样式适配
.chat-container.chat-fullscreen {
  // ChatPanel 内部元素需要重新计算尺寸
  :deep(.chat-panel-content) {
    height: calc(100vh - 56px); // 减去控制栏高度
    max-width: 100vw;
  }
  
  :deep(.message-list) {
    height: calc(100vh - 200px); // 减去控制栏和输入区高度
  }
  
  :deep(.input-area) {
    max-width: calc(100vw - 40px);
  }
}
</style> 