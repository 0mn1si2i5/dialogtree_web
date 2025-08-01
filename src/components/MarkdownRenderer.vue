<template>
  <div class="markdown-renderer">
    <MdPreview
      :modelValue="content"
      :theme="theme"
      :previewTheme="previewTheme"
      :codeTheme="codeTheme"
      :showCodeRowNumber="showLineNumbers"
      :preview="true"
      :htmlPreview="false"
      :editorId="editorId"
    />
  </div>
</template>

<script setup lang="ts">
import { MdPreview } from 'md-editor-v3'
import 'md-editor-v3/lib/preview.css'

interface Props {
  content: string
  theme?: 'light' | 'dark'
  previewTheme?: 'default' | 'github' | 'vuepress'
  codeTheme?: 'atom' | 'a11y' | 'github' | 'gradient' | 'kimbie' | 'paraiso' | 'qtcreator' | 'stackoverflow'
  showLineNumbers?: boolean
  editorId?: string
}

const props = withDefaults(defineProps<Props>(), {
  content: '',
  theme: 'light',
  previewTheme: 'default',
  codeTheme: 'github',
  showLineNumbers: true,
  editorId: () => `md-${Math.random().toString(36).substring(2, 9)}`
})
</script>

<style lang="less" scoped>
.markdown-renderer {
  width: 100%;
  background: transparent !important;
  
  // 强制覆盖所有可能的背景色
  :deep(.md-editor-preview),
  :deep(.md-editor-preview-wrapper),
  :deep(.md-editor-preview-area),
  :deep(.md-editor),
  :deep(.md-editor-content) {
    background: transparent !important;
    background-color: transparent !important;
    padding: 0;
  }
  
  :deep(.md-editor-preview) {
    // 调整标题样式适配对话框
    h1, h2, h3, h4, h5, h6 {
      margin-top: 1em;
      margin-bottom: 0.5em;
      
      &:first-child {
        margin-top: 0;
      }
    }
    
    // 调整段落间距
    p {
      margin-bottom: 0.8em;
      line-height: 1.6;
      
      &:last-child {
        margin-bottom: 0;
      }
    }
    
    // 代码块样式优化
    pre {
      margin: 0.8em 0;
      border-radius: 6px;
      
      &:first-child {
        margin-top: 0;
      }
      
      &:last-child {
        margin-bottom: 0;
      }
    }
    
    // 修复md-editor-v3代码块间隙和sticky定位问题
    .md-editor-code {
      summary.md-editor-code-head {
        margin-bottom: 0 !important;
        padding-bottom: 0 !important;
        // 禁用粘性定位，防止滚动时头部固定在顶部
        position: static !important;
        position: relative !important;
      }
      
      pre {
        margin-top: 0 !important;
        border-top: none !important;
      }
      
      // 确保details元素没有额外间距
      &[open] {
        summary {
          margin-bottom: 0 !important;
          // 确保展开时也不使用sticky定位
          position: static !important;
          position: relative !important;
        }
        
        pre {
          margin-top: 0 !important;
        }
      }
    }
    
    // 全局禁用md-editor-v3中所有可能的sticky定位
    .md-editor-code-head,
    summary.md-editor-code-head,
    details summary,
    .md-editor-code summary {
      position: static !important;
      position: relative !important;
      top: auto !important;
      z-index: auto !important;
      // 确保sticky属性被覆盖
      position: -webkit-static !important;
      position: -moz-static !important;
    }
    
    // 针对可能使用sticky的任何元素进行全面覆盖
    * {
      &[style*="sticky"],
      &[class*="sticky"] {
        position: static !important;
      }
    }
    
    // 行内代码样式
    code:not(pre code) {
      background-color: rgba(175, 184, 193, 0.2);
      padding: 0.2em 0.4em;
      border-radius: 3px;
      font-size: 0.85em;
    }
    
    // 列表样式优化
    ul, ol {
      margin: 0.8em 0;
      padding-left: 1.5em;
      
      &:first-child {
        margin-top: 0;
      }
      
      &:last-child {
        margin-bottom: 0;
      }
    }
    
    // 引用块样式
    blockquote {
      margin: 0.8em 0;
      padding: 0.5em 1em;
      border-left: 4px solid #ddd;
      background-color: rgba(0, 0, 0, 0.02);
      
      &:first-child {
        margin-top: 0;
      }
      
      &:last-child {
        margin-bottom: 0;
      }
    }
    
    // 表格样式
    table {
      margin: 0.8em 0;
      border-collapse: collapse;
      width: 100%;
      
      &:first-child {
        margin-top: 0;
      }
      
      &:last-child {
        margin-bottom: 0;
      }
      
      th, td {
        border: 1px solid #ddd;
        padding: 0.5em;
        text-align: left;
      }
      
      th {
        background-color: rgba(0, 0, 0, 0.05);
        font-weight: 600;
      }
    }
    
    // 数学公式样式
    .katex-display {
      margin: 1em 0;
      
      &:first-child {
        margin-top: 0;
      }
      
      &:last-child {
        margin-bottom: 0;
      }
    }
  }
}

// 用户消息中的markdown样式（蓝色主题）
.user-message .markdown-renderer {
  :deep(.md-editor-preview) {
    color: white;
    
    code:not(pre code) {
      background-color: rgba(255, 255, 255, 0.2);
      color: white;
    }
    
    blockquote {
      border-left-color: rgba(255, 255, 255, 0.3);
      background-color: rgba(255, 255, 255, 0.1);
    }
    
    table {
      th, td {
        border-color: rgba(255, 255, 255, 0.3);
      }
      
      th {
        background-color: rgba(255, 255, 255, 0.1);
      }
    }
  }
}

// 助手消息中的markdown样式（灰色主题）
.assistant-message .markdown-renderer {
  :deep(.md-editor-preview) {
    color: #333;
  }
}
</style>