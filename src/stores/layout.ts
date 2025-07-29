import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { PanelMode, LayoutState } from '@/types'

export const useLayoutStore = defineStore('layout', () => {
  // ===== 状态 =====
  const sidebarVisible = ref(true)
  const chatPanelMode = ref<PanelMode>('normal')

  // ===== 计算属性 =====
  const layoutState = computed<LayoutState>(() => ({
    sidebarVisible: sidebarVisible.value,
    chatPanelMode: chatPanelMode.value,
  }))

  // 计算CSS变量值
  const cssVariables = computed(() => ({
    '--sidebar-width': sidebarVisible.value ? '280px' : '0px',
    '--chat-panel-width': getChatPanelWidth(),
  }))

  // 是否显示对话树区域
  const showTreeArea = computed(() => 
    chatPanelMode.value !== 'expanded'
  )

  // ===== Actions =====

  // 获取聊天面板宽度
  function getChatPanelWidth(): string {
    switch (chatPanelMode.value) {
      case 'hidden':
        return 'var(--chat-panel-hidden)'
      case 'normal':
        return 'var(--chat-panel-normal)'
      case 'expanded':
        // 根据左边栏状态动态计算展开宽度
        if (sidebarVisible.value) {
          // 左边栏显示时，右边栏扩展到与左边栏齐平（100% - 280px）
          return 'calc(100% - 280px)'
        } else {
          // 左边栏隐藏时，右边栏占满全屏（100%）
          return '100%'
        }
      default:
        return 'var(--chat-panel-normal)'
    }
  }

  // 切换侧边栏显示/隐藏
  function toggleSidebar() {
    sidebarVisible.value = !sidebarVisible.value
  }

  // 设置侧边栏可见性
  function setSidebarVisible(visible: boolean) {
    sidebarVisible.value = visible
  }

  // 切换聊天面板模式（三档循环切换）
  function toggleChatPanelMode() {
    switch (chatPanelMode.value) {
      case 'normal':
        chatPanelMode.value = 'expanded'
        // 不再自动隐藏侧边栏，保持用户的选择
        break
      case 'expanded':
        chatPanelMode.value = 'hidden'
        // 不再自动显示侧边栏，保持用户的选择
        break
      case 'hidden':
        chatPanelMode.value = 'normal'
        break
    }
  }

  // 设置聊天面板模式
  function setChatPanelMode(mode: PanelMode) {
    chatPanelMode.value = mode
    // 不再自动修改侧边栏状态，保持用户的选择
  }

  // 重置布局到默认状态
  function resetLayout() {
    sidebarVisible.value = true
    chatPanelMode.value = 'normal'
  }

  // 获取聊天面板按钮图标
  function getChatPanelButtonIcon(): string {
    switch (chatPanelMode.value) {
      case 'hidden':
        return 'icon-right' // 显示面板
      case 'normal':
        return 'icon-fullscreen' // 展开面板
      case 'expanded':
        return 'icon-fullscreen-exit' // 退出展开
      default:
        return 'icon-right'
    }
  }

  // 获取聊天面板按钮提示文本
  function getChatPanelButtonTooltip(): string {
    switch (chatPanelMode.value) {
      case 'hidden':
        return '显示聊天面板'
      case 'normal':
        return '展开聊天面板'
      case 'expanded':
        return '恢复正常模式'
      default:
        return '切换面板模式'
    }
  }

  return {
    // 状态
    sidebarVisible,
    chatPanelMode,
    
    // 计算属性
    layoutState,
    cssVariables,
    showTreeArea,
    
    // Actions
    toggleSidebar,
    setSidebarVisible,
    toggleChatPanelMode,
    setChatPanelMode,
    resetLayout,
    getChatPanelButtonIcon,
    getChatPanelButtonTooltip,
  }
})