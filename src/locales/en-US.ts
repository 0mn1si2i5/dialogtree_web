export default {
  common: {
    confirm: 'Confirm',
    cancel: 'Cancel',
    save: 'Save',
    delete: 'Delete',
    edit: 'Edit',
    create: 'Create',
    loading: 'Loading...',
    success: 'Success',
    error: 'Error',
    warning: 'Warning'
  },
  
  sidebar: {
    sessions: 'Sessions',
    categories: 'Categories',
    selectCategory: 'Select Category',
    allCategories: 'All Categories',
    newSession: 'New Session',
    newCategory: 'New Category',
    sessionCount: '{count} Sessions',
    noSessions: 'No sessions',
    noCategories: 'No categories'
  },
  
  chat: {
    inputPlaceholder: 'Enter your question here',
    send: 'Send',
    sendTip: 'Ctrl + Enter to send directly',
    continueFromNode: 'Continue from selected node',
    emptyState: 'Click a node in the dialog tree to view chat history',
    selectSession: 'Session is empty, start a new conversation',
    copyContent: 'Copy Content',
    copySuccess: 'Content copied to clipboard',
    copyFailed: 'Copy failed, please copy manually',
    nodeSelected: 'Node selected as branch point, you can now input new questions',
    star: 'Star',
    unstar: 'Unstar',
    addComment: 'Add Comment',
    continueConversation: 'Continue from here',
    comment: 'Comment',
    viewComment: 'View Comment'
  },
  
  tree: {
    fitScreen: 'Fit Screen',
    actualSize: 'Actual Size',
    resetLayout: 'Reset Layout',
    expandPanel: 'Expand Chat Panel',
    restorePanel: 'Restore Normal Size',
    hidePanel: 'Hide Chat Panel',
    showPanel: 'Show Chat Panel',
    dragHint: 'Hold Cmd/Alt+Left Click to drag'
  },
  
  session: {
    rename: 'Rename',
    move: 'Move Category',
    delete: 'Delete',
    star: 'Star',
    comment: 'Comment',
    branch: 'Branch',
    createSession: 'Create Session',
    createCategory: 'Create Category',
    renameSession: 'Rename Session',
    renameCategory: 'Rename Category',
    moveSession: 'Move Session',
    sessionTitle: 'Session Title',
    categoryName: 'Category Name',
    enterSessionTitle: 'Enter session title',
    enterCategoryName: 'Enter category name',
    enterNewSessionTitle: 'Enter new session title',
    enterNewCategoryName: 'Enter new category name',
    selectNewCategory: 'Select new category'
  },
  
  header: {
    switchLanguage: '切换中文',
    fullscreen: 'Fullscreen',
    exitFullscreen: 'Exit Fullscreen'
  },
  
  tutorial: {
    nav: {
      previous: 'Previous',
      next: 'Next',
      start: 'Get Started',
      skip: 'Skip Tutorial',
      help: 'View Tutorial'
    },
    welcome: {
      title: 'Welcome to DialogTree!',
      subtitle: 'More than just chat, this is a purposeful thinking journey',
      intro: {
        title: 'Have you ever encountered these troubles when using AI conversations:',
        pain1: '- Want to review past conversations but can\'t find your original questions?',
        pain2: '- Had inspiring answers that got buried in messy records?',
        pain3: '- Want to systematically organize knowledge but find the conversation context chaotic?',
        pain4: '- Want to expand another line of thinking from a conversation point but can\'t find the entry?'
      },
      solution: {
        title: 'DialogTree was born to solve these troubles!',
        desc: 'Here, every conversation is a "knowledge tree", and every Q&A is an expandable knowledge branch, gradually building clear structure and thinking context.'
      },
      features: {
        title: 'Starting now, with Dialog Tree:',
        feature1: 'Deeply communicate with AI like taking notes',
        feature2: 'Manage every question like managing mind maps',
        feature3: 'Build your own AI knowledge graph!'
      }
    },
    basics: {
      title: 'Basic Layout',
      slides: [
        {
          title: 'Left Directory Area',
          desc: 'Includes all session lists and session category management, supports create, rename, delete operations to help you overview sessions',
          image: '/screenshot/1-1.png'
        },
        {
          title: 'Central Tree Display Area',
          desc: 'Generates structured maps of current sessions anytime, with core summaries of each conversation, helping you build clear structure and thinking context',
          image: '/screenshot/1-2.png'
        },
        {
          title: 'Right Q&A Area',
          desc: 'Area for interacting with AI, supports conversation branching, bookmarking, commenting, and Markdown format rendering',
          image: '/screenshot/1-3.png'
        }
      ]
    },
    advanced: {
      title: 'Dialog Management',
      slides: [
        {
          title: 'Node Feature Support',
          desc: 'Every node in the conversation tree supports summary, bookmarking, commenting and other functions',
          image: '/screenshot/2-1.png'
        },
        {
          title: 'Clear Backtracking Path',
          desc: 'Selecting any conversation node provides clear backtracking paths',
          image: '/screenshot/2-2.png'
        },
        {
          title: 'Branch Extension Feature',
          desc: 'Any conversation node can be selected to branch new conversations from the current node',
          image: '/screenshot/2-3.png'
        }
      ]
    },
    complete: {
      title: 'Ready to Go!',
      desc: 'That\'s the introduction to DialogTree. Now you have mastered the core features, please start creating your own intelligent conversation trees!',
      demo: 'Note: This is a Demo site, all data will be reset after 2 hours.',
      reference: 'For more information, welcome to visit my ',
      github: 'GitHub',
      githubUrl: 'https://github.com/liran906/DialogTree',
      or:' or ',
      blog: 'Blog',
      blogUrl: 'https://blog.golir.top/article/30'
    }
  }
}