import { createApp } from 'vue'
import App from './App.vue'
import store from './store'
import router from './router'
import '@/assets/scss/reset.scss';
import ElementPlus from 'element-plus'
import 'element-plus/theme-chalk/index.css'
import locale from 'element-plus/es/locale/lang/zh-cn';

// 阻止 ResizeObserver 良性报错触发 webpack overlay 全屏遮罩
window.onerror = function (msg) {
  if (typeof msg === 'string' && msg.indexOf('ResizeObserver') !== -1) {
    return true
  }
}

const app = createApp(App).use(router).use(store).use(ElementPlus, { locale })
app.mount('#app')
