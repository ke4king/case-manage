import { createApp } from 'vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import zhCn from 'element-plus/dist/locale/zh-cn.mjs'
import App from './App.vue'
import router from './router'
import store from './store'
import './assets/main.css'
import './assets/element-overrides.css'
import 'md-editor-v3/lib/style.css'
import { MdEditor, MdPreview, config } from 'md-editor-v3'
import 'md-editor-v3/lib/preview.css'

// 配置 md-editor-v3 使用 class 类型的图标，解决 SVG 图标不显示问题
config({
  iconfontType: 'class'
})

const app = createApp(App)

app.use(store)
app.use(router)
app.use(ElementPlus, {
  locale: zhCn,
  size: 'default'
})

// 注册组件
app.component('MdEditor', MdEditor)
app.component('MdPreview', MdPreview)

app.mount('#app') 