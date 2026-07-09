<template>
  <div class="home">
    <el-header>
      <div class="header-left">
        <el-icon class="collapse-btn" @click="isCollapse = !isCollapse">
          <fold v-if="!isCollapse" />
          <expand v-else />
        </el-icon>
        <h1>百度统计工具</h1>
      </div>
      <div class="toolbar">
        <el-dropdown @command="changeSite">
          <span class="el-dropdown-link">
            {{ curSite.domain
            }}<el-icon class="el-icon--right"><arrow-down /></el-icon>
          </span>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item
                v-for="item in siteList"
                :key="item.site_id"
                :command="item"
                >{{ item.domain }}</el-dropdown-item
              >
            </el-dropdown-menu>
          </template>
        </el-dropdown>
        <el-dropdown @command="changeUser">
          <span class="el-dropdown-link">
            {{ userName
            }}<el-icon class="el-icon--right"><arrow-down /></el-icon>
          </span>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="exit">退出</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </el-header>
    <el-container>
      <el-aside :width="isCollapse ? '64px' : '200px'">
        <el-menu
          :default-active="menuActive"
          mode="vertical"
          :collapse="isCollapse"
          :collapse-transition="false"
          @select="menuClick"
        >
          <el-menu-item
            v-for="item in $store.state.menuRouter"
            :index="item.path"
            :key="item.path"
          >
            <el-icon><component :is="iconMap[item.icon]" /></el-icon>
            <template #title>{{ item.title }}</template>
          </el-menu-item>
        </el-menu>
      </el-aside>
      <el-main>
        <el-tabs
          type="card"
          v-model="active_name"
          @tab-click="tabClick"
          @tab-remove="tabRemove"
        >
          <el-tab-pane
            :key="item.path"
            v-for="item in $store.state.routerMeunMessage"
            :label="item.title"
            :name="item.path"
            :closable="item.title !== '首页'"
          >
            <keep-alive>
              <router-view></router-view>
            </keep-alive>
          </el-tab-pane>
        </el-tabs>
      </el-main>
    </el-container>
  </div>
</template>

<script lang="ts" setup>
import { ArrowDown, Fold, Expand, HomeFilled, View, Location } from "@element-plus/icons-vue";
import { ref, onMounted, watch } from "vue";
import store from "@/store";
import router from "@/router";
import api from "@/http/api";
import { useRoute } from "vue-router";

const siteList = ref([]);
const curSite = ref({});
const userName = ref("");
const isCollapse = ref(false);
const menuActive = ref("/home");
const active_name = ref("/home");
const route = useRoute();

const iconMap: Record<string, any> = {
  HomeFilled,
  View,
  Location,
};

const getSiteList = () => {
  api.getSiteList().then((res) => {
    if (res) {
      siteList.value = res.body.data[0].list;
      curSite.value = siteList.value[0];
      store.commit("setSite", curSite.value);
    }
  });
};

const changeSite = (command) => {
  curSite.value = command;
  store.commit("setSite", command);
};

const changeUser = (command: string | number | object) => {
  if (command === "exit") {
    localStorage.removeItem("loginUser");
    store.commit("setSite", {});
    store.commit("initRouterMeunMessage");
    router.push("/login");
  }
};

const menuClick = (path: string) => {
  menuActive.value = path;
  const menurouters = store.state.routerMeunMessage;
  const menuIndex = menurouters.findIndex((item) => item.path === path);

  if (menuIndex !== -1) {
    active_name.value = menurouters[menuIndex].path;
  } else {
    store.commit("pushRouterMeunMessage", path);
    active_name.value = path;
  }
  router.push(path);
};

const tabClick = (nowTabMessage) => {
  const path = nowTabMessage.props.name;
  if (path === route.path) return;
  router.push(path);
};

const tabRemove = (path) => {
  store.commit("removeRouterMeunMessage", path);
  const messages = store.state.routerMeunMessage;
  const prevpath = messages[messages.length - 1].path;
  router.push(prevpath);
};

watch(
  () => route.path,
  (newRoute) => {
    menuActive.value = newRoute;
    active_name.value = newRoute;
  }
);

onMounted(() => {
  getSiteList();
  const user = localStorage.getItem("loginUser");
  if (user) {
    try {
      userName.value = JSON.parse(user).userName || "";
    } catch {
      userName.value = "";
    }
  }
});
</script>
<style scoped lang="less">
.home {
  .el-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: #fff;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
    padding: 0 20px;
    font-size: 18px;
    z-index: 10;
    height: 56px;
  }
  .header-left {
    display: flex;
    align-items: center;
    gap: 14px;
    .collapse-btn {
      font-size: 20px;
      cursor: pointer;
      color: #666;
      &:hover { color: #409eff; }
    }
    h1 {
      font-size: 18px;
      font-weight: 600;
      color: #1a1a1a;
      white-space: nowrap;
    }
  }
  .el-aside {
    transition: width 0.25s;
    overflow: hidden;
    background: #fff;
    box-shadow: 2px 0 8px rgba(0, 0, 0, 0.04);
  }
  .el-menu {
    height: 100%;
    border-right: none;
  }
  .el-main {
    padding: 16px;
    background: #f0f2f5;
  }
  .toolbar {
    display: inline-flex;
    align-items: center;
    gap: 16px;
    height: 100%;
    font-size: 14px;
    .el-dropdown { cursor: pointer; }
  }
  :deep(.el-container) {
    height: calc(100vh - 56px);
  }
  :deep(.el-tabs) {
    --el-tabs-header-height: 40px;
    .el-tabs__header {
      margin-bottom: 0;
      background: #fff;
      border-radius: 8px 8px 0 0;
      padding: 4px 12px 0;
      border-bottom: 1px solid #eee;
    }
    .el-tabs__nav { border: none; }
    .el-tabs__item {
      height: 36px;
      line-height: 36px;
      font-size: 13px;
      border-radius: 6px 6px 0 0;
    }
    .el-tabs__content {
      padding: 0;
    }
  }
}
</style>
