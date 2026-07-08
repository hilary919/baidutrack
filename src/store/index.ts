import { createStore } from 'vuex'

export default createStore({
  state: {
    site: {},
    routerMeunMessage: [{
      title: '首页',
      path: '/home',
    }],
    menuRouter: [
      {
        title: '首页',
        path: '/home',
        icon: 'HomeFilled'
      },
      {
        title: '受访页面',
        path: '/visitedpage',
        icon: 'View'
      },
      {
        title: '区域分布',
        path: '/district',
        icon: 'Location'
      },
      // {
      //   title: '产品页',
      //   path: '/product',
      //   icon: 'Goods'
      // },
      // {
      //   title: '周报',
      //   path: '/weeklyreport',
      //   icon: 'DataAnalysis'
      // }
    ]
  },
  getters: {
  },
  mutations: {
    setSite(state, x) {
      state.site = x
    },
    pushRouterMeunMessage(state, path) {
      const [page] = state.menuRouter.filter(item => item.path === path)
      page && state.routerMeunMessage.push(page)
    },
    removeRouterMeunMessage(state, path) {
      state.routerMeunMessage.some((item, i) => {
        if (item.path === path) {
          state.routerMeunMessage.splice(i, 1)
          return true
        }
      })

    },
    initRouterMeunMessage(state) {
      state.routerMeunMessage = [{
        title: '首页',
        path: '/home',
      }]
    },
  },
  actions: {
  },
  modules: {
  }
})
