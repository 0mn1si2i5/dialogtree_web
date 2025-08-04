import { defineStore } from 'pinia'
import { ref } from 'vue'
import { detectBrowserLanguage, detectLanguageFromAcceptHeader, type Language } from '@/utils/languageDetector'
import i18n from '@/locales'

export const useLocaleStore = defineStore('locale', () => {
  // 状态
  const currentLocale = ref<string>('zh-CN')
  
  // 初始化
  function initialize() {
    // 每次应用启动都重新检测浏览器语言，不依赖localStorage
    const detectionResult = detectBrowserLanguage()
    const detectedLanguage = detectionResult.language
    
    // 检查是否与保存的语言不同
    const savedLocale = localStorage.getItem('locale')
    if (savedLocale !== detectedLanguage) {
      // 自动切换到检测到的语言
      currentLocale.value = detectedLanguage
      localStorage.setItem('locale', detectedLanguage)
    } else if (savedLocale) {
      // 语言没有变化，使用保存的语言
      currentLocale.value = savedLocale
    } else {
      // 首次访问
      currentLocale.value = detectedLanguage
      localStorage.setItem('locale', detectedLanguage)
    }
    
    // 确保i18n实例的locale与store保持同步
    i18n.global.locale.value = currentLocale.value as any
  }
  
  // 切换语言
  function setLocale(locale: string) {
    if (!['zh-CN', 'en-US'].includes(locale)) {
      console.warn(`Unsupported locale: ${locale}`)
      return
    }
    
    currentLocale.value = locale
    localStorage.setItem('locale', locale)
    
    // 同步更新i18n实例的locale
    i18n.global.locale.value = locale as any
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
  
  // 根据Accept-Language请求头检测并设置语言
  function detectAndSetLanguageFromRequest(acceptLanguageHeader?: string): Language {
    const detectionResult = detectLanguageFromAcceptHeader(acceptLanguageHeader)
    
    // 只有检测结果与当前语言不同时才切换
    if (detectionResult.language !== currentLocale.value) {
      setLocale(detectionResult.language)
    }
    
    return detectionResult.language
  }
  
  
  return {
    // 状态
    currentLocale,
    
    // Actions
    initialize,
    setLocale,
    toggleLocale,
    getCurrentLocaleName,
    getToggleButtonText,
    detectAndSetLanguageFromRequest
  }
})