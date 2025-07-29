<template>
  <div class="main-content">
    <DialogTreeVisualization />
  </div>
</template>

<script setup lang="ts">
import DialogTreeVisualization from '@/components/DialogTreeVisualization.vue'
</script>

<style lang="less" scoped>
.main-content {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: #fafafa;
  overflow: hidden;
}
</style>