<template>
  <div class="app-header">
    <!-- 左侧Logo区域 -->
    <div class="header-left">
      <div class="logo-content">
        <div class="logo-icon">
          <img src="/dt-logo.png" alt="DialogTree Logo" />
        </div>
        <span class="logo-text">DialogTree</span>
      </div>
    </div>
    
    <!-- 右侧按钮区域 -->
    <div class="header-right">
      <!-- 语言切换按钮 -->
      <a-button @click="toggleLanguage" type="text" size="small" class="language-toggle">
        <template #icon>
          <icon-language />
        </template>
        {{ localeStore.getToggleButtonText() }}
      </a-button>
      
      <!-- 帮助按钮 -->
      <a-button
        type="text"
        size="small"
        class="help-button"
        @click="emit('show-tutorial')"
        :title="$t('tutorial.nav.help')"
      >
        <template #icon>
          <icon-question-circle />
        </template>
      </a-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useLocaleStore } from '@/stores'
import { IconLanguage, IconQuestionCircle } from '@arco-design/web-vue/es/icon'

// 定义emit接口
const emit = defineEmits<{
  'show-tutorial': []
}>()

// 使用stores和i18n
const localeStore = useLocaleStore()
const { t, locale } = useI18n()

// 切换语言
function toggleLanguage() {
  localeStore.toggleLocale()
  locale.value = localeStore.currentLocale
}
</script>

<style lang="less" scoped>
@import url('https://fonts.googleapis.com/css2?family=Oleo+Script:wght@400;700&display=swap');

.app-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 60px;
  padding: 0 16px;
  background-color: #fff;
  border-bottom: 1px solid #f0f0f0;
  flex-shrink: 0;
  box-shadow: 0 1px 5px rgba(0, 0, 0, 0.04);
  position: relative;
  z-index: 10;
}

.header-left {
  display: flex;
  align-items: flex-start;
  padding-top: 8px;
}

.logo-content {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.logo-icon {
  width: 56px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  margin-top: 10px; /* 让logo上部与header顶部有margin */
  margin-left: 18px;
  
  img {
    width: 100%;
    height: 100%;
    object-fit: contain;
    border-radius: 50%;
  }
}

.logo-text {
  font-size: 32px;
  font-weight: 400;
  color: #1660ff;
  font-family: 'Oleo Script', cursive, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  margin-top: 8px; /* 让文本与logo中心对齐 */
  letter-spacing: 0.5px; /* 轻微增加字母间距 */
}

.header-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.help-button {
  flex-shrink: 0;
  
  &:hover {
    background-color: #f5f5f5;
  }
}
</style>