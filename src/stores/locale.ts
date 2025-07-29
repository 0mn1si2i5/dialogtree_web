import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'

export const useLocaleStore = defineStore('locale', () => {
  // 状态
  const currentLocale = ref<string>('zh-CN')
  
  // 初始化
  function initialize() {
    const savedLocale = localStorage.getItem('locale')
    if (savedLocale && ['zh-CN', 'en-US'].includes(savedLocale)) {
      currentLocale.value = savedLocale
    } else {
      // 根据浏览器语言自动选择
      const browserLocale = navigator.language
      currentLocale.value = browserLocale.startsWith('zh') ? 'zh-CN' : 'en-US'
    }
  }
  
  // 切换语言
  function setLocale(locale: string) {
    if (!['zh-CN', 'en-US'].includes(locale)) {
      console.warn(`Unsupported locale: ${locale}`)
      return
    }
    
    currentLocale.value = locale
    localStorage.setItem('locale', locale)
  }
  
  // 切换语言（中英文互换）
  function toggleLocale() {
    const newLocale = currentLocale.value === 'zh-CN' ? 'en-US' : 'zh-CN'
    setLocale(newLocale)
  }
  
  // 获取当前语言的显示名称
  function getCurrentLocaleName(): string {
    return currentLocale.value === 'zh-CN' ? '中文' : 'English'
  }
  
  // 获取切换按钮显示的文本
  function getToggleButtonText(): string {
    return currentLocale.value === 'zh-CN' ? '' : ''
  }
  
  return {
    // 状态
    currentLocale,
    
    // Actions
    initialize,
    setLocale,
    toggleLocale,
    getCurrentLocaleName,
    getToggleButtonText
  }
})