import { createRouter, createWebHashHistory, RouteRecordRaw } from 'vue-router'
import store from '@/store'
const routes: Array<RouteRecordRaw> = [
  {
    path: '/login',
    name: 'login',
    component: () => import('../views/Login.vue'),
    meta: {
      title: '登录'
    }
  },
  {
    path: '/',
    name: '_home',
    redirect: '/home',
    component: () => import('../components/layout.vue'),
    meta: {
      title: '首页'
    },
    children: [
      {
        path: '/home',
        name: 'home',
        component: () => import('../views/HomeView.vue'),
        meta: {
          title: '首页'
        }
      },
      {
        path: '/visitedpage',
        name: 'visitedPage',
        component: () => import('../views/Reports/VisitedPage.vue'),
        meta: {
          title: '受访页面'
        }
      },
      {
        path: '/district',
        name: 'district',
        component: () => import('../views/Reports/District.vue'),
        meta: {
          title: '区域分布'
        }
      },
      {
        path: '/comparison',
        name: 'comparison',
        component: () => import('../views/Reports/Comparison.vue'),
        meta: {
          title: '数据对比'
        }
      },
    ]
  },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})
router.beforeEach((to, from, next) => {
  if (to.path === '/login') {
    next()
  } else {
    if (localStorage.getItem('loginUser')) {
      const title: any = to.meta.title
      const index = store.state.routerMeunMessage.findIndex((item) => { return item.title === title })
      if (index === -1) {
        store.commit("pushRouterMeunMessage", to.path)
      }
      next()
    } else {
      next('/login')
    }
  }
});

router.onError((err) => {
  console.log(err)
})
export default router
