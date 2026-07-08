# 百度统计看板 (baidutrack)

基于 Vue 3 的百度统计数据分析看板，对接[百度统计 API](https://tongji.baidu.com/) 获取网站流量数据，支持多维度报表展示和数据导出。

## 功能

- **受访页面分析** — 页面级 PV/UV/IP 等指标，支持 URL 关键字过滤、分页、列配置
- **区域分布** — 按省份/城市查看访问分布，支持维度切换
- **产品页分析** — 按产品组聚合页面数据，支持当月/环比/同比周期
- **周报** — 多维度统计（按日/按组/默认），全面数据汇总
- **列配置** — 自定义指标展示，配置自动持久化
- **数据导出** — Excel 导出（xlsx 格式）

## 技术栈

| 技术 | 说明 |
|------|------|
| Vue 3 | Composition API + Options API |
| TypeScript | 类型支持 |
| Vue Router 4 | Hash 路由 |
| Vuex 4 | 状态管理 |
| Element Plus | UI 组件库 |
| Axios | HTTP 请求 |
| dayjs | 日期处理 |
| xlsx + file-saver | Excel 导出 |

## 快速开始

### 环境要求

Node.js >= 14

### 安装

```bash
npm install
```

### 开发

```bash
npm run dev
```

开发服务器默认运行在 `http://localhost:8080`，API 请求代理到百度统计接口。

### 构建

```bash
npm run build
```

### 使用说明

1. 登录页面输入百度统计 API 的用户名和 Access Token
2. 登录后在顶部下拉选择要分析的站点
3. 左侧菜单进入各报表页面，设置日期范围后点击查询
4. 可通过"列配置"按钮自定义显示的指标列
5. 点击"导出"按钮下载 Excel 报表

> 百度统计 Access Token 获取方式：登录 [百度统计](https://tongji.baidu.com/) → 个人中心 → API 管理

## 项目结构

```
src/
├── main.ts                 # 入口
├── App.vue                 # 根组件
├── router/index.ts         # 路由配置
├── store/index.ts          # Vuex 状态管理
├── http/
│   ├── request.ts          # Axios 实例 + 拦截器
│   └── api.ts              # API 方法
├── utils/
│   ├── export.ts           # Excel 导出工具
│   └── metrics.ts          # 指标配置 + 持久化
├── components/
│   ├── layout.vue          # 主布局（头部+侧栏+标签页）
│   ├── PageView.vue        # 通用表格组件（受访页面用）
│   └── MetricSelector.vue  # 列配置选择器
├── views/
│   ├── Login.vue           # 登录页
│   ├── HomeView.vue        # 首页仪表盘
│   └── Reports/
│       ├── VisitedPage.vue # 受访页面
│       ├── District.vue    # 区域分布
│       ├── Product.vue     # 产品页分析
│       └── WeeklyReport.vue# 周报
└── assets/
    ├── scss/reset.scss     # 全局样式重置
    └── images/             # 图片资源
```

## 配置

开发代理配置在 `vue.config.js`，默认将 `/api` 请求代理至 `https://api.baidu.com`。

## License

MIT
