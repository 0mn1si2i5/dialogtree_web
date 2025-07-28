<template>
  <div class="layout-container">
    <!-- 左侧边栏 - Session列表和Category -->
    <aside class="sidebar">
      <SessionSidebar />
    </aside>
    
    <!-- 主要内容区域 -->
    <div class="main-content">
      <!-- 中间区域 - D3.js对话树可视化 -->
      <div class="tree-panel">
        <DialogTreeVisualization />
      </div>
      
      <!-- 右侧面板 - 聊天界面 -->
      <div class="chat-panel">
        <ChatPanel />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import SessionSidebar from '@/components/SessionSidebar.vue'
import DialogTreeVisualization from '@/components/DialogTreeVisualization.vue'
import ChatPanel from '@/components/ChatPanel.vue'
</script>

<style lang="less" scoped>
// 样式已在 global.less 中定义
</style> 