import { createI18n } from 'vue-i18n'
import zhCN from './zh-CN'
import enUS from './en-US'

// 获取默认语言
function getDefaultLocale(): string {
  // 从localStorage获取用户选择的语言
  const savedLocale = localStorage.getItem('locale')
  if (savedLocale && ['zh-CN', 'en-US'].includes(savedLocale)) {
    return savedLocale
  }
  
  // 如果没有保存的语言，根据浏览器语言自动选择
  const browserLocale = navigator.language
  if (browserLocale.startsWith('zh')) {
    return 'zh-CN'
  }
  return 'en-US'
}

const messages = {
  'zh-CN': zhCN,
  'en-US': enUS
}

const i18n = createI18n({
  locale: getDefaultLocale(),
  fallbackLocale: 'zh-CN',
  messages,
  legacy: false // 使用 Composition API 模式
})

export default i18n