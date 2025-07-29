<template>
  <div class="right-panel">
    <ChatPanel />
  </div>
</template>

<script setup lang="ts">
import ChatPanel from '@/components/ChatPanel.vue'
</script>

<style lang="less" scoped>
.right-panel {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: #fff;
  overflow: hidden;
}
</style>