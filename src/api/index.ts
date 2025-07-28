import axios, { type AxiosInstance, type AxiosRequestConfig, type AxiosResponse } from 'axios'
import type { ApiResponse } from '@/types'

// 创建axios实例
const createApiInstance = (): AxiosInstance => {
  const instance = axios.create({
    baseURL: '/api',
    timeout: 30000,
    headers: {
      'Content-Type': 'application/json'
    }
  })

  // 请求拦截器
  instance.interceptors.request.use(
    (config) => {
      // 这里可以添加认证token等
      return config
    },
    (error) => {
      return Promise.reject(error)
    }
  )

  // 响应拦截器
  instance.interceptors.response.use(
    (response) => {
      return response.data
    },
    (error) => {
      // 统一错误处理
      console.error('API Error:', error)
      
      if (error.response) {
        // 服务器响应了错误状态码
        const { status, data } = error.response
        switch (status) {
          case 401:
            // 未授权
            console.error('未授权访问')
            break
          case 403:
            // 禁止访问
            console.error('禁止访问')
            break
          case 404:
            // 不存在
            console.error('请求的资源不存在')
            break
          case 500:
            // 服务器错误
            console.error('服务器内部错误')
            break
          default:
            console.error(`请求失败: ${status}`)
        }
        
        return Promise.reject(data || error.response)
      } else if (error.request) {
        // 请求已发出但没有收到响应
        console.error('网络错误，请检查网络连接')
        return Promise.reject(new Error('网络错误'))
      } else {
        // 设置请求时触发了错误
        console.error('请求配置错误:', error.message)
        return Promise.reject(error)
      }
    }
  )

  return instance
}

// 导出API实例
export const api = createApiInstance()

// SSE工具函数
export const createSSEConnection = (
  url: string,
  data: any,
  onMessage: (content: string) => void,
  onComplete: () => void,
  onError: (error: Error) => void
): void => {
  fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data)
  })
  .then(response => {
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const reader = response.body?.getReader()
    const decoder = new TextDecoder()
    
    if (!reader) {
      throw new Error('Response body is null')
    }
    
    const readChunk = (): void => {
      reader.read().then(({ done, value }) => {
        if (done) {
          onComplete()
          return
        }
        
        const chunk = decoder.decode(value, { stream: true })
        const lines = chunk.split('\n')
        
        lines.forEach(line => {
          if (line.startsWith('data:')) {
            const content = line.substring(5).trim()
            if (content && content !== '[DONE]') {
              onMessage(content)
            }
          } else if (line.startsWith('event:message')) {
            // 处理事件类型
          }
        })
        
        readChunk()
      }).catch(error => {
        onError(error)
      })
    }
    
    readChunk()
  })
  .catch(error => {
    onError(error)
  })
} 