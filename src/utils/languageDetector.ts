/**
 * 基于浏览器请求头的语言检测工具
 * 根据 Accept-Language 请求头和 navigator.language 检测用户首选语言
 */

export type Language = 'zh-CN' | 'en-US'

export interface LanguageDetectionResult {
  language: Language
  confidence: number
  source: 'navigator' | 'accept-language' | 'default'
}

/**
 * 解析 Accept-Language 头部信息
 * @param acceptLanguage Accept-Language 字符串
 * @returns 解析后的语言优先级列表
 */
function parseAcceptLanguage(acceptLanguage: string): Array<{lang: string, quality: number}> {
  return acceptLanguage
    .split(',')
    .map(lang => {
      const [language, q = 'q=1'] = lang.trim().split(';')
      const quality = parseFloat(q.replace('q=', ''))
      return { lang: language.trim(), quality }
    })
    .sort((a, b) => b.quality - a.quality)
}

/**
 * 将语言代码映射到支持的语言
 * @param langCode 语言代码
 * @returns 支持的语言或null
 */
function mapToSupportedLanguage(langCode: string): Language | null {
  const normalized = langCode.toLowerCase()
  
  // 中文相关
  if (normalized.startsWith('zh')) {
    if (normalized.includes('cn') || normalized.includes('hans') || normalized === 'zh') {
      return 'zh-CN'
    }
    // 其他中文变体也映射到简体中文
    return 'zh-CN'
  }
  
  // 英文相关
  if (normalized.startsWith('en')) {
    return 'en-US'
  }
  
  return null
}

/**
 * 基于浏览器信息检测用户首选语言
 * @returns 检测结果
 */
export function detectBrowserLanguage(): LanguageDetectionResult {
  // 1. 优先使用 navigator.language
  if (navigator.language) {
    const mappedLang = mapToSupportedLanguage(navigator.language)
    if (mappedLang) {
      return {
        language: mappedLang,
        confidence: 0.9,
        source: 'navigator'
      }
    }
  }
  
  // 2. 尝试使用 navigator.languages
  if (navigator.languages && navigator.languages.length > 0) {
    for (const lang of navigator.languages) {
      const mappedLang = mapToSupportedLanguage(lang)
      if (mappedLang) {
        return {
          language: mappedLang,
          confidence: 0.8,
          source: 'navigator'
        }
      }
    }
  }
  
  // 3. 默认返回中文
  return {
    language: 'zh-CN',
    confidence: 0.5,
    source: 'default'
  }
}

/**
 * 检测请求中的语言偏好（如果有 Accept-Language 头部）
 * @param acceptLanguageHeader Accept-Language 头部字符串
 * @returns 检测结果
 */
export function detectLanguageFromAcceptHeader(acceptLanguageHeader?: string): LanguageDetectionResult {
  if (acceptLanguageHeader) {
    try {
      const languages = parseAcceptLanguage(acceptLanguageHeader)
      
      for (const { lang, quality } of languages) {
        const mappedLang = mapToSupportedLanguage(lang)
        if (mappedLang) {
          return {
            language: mappedLang,
            confidence: quality,
            source: 'accept-language'
          }
        }
      }
    } catch (error) {
      // 静默处理解析错误，fallback到浏览器检测
    }
  }
  
  // 如果没有或解析失败，fallback 到浏览器检测
  return detectBrowserLanguage()
}

/**
 * 简化的语言检测，只返回语言代码
 * @returns 语言代码
 */
export function detectLanguageSimple(): Language {
  return detectBrowserLanguage().language
}

