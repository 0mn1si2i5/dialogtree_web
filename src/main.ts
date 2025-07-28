import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ArcoVue from '@arco-design/web-vue'
import App from './App.vue'
import router from './router'

// Import Arco Design styles
import '@arco-design/web-vue/dist/arco.css'

// Import global styles
import './styles/global.less'

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(ArcoVue)

app.mount('#app') 