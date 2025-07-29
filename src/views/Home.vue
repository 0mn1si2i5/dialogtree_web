<template>
  <div class="layout-container" :style="cssVariables">
    <!-- 左侧边栏 -->
    <aside 
      class="sidebar-area"
      :class="{ 'sidebar-hidden': !sidebarVisible }"
    >
      <div v-show="sidebarVisible" class="sidebar-content">
        <LeftSidebar />
        
        <!-- 左边栏隐藏按钮 -->
        <div 
          class="sidebar-hide-btn"
          @click="toggleSidebar"
          title="隐藏侧边栏"
        >
          <icon-left />
        </div>
      </div>
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
      <MainContent />
    </main>

    <!-- 右侧聊天面板 -->
    <section class="chat-area">
      <RightPanel />
      
      <!-- 右边栏隐藏按钮 -->
      <div 
        v-show="chatPanelMode !== 'hidden'"
        class="chat-panel-hide-btn"
        @click="hideChatPanel"
        title="隐藏聊天面板"
      >
        <icon-right />
      </div>
    </section>

    <!-- 右边栏隐藏时的恢复按钮 -->
    <div 
      v-show="chatPanelMode === 'hidden'" 
      class="chat-panel-toggle-btn"
      @click="restoreChatPanel"
      title="显示聊天面板"
    >
      <icon-left />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useSessionStore, useDialogStore, useLayoutStore, useLocaleStore } from '@/stores'
import { IconRight, IconLeft } from '@arco-design/web-vue/es/icon'
import LeftSidebar from '@/components/layout/LeftSidebar.vue'
import MainContent from '@/components/layout/MainContent.vue'
import RightPanel from '@/components/layout/RightPanel.vue'

// 使用stores
const sessionStore = useSessionStore()
const dialogStore = useDialogStore()
const layoutStore = useLayoutStore()
const localeStore = useLocaleStore()

// 计算属性
const sidebarVisible = computed(() => layoutStore.sidebarVisible)
const showTreeArea = computed(() => layoutStore.showTreeArea)
const cssVariables = computed(() => layoutStore.cssVariables)
const chatPanelMode = computed(() => layoutStore.chatPanelMode)

// 切换侧边栏
function toggleSidebar() {
  layoutStore.toggleSidebar()
}

// 恢复聊天面板
function restoreChatPanel() {
  layoutStore.setChatPanelMode('normal')
}

// 隐藏聊天面板
function hideChatPanel() {
  layoutStore.setChatPanelMode('hidden')
}

// 初始化数据
onMounted(async () => {
  try {
    // 初始化locale
    localeStore.initialize()
    
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
  transition: grid-template-columns 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.sidebar-area {
  grid-area: sidebar;
  background-color: #fff;
  border-right: 1px solid #e5e5e5;
  overflow: hidden;
  position: relative;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  
  &.sidebar-hidden {
    border-right: none;
    background-color: transparent;
  }
}

.sidebar-content {
  width: 100%;
  height: 100%;
  position: relative;
}

.tree-area {
  grid-area: tree;
  background-color: #fafafa;
  overflow: hidden;
  position: relative;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.chat-area {
  grid-area: chat;
  background-color: #fff;
  border-left: 1px solid #e5e5e5;
  overflow: hidden;
  position: relative;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

// 左边栏恢复按钮
.sidebar-toggle-btn {
  position: fixed;
  top: 50%;
  left: -20px; // 只露出一半
  transform: translateY(-50%);
  width: 40px;
  height: 40px;
  background: #fff;
  border: 1px solid #e5e5e5;
  border-radius: 20px;
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 1000;
  color: #666;
  transition: all 0.3s ease;
  
  &:hover {
    left: -15px; // 悬停时露出更多
    background: #f5f5f5;
    color: #1890ff;
    border-color: #1890ff;
    box-shadow: 2px 0 12px rgba(24, 144, 255, 0.2);
  }
  
  &:active {
    transform: translateY(-50%) scale(0.95);
  }
}

// 右边栏恢复按钮
.chat-panel-toggle-btn {
  position: fixed;
  top: 50%;
  right: -20px; // 只露出一半
  transform: translateY(-50%);
  width: 40px;
  height: 40px;
  background: #fff;
  border: 1px solid #e5e5e5;
  border-radius: 20px;
  box-shadow: -2px 0 8px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 1000;
  color: #666;
  transition: all 0.3s ease;
  
  &:hover {
    right: -15px; // 悬停时露出更多
    background: #f5f5f5;
    color: #1890ff;
    border-color: #1890ff;
    box-shadow: -2px 0 12px rgba(24, 144, 255, 0.2);
  }
  
  &:active {
    transform: translateY(-50%) scale(0.95);
  }
}

// 左边栏隐藏按钮
.sidebar-hide-btn {
  position: absolute;
  top: 50%;
  right: -20px; // 只露出一半
  transform: translateY(-50%);
  width: 40px;
  height: 40px;
  background: #fff;
  border: 1px solid #e5e5e5;
  border-radius: 20px;
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #666;
  opacity: 0.3;
  transition: all 0.3s ease;
  
  &:hover {
    right: -15px; // 悬停时露出更多
    opacity: 1;
    background: #f5f5f5;
    color: #1890ff;
    border-color: #1890ff;
    box-shadow: 2px 0 12px rgba(24, 144, 255, 0.2);
  }
  
  &:active {
    transform: translateY(-50%) scale(0.95);
  }
}

// 右边栏隐藏按钮
.chat-panel-hide-btn {
  position: absolute;
  top: 50%;
  left: -20px; // 只露出一半
  transform: translateY(-50%);
  width: 40px;
  height: 40px;
  background: #fff;
  border: 1px solid #e5e5e5;
  border-radius: 20px;
  box-shadow: -2px 0 8px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #666;
  opacity: 0.3;
  z-index: 900; // 低于左边栏恢复按钮(1000)，确保左边栏按钮优先
  transition: all 0.3s ease;
  
  &:hover {
    left: -15px; // 悬停时露出更多
    opacity: 1;
    background: #f5f5f5;
    color: #1890ff;
    border-color: #1890ff;
    box-shadow: -2px 0 12px rgba(24, 144, 255, 0.2);
  }
  
  &:active {
    transform: translateY(-50%) scale(0.95);
  }
}

// 展开模式下的布局调整（已移除，现在由CSS变量动态控制）
// .layout-container:has(.chat-area[data-mode="expanded"]) {
//   grid-template-areas: "chat";
//   grid-template-columns: 1fr;
// }
</style>