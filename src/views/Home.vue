<template>
  <div class="layout-container" :style="cssVariables">
    <!-- 左侧边栏 -->
    <aside 
      v-show="sidebarVisible" 
      class="sidebar-area"
    >
      <SessionSidebar />
    </aside>

    <!-- 左边栏隐藏时的恢复按钮 -->
    <div 
      v-show="!sidebarVisible" 
      class="sidebar-toggle-btn"
      @click="toggleSidebar"
      title="显示侧边栏"
    >
      <icon-right />
    </div>

    <!-- 中央对话树区域 -->
    <main 
      v-show="showTreeArea" 
      class="tree-area"
    >
      <DialogTreeVisualization />
    </main>

    <!-- 右侧聊天面板 -->
    <section class="chat-area">
      <ChatPanel />
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useSessionStore, useDialogStore, useLayoutStore } from '@/stores'
import { IconRight } from '@arco-design/web-vue/es/icon'
import SessionSidebar from '@/components/SessionSidebar.vue'
import DialogTreeVisualization from '@/components/DialogTreeVisualization.vue'
import ChatPanel from '@/components/ChatPanel.vue'

// 使用stores
const sessionStore = useSessionStore()
const dialogStore = useDialogStore()
const layoutStore = useLayoutStore()

// 计算属性
const sidebarVisible = computed(() => layoutStore.sidebarVisible)
const showTreeArea = computed(() => layoutStore.showTreeArea)
const cssVariables = computed(() => layoutStore.cssVariables)

// 切换侧边栏
function toggleSidebar() {
  layoutStore.toggleSidebar()
}

// 初始化数据
onMounted(async () => {
  try {
    // 初始化session和category数据
    await sessionStore.initialize()
    
    // 如果有会话，加载第一个会话的对话树
    if (sessionStore.sessions.length > 0) {
      const firstSession = sessionStore.sessions[0]
      sessionStore.setCurrentSession(firstSession.id)
      await dialogStore.fetchDialogTree(firstSession.id)
    }
  } catch (error) {
    console.error('Failed to initialize app:', error)
  }
})
</script>

<style lang="less" scoped>
.layout-container {
  display: grid;
  grid-template-areas: "sidebar tree chat";
  grid-template-columns: var(--sidebar-width) 1fr var(--chat-panel-width);
  width: 100vw;
  height: 100vh;
  background-color: #f5f5f5;
  overflow: hidden;
}

.sidebar-area {
  grid-area: sidebar;
  background-color: #fff;
  border-right: 1px solid #e5e5e5;
  overflow: hidden;
}

.tree-area {
  grid-area: tree;
  background-color: #fafafa;
  overflow: hidden;
  position: relative;
}

.chat-area {
  grid-area: chat;
  background-color: #fff;
  border-left: 1px solid #e5e5e5;
  overflow: hidden;
}

// 左边栏恢复按钮
.sidebar-toggle-btn {
  position: fixed;
  top: 20px;
  left: 20px;
  width: 40px;
  height: 40px;
  background: #fff;
  border: 1px solid #e5e5e5;
  border-radius: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 1000;
  color: #666;
  transition: all 0.3s ease;
  
  &:hover {
    background: #f5f5f5;
    color: #1890ff;
    border-color: #1890ff;
    transform: scale(1.05);
  }
  
  &:active {
    transform: scale(0.95);
  }
}

// 展开模式下的布局调整
.layout-container:has(.chat-area[data-mode="expanded"]) {
  grid-template-areas: "chat";
  grid-template-columns: 1fr;
}
</style>