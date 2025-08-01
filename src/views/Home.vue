<template>
  <div class="layout-container">
    <!-- 顶部Header -->
    <AppHeader @show-tutorial="handleShowTutorial" />
    
    <!-- 下方主要内容区域 -->
    <div class="main-container" :style="cssVariables">
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
        
        <!-- 右边栏最大化/恢复按钮 -->
        <div 
          v-show="chatPanelMode !== 'hidden'"
          class="chat-panel-maximize-btn"
          @click="toggleMaximize"
          :title="chatPanelMode === 'normal' ? '最大化聊天面板' : '恢复正常大小'"
        >
          <icon-left v-if="chatPanelMode === 'normal'" />
          <icon-right v-else />
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
  </div>

  <!-- 教学Modal -->
  <TutorialModal
    v-model:visible="showTutorial"
    @complete="handleTutorialComplete"
    @skip="handleTutorialSkip"
  />
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useSessionStore, useDialogStore, useLayoutStore, useLocaleStore } from '@/stores'
import { IconRight, IconLeft } from '@arco-design/web-vue/es/icon'
import AppHeader from '@/components/layout/AppHeader.vue'
import LeftSidebar from '@/components/layout/LeftSidebar.vue'
import MainContent from '@/components/layout/MainContent.vue'
import RightPanel from '@/components/layout/RightPanel.vue'
import TutorialModal from '@/components/TutorialModal.vue'
import { shouldShowTutorial, markTutorialCompleted, markTutorialSkipped, markTutorialShown } from '@/utils/tutorial'

// 使用stores
const sessionStore = useSessionStore()
const dialogStore = useDialogStore()
const layoutStore = useLayoutStore()
const localeStore = useLocaleStore()

// 教学Modal状态
const showTutorial = ref(false)

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

// 切换聊天面板最大化状态
function toggleMaximize() {
  if (chatPanelMode.value === 'normal') {
    layoutStore.setChatPanelMode('expanded')
  } else if (chatPanelMode.value === 'expanded') {
    layoutStore.setChatPanelMode('normal')
  }
}

// 教学Modal事件处理
function handleTutorialComplete() {
  markTutorialCompleted()
  showTutorial.value = false
}

function handleTutorialSkip() {
  markTutorialSkipped()
  showTutorial.value = false
}

function handleShowTutorial() {
  showTutorial.value = true
}

// 初始化数据
onMounted(async () => {
  try {
    // 初始化locale
    localeStore.initialize()
    
    // 初始化session和category数据
    await sessionStore.initialize()
    
    // 如果有会话，加载第一个会话的对话树
    if (sessionStore.sessions && sessionStore.sessions.length > 0) {
      const firstSession = sessionStore.sessions[0]
      if (firstSession && firstSession.id) {
        sessionStore.setCurrentSession(firstSession.id)
        await dialogStore.fetchDialogTree(firstSession.id)
      }
    }
    
    // 检查是否需要显示教学Modal
    if (shouldShowTutorial()) {
      // 延迟一下显示，让页面先渲染完成
      setTimeout(() => {
        showTutorial.value = true
        markTutorialShown()
      }, 1000)
    }
  } catch (error) {
    console.error('Failed to initialize app:', error)
  }
})
</script>

<style lang="less" scoped>
.layout-container {
  display: flex;
  flex-direction: column;
  width: 100vw;
  height: 100vh;
  background-color: #f5f5f5;
  overflow: hidden;
}

.main-container {
  display: grid;
  grid-template-areas: "sidebar tree chat";
  grid-template-columns: var(--sidebar-width) 1fr var(--chat-panel-width);
  flex: 1;
  overflow: hidden;
  transition: grid-template-columns 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.sidebar-area {
  grid-area: sidebar;
  background-color: #fff;
  border-right: 1px solid #f0f0f0;
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
  border-left: 1px solid #f0f0f0;
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

// 右边栏最大化/恢复按钮（原来的隐藏按钮位置）
.chat-panel-maximize-btn {
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