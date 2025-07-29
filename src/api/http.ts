import axios, { type AxiosInstance, type AxiosRequestConfig, type AxiosResponse } from 'axios'
import type { ApiResponse } from '@/types'

// 创建axios实例
const http: AxiosInstance = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// 请求拦截器
http.interceptors.request.use(
  (config) => {
    // 这里可以添加认证token等
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 响应拦截器
http.interceptors.response.use(
  (response: AxiosResponse<ApiResponse>) => {
    const { data } = response
    
    // 统一处理API响应
    if (data.code === 0) {
      return response
    } else {
      // 业务错误
      console.error('API Error:', data.msg)
      throw new Error(data.msg || '请求失败')
    }
  },
  (error) => {
    // 网络错误或其他错误
    console.error('Network Error:', error.message)
    
    let message = '网络错误，请检查连接'
    if (error.response) {
      message = `请求失败: ${error.response.status}`
    } else if (error.request) {
      message = '网络连接超时'
    }
    
    throw new Error(message)
  }
)

export default http