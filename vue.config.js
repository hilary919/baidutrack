const { defineConfig } = require('@vue/cli-service')
module.exports = defineConfig({
  transpileDependencies: true,
  lintOnSave: false,
  devServer: {
    client: {
      overlay: false,
    },
    proxy: {
      '/api': {
        target: 'https://api.baidu.com', // 你要跨域的网址 比如 'http://news.baidu.com',
        secure: true, // 如果是https接口，需要配置这个参数
        changeOrigin: true,
        pathRewrite: {
          '^/api': ''
        },
        onProxyReq (proxyReq) {
          proxyReq.removeHeader('origin')
        }
      }
    },
  },
})
