export default {
  common: {
    confirm: '确认',
    cancel: '取消',
    save: '保存',
    delete: '删除',
    edit: '编辑',
    create: '创建',
    loading: '加载中...',
    success: '成功',
    error: '错误',
    warning: '警告'
  },
  
  sidebar: {
    sessions: '会话列表',
    categories: '分类管理',
    selectCategory: '选择分类',
    allCategories: '全部分类',
    newSession: '新建会话',
    newCategory: '新建分类',
    sessionCount: '{count} 个会话',
    noSessions: '暂无会话',
    noCategories: '暂无分类'
  },
  
  chat: {
    inputPlaceholder: '输入您的问题...',
    send: '发送',
    sendTip: 'Ctrl + Enter 快速发送',
    continueFromNode: '将从选中节点继续对话',
    emptyState: '点击对话树中的节点查看对话历史',
    selectSession: '当前会话无内容，即刻开始对话吧',
    copyContent: '复制内容',
    copySuccess: '内容已复制到剪贴板',
    copyFailed: '复制失败，请手动复制',
    nodeSelected: '已选择此节点作为分叉起点，现在可以输入新问题',
    star: '收藏',
    unstar: '取消收藏',
    addComment: '添加评论',
    continueConversation: '从此处继续对话'
  },
  
  tree: {
    fitScreen: '适应屏幕',
    actualSize: '实际大小',
    resetLayout: '重置布局',
    expandPanel: '展开聊天面板',
    restorePanel: '恢复正常大小',
    hidePanel: '隐藏聊天面板',
    showPanel: '显示聊天面板',
    dragHint: '按住 Cmd/Alt+左键可以拖动'
  },
  
  session: {
    rename: '重命名',
    move: '移动分类',
    delete: '删除',
    star: '收藏',
    comment: '评论',
    branch: '分支',
    createSession: '创建会话',
    createCategory: '创建分类',
    renameSession: '重命名会话',
    renameCategory: '重命名分类',
    moveSession: '移动会话',
    sessionTitle: '会话标题',
    categoryName: '分类名称',
    enterSessionTitle: '请输入会话标题',
    enterCategoryName: '请输入分类名称',
    enterNewSessionTitle: '请输入新的会话标题',
    enterNewCategoryName: '请输入新的分类名称',
    selectNewCategory: '选择新的分类'
  },
  
  tutorial: {
    nav: {
      previous: '上一页',
      next: '下一页',
      start: '开始使用',
      skip: '跳过教程',
      help: '查看教程'
    },
    welcome: {
      title: '欢迎来到 DialogTree！',
      subtitle: '不只是聊天，这是一次有方向的思考旅程',
      intro: {
        title: '你是否在使用 AI 对话时也曾遇到过这些困扰：',
        pain1: '- 想复盘过去的对话，却怎么都找不到当初的提问？',
        pain2: '- 明明曾经获得过启发性的回答，却被淹没在杂乱的记录中？',
        pain3: '- 想系统整理一个知识点，却发现对话上下文混乱零散？',
        pain4: '- 想从某个对话点继续展开另一条思路，却苦于找不到入口？'
      },
      solution: {
        title: 'DialogTree 正是为了解决这些烦恼而生！',
        desc: '在这里，每一次会话都是一棵"知识树"，每一次问答，都是可延展的知识分支，逐步构建出清晰的结构与思维脉络。'
      },
      features: {
        title: '从现在开始，与 Dialog Tree 一起：',
        feature1: '像写笔记一样与 AI 深度交流',
        feature2: '像管理思维导图一样管理你的每一次提问',
        feature3: '构建你自己的 AI 知识图谱！'
      }
    },
    basics: {
      title: '基本布局',
      slides: [
        {
          title: '左侧目录区域',
          desc: '包括所有会话列表和会话分类管理，支持创建、重命名、删除等操作，帮您总览会话情况',
          image: '/screenshot/1-1.png'
        },
        {
          title: '中央树形显示区域',
          desc: '随时生成当前会话的结构化图谱，附带每次对话核心摘要，帮助你构建出清晰的结构与思维脉络',
          image: '/screenshot/1-2.png'
        },
        {
          title: '右侧问答区',
          desc: '与 AI 交互的区域，支持对话衍伸分叉、收藏、评论，支持 Markdown 格式渲染',
          image: '/screenshot/1-3.png'
        }
      ]
    },
    advanced: {
      title: '对话管理',
      slides: [
        {
          title: '节点功能支持',
          desc: '会话树中的每一个节点都支持摘要、收藏、评论等功能',
          image: '/screenshot/2-1.png'
        },
        {
          title: '清晰回溯路径',
          desc: '选取任何对话节点都有清晰回溯路径',
          image: '/screenshot/2-2.png'
        },
        {
          title: '分支衍生功能',
          desc: '选择任意对话节点都可以从当前节点衍伸新的分支会话',
          image: '/screenshot/2-3.png'
        }
      ]
    },
    complete: {
      title: '准备就绪！',
      desc: '好了！以上就是关于 DialogTree 的介绍，现在您已经掌握了 DialogTree 的核心功能，请开始创建属于您的智能对话树吧！',
      demo: '注：本站点为 Demo 站点，所有数据将在 2 小时后重置。',
      github: '更多咨询欢迎浏览我的 GitHub',
      githubUrl: 'https://github.com/liran906/DialogTree'
    }
  }
}